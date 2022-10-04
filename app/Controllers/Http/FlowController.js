"use strict";

const Flow = use("App/Models/Flow");
const FlowType = use("App/Models/FlowType");
const FlowCombination = use("App/Models/FlowCombination");
const FlowDownload = use("App/Models/FlowDownload");
const Reseller = use('App/Models/Reseller')

const Logger = use("Logger");

const Helpers = use("Helpers");
const fs = use("fs");
const readFile = Helpers.promisify(fs.readFile);

const FileType = require("file-type");

var parser = require("xml2json");
const formatXml = require("xml-formatter");

const moment = require("moment");
const unzipper = require("unzipper");

var archiver = require("archiver");

const sleep = require("util").promisify(setTimeout);
const Redis = use("Redis");

class FlowController {
  async checkStatus({ request, response }) {
    return await Redis.get("uploading-flows");
  }

  async uploadFlows({ request, response }) {
    await Redis.set("uploading-flows", true);
    await Redis.expire("uploading-flows", 10);

    const { files } = request.all();

    files.forEach(async file => {
      var buffer = new Buffer.from(file.base64, "base64");

      let flowFolder =
        "storage/siicloudgas/uploads/" + moment().format("YYYYMM");

      fs.existsSync(flowFolder) ||
        fs.mkdirSync(flowFolder, { recursive: true });

      fs.writeFileSync(
        flowFolder + "/" + file.filename,
        buffer,
        { encoding: "base64", flag: "w" },
        function(res) {
          console.log("File created");
        }
      );
    });
  }

  findVal(object, key) {
    var value;
    Object.keys(object).some(k => {
      if (k.toLowerCase() === key.toLowerCase()) {
        value = object[k];
        return true;
      }
      if (object[k] && typeof object[k] === "object") {
        value = this.findVal(object[k], key);
        return value !== undefined;
      }
    });
    return value;
  }

  async downloadFlows({ request, response, auth, params }) {
    const showAll = request.input("showAll", false);
    let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

    var subResellers = []
    if(auth.user.master_reseller && whiteLabel == 'true' )
    subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')

    const format = request.input("format", "xml");
    const ids = JSON.parse(request.input("ids"));

    const flowsData = await Flow.query()
      .whereIn("id", ids)
      .fetch();
    const flows = flowsData.toJSON();

    const flow_type = await FlowType.query()
      .where("service_code", flows[0].service_code)
      .where("flow_code", flows[0].flow_code)
      .first();

    const folderId = moment().valueOf() + "_" + moment().format("YYYYMMDD");
    const flowFolder = "storage/tmp/" + auth.user.vat_number + "/" + folderId;
    var filename;

    for (var i = 0; i < flows.length; i++) {
      var json = {};
      var datiPdrToAdd = [];

      var flow = flows[i];

      const queryPdrs = FlowCombination.query().where("flow_id", flow.id);

      queryPdrs.whereHas("customer", builder => {
        if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {

            if (subResellers.length > 0) {
                      builder.whereIn('resellers_customers.reseller_vat_number', subResellers)

            } else {
                builder.where('resellers_customers.reseller_vat_number', auth.user.vat_number)
            } 

            builder.whereRaw(
                "resellers_customers.date_from  <= flows_combinations.ref_date"
            );
            builder.where(inner => {
                inner
                .whereNull("resellers_customers.date_to")
                .orWhereRaw(
                    "resellers_customers.date_to <= flows_combinations.ref_date + interval '1 day'"
                );
            });
            }
      });

      const pdrs = await queryPdrs.pluck("pdp");

      const ext = flow.path
        .split(".")
        .pop()
        .toLowerCase();

      if (ext == "xml") {
        const bufferXml = fs.readFileSync(flow.path);

        json = JSON.parse(parser.toJson(bufferXml, { reversible: true }));

        var obj = undefined;

        if (json.Prestazione) {
          obj = json.Prestazione;
        }

        if (json.FlussoMisure) {
          obj = json.FlussoMisure;
        }

        if (json.FlussoIGMG) {
          obj = json.FlussoIGMG;
        }

        var DatiPdR = undefined;

        if (obj.DatiPdR) DatiPdR = obj.DatiPdR;

        if (obj.DatiPdr) DatiPdR = obj.DatiPdr;

        if (obj && DatiPdR && DatiPdR.length > 0) {
          for (var p = 0; p < DatiPdR.length; p++) {
            let tmpPdp = self.findVal(DatiPdR[p], "cod_pdr");

            if (tmpPdp && pdrs.includes(tmpPdp.$t)) {
              datiPdrToAdd.push(DatiPdR[p]);
            }

            /*
                            if (DatiPdR[p].cod_pdr && pdrs.includes(DatiPdR[p].cod_pdr.$t)) {
                                datiPdrToAdd.push(DatiPdR[p])
                            }
                            if (DatiPdR[p].cod_PdR && pdrs.includes(DatiPdR[p].cod_PdR.$t)) {
                                datiPdrToAdd.push(DatiPdR[p])
                            }
                            */
          }
        }

        var pdp = null;

        if (datiPdrToAdd.length > 0) {
          if (json.Prestazione) {
            if (json.Prestazione.DatiPdR) {
              json.Prestazione.DatiPdR = datiPdrToAdd;
            } else {
              json.Prestazione.DatiPdr = datiPdrToAdd;
            }
          }

          if (json.FlussoMisure) {
            if (json.FlussoMisure.DatiPdR) {
              json.FlussoMisure.DatiPdR = datiPdrToAdd;
            } else {
              json.FlussoMisure.DatiPdr = datiPdrToAdd;
            }
          }

          if (json.FlussoIGMG) {
            if (json.FlussoIGMG.DatiPdR) {
              json.FlussoIGMG.DatiPdR = datiPdrToAdd;
            } else {
              json.FlussoIGMG.DatiPdr = datiPdrToAdd;
            }
          }
        } else {
          pdp = this.findVal(json, "cod_pdr");

          /*
                        if (json.Prestazione) {
                            pdp = json.Prestazione.DatiTecnici && json.Prestazione.DatiTecnici.cod_pdr ? json.Prestazione.DatiTecnici.cod_pdr.$t : null
                        }
                        if (json.FlussoMisure) {
                            pdp = json.FlussoMisure.DatiTecnici && json.FlussoMisure.DatiTecnici.cod_pdr ? json.FlussoMisure.DatiTecnici.cod_pdr.$t : null
                        }
                        */
        }

        var resXml = parser.toXml(json);

        //filename = (flow_type.service_code ? flow_type.service_code : '') +flow_type.flow_code+'_'+moment().valueOf()+'_'+moment().format('YYYYMMDD')+'_'+ (!!pdp ? pdp.$t : (p+1))+'.xml'
        filename = flow.path.substring(flow.path.lastIndexOf("/") + 1);

        fs.existsSync(flowFolder) ||
          fs.mkdirSync(flowFolder, { recursive: true });
        fs.writeFileSync(
          flowFolder + "/" + filename,
          formatXml(resXml, { collapseContent: true })
        );
      } else if (ext == "zip") {
        const bufferZip = fs.readFileSync(flow.path);

        var self = this;

        async function unzipFile() {
          const zippedFiles = await unzipper.Open.buffer(bufferZip);

          for (var j = 0; j < zippedFiles.files.length; j++) {
            var xml = zippedFiles.files[j];
            datiPdrToAdd = [];

            if (
              zippedFiles.files[j].path
                .split(".")
                .pop()
                .toLowerCase() == "xml"
            ) {
              var xmlBuffer = await zippedFiles.files[j].buffer();
              json = JSON.parse(parser.toJson(xmlBuffer, { reversible: true }));

              var obj = undefined;

              if (json.Prestazione) {
                obj = json.Prestazione;
              }

              if (json.FlussoMisure) {
                obj = json.FlussoMisure;
              }

              if (json.FlussoIGMG) {
                obj = json.FlussoIGMG;
              }

              var DatiPdR = undefined;

              if (obj.DatiPdR) DatiPdR = obj.DatiPdR;

              if (obj.DatiPdr) DatiPdR = obj.DatiPdr;

              if (obj && DatiPdR && DatiPdR.length > 0) {
                for (var p = 0; p < DatiPdR.length; p++) {
                  let tmpPdp = self.findVal(DatiPdR[p], "cod_pdr");

                  if (tmpPdp && pdrs.includes(tmpPdp.$t)) {
                    datiPdrToAdd.push(DatiPdR[p]);
                  }
                  /*
                                    if (DatiPdR[p].cod_pdr && pdrs.includes(DatiPdR[p].cod_pdr.$t)) {
                                        datiPdrToAdd.push(DatiPdR[p])
                                    }
                                    if (DatiPdR[p].cod_PdR && pdrs.includes(DatiPdR[p].cod_PdR.$t)) {
                                        datiPdrToAdd.push(DatiPdR[p])
                                    }
                                    */
                }
              }
            }

            var pdp = null;

            if (datiPdrToAdd.length > 0) {
              if (json.Prestazione) {
                if (json.Prestazione.DatiPdR) {
                  json.Prestazione.DatiPdR = datiPdrToAdd;
                } else {
                  json.Prestazione.DatiPdr = datiPdrToAdd;
                }
              }

              if (json.FlussoMisure) {
                if (json.FlussoMisure.DatiPdR) {
                  json.FlussoMisure.DatiPdR = datiPdrToAdd;
                } else {
                  json.FlussoMisure.DatiPdr = datiPdrToAdd;
                }
              }

              if (json.FlussoIGMG) {
                if (json.FlussoIGMG.DatiPdR) {
                  json.FlussoIGMG.DatiPdR = datiPdrToAdd;
                } else {
                  json.FlussoIGMG.DatiPdr = datiPdrToAdd;
                }
              }
            } else {
              pdp = self.findVal(json, "cod_pdr");

              /*
                            if (json.Prestazione) {
                                pdp = json.Prestazione.DatiTecnici && json.Prestazione.DatiTecnici.cod_pdr ? json.Prestazione.DatiTecnici.cod_pdr.$t : null
                            }
                            if (json.FlussoMisure) {
                                pdp = json.FlussoMisure.DatiTecnici && json.FlussoMisure.DatiTecnici.cod_pdr ? json.FlussoMisure.DatiTecnici.cod_pdr.$t : null
                            } 
                            */
            }

            var resXml = parser.toXml(json);

            await sleep(150);
            //console.log(resXml)

            //filename = (flow_type.service_code ? flow_type.service_code : '')+flow_type.flow_code+'_'+moment().valueOf()+'_'+moment().format('YYYYMMDD')+'_'+ (!!pdp ? pdp.$t : (j+1))+'.xml'
            filename = flow.path.substring(flow.path.lastIndexOf("/") + 1);

            filename = filename.toUpperCase().replace(".ZIP", ".xml");

            fs.existsSync(flowFolder) ||
              fs.mkdirSync(flowFolder, { recursive: true });
            fs.writeFileSync(
              flowFolder + "/" + filename,
              formatXml(resXml, { collapseContent: true })
            );
          }
        }

        await unzipFile();
      }
    }

    var output = fs.createWriteStream(flowFolder + ".zip");

    var archive = archiver("zip");

    archive.on("error", function(err) {
      throw err;
    });

    archive.pipe(output);

    // append files from a sub-directory and naming it `new-subdir` within the archive (see docs for more options):
    archive.directory(flowFolder, false);
    await archive.finalize();

    await sleep(500);

    var fd = [];
    flows.forEach(f => {
      fd.push({
        flow_type_id: flow_type.id,
        flow_path: f.path,
        username: auth.user.username
      });
    });

    await FlowDownload.createMany(fd);

    return response.attachment(flowFolder + ".zip");
  }
}

module.exports = FlowController;
