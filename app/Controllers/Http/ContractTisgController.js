"use strict";

const ContractTisgImports = use("App/Models/ContractTisgImports");
const ContractTisgAnag = use("App/Models/ContractTisgAnag");
const ContractTisgSwin = use("App/Models/ContractTisgSwin");
const ContractTisgSwout = use("App/Models/ContractTisgSwout");
const Database = use("Database");
const Contract = use("App/Models/Contract");
const Reseller = use('App/Models/Reseller')

const Env = use("Env");
const mkdirp = require("mkdirp");
const unzipper = require("unzipper");
const fs = use("fs");
const Json2csvParser = require("json2csv").Parser;

const csv = require("csvtojson/v2");

class ContractTisgController {
  async getAll({ request, response, auth }) {
    try {
      const page = request.input("page", 1);
      const rowsPerPage = request.input("perPage", 9999);
      const sortBy = request.input("sortBy", "id");
      const order = request.input("order", "asc");
      const notError = request.input("not_error", false);
      const query = ContractTisgImports.query();
      if (notError) query.whereNull("errore");
      if (auth.user.superadmin)
        query.withCount("anag").withCount("swin").withCount("swout");
      response.success(
        await query.orderBy(sortBy, order).paginate(page, rowsPerPage)
      );
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }

  async checkIfExist(file) {
    try {
      var datafile = await file.buffer();
      let csvContent = datafile.toString().split("\n"); // read file and convert to array by line break
      let firstRow = csvContent[0].split(";");
      let mese = firstRow[3];
      let anno = firstRow[2];
      // CONTROLLO SE ESISTE UN'IMPORTAZIONE
      let checkRow = await ContractTisgImports.query()
        .where("mese", mese)
        .where("anno", anno)
        .first();
      if (checkRow)
        throw { message: "Già esiste un caricamento con le stesse date" };
      else return checkRow;
    } catch (error) {
      throw error;
    }
  }

  async uploadZip({ request, response, auth }) {
    await mkdirp.sync(Env.get("pathTisg"));
    const zipFile = request.file("file");
    const zip_name = Date.now() + ".zip";
    await zipFile.move(Env.get("pathTisg"), {
      name: zip_name,
      overwrite: true,
    });
    const bufferZip = fs.readFileSync(Env.get("pathTisg") + zip_name);
    const zippedFiles = await unzipper.Open.buffer(bufferZip);
    if (zippedFiles.files.length > 0) {
      let errorJson = [];
      const tisgImport = await ContractTisgImports.create({ uploading: true });
      // CONTROLLO SE ESISTE UN'IMPORTAZIONE
      try {
        await this.checkIfExist(zippedFiles.files[0]);
        let importati = 0;
        let errore = 0;
        let mese = null;
        let anno = null;
        for (var j = 0; j < zippedFiles.files.length; j++) {
          const trx = await Database.beginTransaction();
          try {
            let type = null;
            if (zippedFiles.files[j].path.toUpperCase().includes("SWOUT"))
              type = "SWOUT";
            if (zippedFiles.files[j].path.toUpperCase().includes("SWIN"))
              type = "SWIN";
            if (zippedFiles.files[j].path.toUpperCase().includes("ANAG"))
              type = "ANAG";
            var datafile = await zippedFiles.files[j].buffer();
            let csvContent = datafile.toString().split("\n"); // read file and convert to array by line break
            let firstRow = csvContent[0].split(";");
            mese = firstRow[3];
            anno = firstRow[2];
            csvContent.shift(); // remove the the first element from array
            csvContent = csvContent.join("\n"); // convert array back to string
            var dataFileJson = await csv({ delimiter: ";" }).fromString(
              csvContent
            );
            for (let i in dataFileJson) {
              if (type == "ANAG")
                await ContractTisgAnag.create(
                  { ...dataFileJson[i], import_tisg_id: tisgImport.id },
                  trx
                );
              if (type == "SWIN") {
                let checkExistence = await Contract.query()
                  .where("pdp", dataFileJson[i].COD_PDR)
                  .whereIn("status", ["TIM", "POS"])
                  .first();
                if (checkExistence) {
                  await ContractTisgSwin.create(
                    { ...dataFileJson[i], import_tisg_id: tisgImport.id },
                    trx
                  );
                  checkExistence.merge({ status: "OK" });
                  await checkExistence.save(trx);
                } else {
                  errorJson.push({
                    COD_PDR: dataFileJson[i].COD_PDR,
                    errore:
                      "Nessuna associazione trovata con il contratto o in uno stato differente",
                    nome_file: zippedFiles.files[j].path,
                  });
                }
              }
              if (type == "SWOUT")
                await ContractTisgSwout.create(
                  { ...dataFileJson[i], import_tisg_id: tisgImport.id },
                  trx
                );
            }
            trx.commit();
            importati += 1;
          } catch (error) {
            errore += 1;
            trx.rollback();
          }
        }
        await tisgImport.merge({
          mese,
          anno,
          tot_file_positivi: importati,
          tot_file_negativi: errore,
          uploading: false,
          errore_swin: JSON.stringify(errorJson),
        });
        await tisgImport.save();
      } catch (error) {
        await tisgImport.merge({
          errore: error.message,
          uploading: false,
          errore_swin: errorJson,
        });
        await tisgImport.save();
      }
    }
  }

  async downloadFile({ request, response, auth }) {
    let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
    let stringUuids = `'${auth.user.uuid}'`
    if(auth.user.master_reseller && whiteLabel == 'true') {
      var resellersUuids = []
      resellersUuids = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('uuid')
      stringUuids = ''
      for(let i in resellersUuids) {
        stringUuids+= `'${resellersUuids[i]}'`
        if(i != resellersUuids.length-1)stringUuids+=','
      }
    }
    try {
      const id = request.input("id");
      const type = request.input("type");
      let row = await ContractTisgImports.query().where("id", id).first();
      let query = null;
      let queryArray = [];
      if (type === "ANAG") {
        let lastDay = new Date(
          "20" + Number(row.anno),
          Number(row.mese),
          0
        ).getDate();
        queryArray = [
          row.mese,
          row.anno,
          "20" + row.anno,
          row.mese,
          "20" + row.anno,
          row.mese,
          lastDay,
        ];
        query = `select cta."COD_PDR",
        cta."COD_REMI",
        cta."ID_REG_CLIM",
        cta."CAP_TRASP_PDR",
        cta."PIVA_UDB",
        cta."DEFAULT_TRAS",
        cta."CF",
        cta."PIVA",
        cta."CF_STRANIERO",
        cta."STATO_PDR",
        cta."TIPO_PDR",
        cta."COD_PROF_PREL_STD",
        cta."PRELIEVO_ANNUO_PREV",
        cta."TRATTAMENTO",
        cta."TIPO_FORNITURA",
        cta."FO_DATA_INIZIO",
        cta."CODICE_COMUNE" from contract_tisg_anag cta 
        join contract_tisg_imports cti on cti.id = cta.import_tisg_id 
        join resellers_customers rc on rc.pdp = cta."COD_PDR" 
        join resellers r on rc.reseller_vat_number  = r.vat_number 
        where cti.mese = ? and cti.anno = ? 
        and rc.date_from <= make_date(?,?,'1') and (rc.date_to is null or rc.date_to <= make_date(?,?,?)) `;
        if (!auth.user.superadmin) {
          query += ` and r.uuid in (${stringUuids})`;
        }
      }
      if (type === "SWIN") {
        queryArray = [row.mese, row.anno];
        query = ` select cta."COD_PDR",
        cta."COD_REMI",
        cta."ID_REG_CLIM",
        cta."CAP_TRASP_PDR",
        cta."PIVA_UDB",
        cta."DEFAULT_TRAS",
        cta."CF",
        cta."PIVA",
        cta."CF_STRANIERO",
        cta."NOME",
        cta."COGNOME",
        cta."RAGIONE_SOCIALE_DENOMINAZIONE",
        cta."STATO_PDR",
        cta."TIPO_PDR",
        cta."MATR_MIS",
        cta."CLASSE_GRUPPO_MIS",
        cta."UB_TOPONIMO",
        cta."UB_VIA",
        cta."UB_CIV",
        cta."UB_CAP",
        cta."UB_ISTAT",
        cta."UB_LOCALITA",
        cta."UB_PROV",
        cta."UB_NAZIONE",
        cta."UB_ALTRO",
        cta."AF_CF",
        cta."AF_PIVA",
        cta."AF_CF_STRANIERO",
        cta."AF_NOME",
        cta."AF_COGNOME",
        cta."AF_RAGIONE_SOCIALE_DENOMINAZIO",
        cta."ES_TOPONIMO",
        cta."ES_VIA",
        cta."ES_CIV",
        cta."ES_CAP",
        cta."ES_ISTAT",
        cta."ES_LOCALITA",
        cta."ES_PROV",
        cta."ES_NAZIONE",
        cta."ES_ALTRO",
        cta."COD_PROF_PREL_STD",
        cta."PRELIEVO_ANNUO_PREV",
        cta."TRATTAMENTO",
        cta."MAX_PRELIEVO_ORA",
        cta."PRESS_MISURA",
        cta."TIPO_FORNITURA",
        cta."BONUS",
        cta."BS_DATA_INIZIO",
        cta."BS_DATA_FINE",
        cta."BS_DATA_RINNOVO",
        cta."BS_TIPO_BONUS",
        cta."FO_DATA_INIZIO",
        cta."CODICE_COMUNE" from contract_tisg_swin cta 
        join contract_tisg_imports cti on cti.id = cta.import_tisg_id 
        join contracts c on cta."COD_PDR" = c.pdp and to_date(cta."FO_DATA_INIZIO",'DD/MM/YYYY') = c.date_switch and c.status = 'OK'
        where cti.mese = ? and cti.anno = ? `;
        if (!auth.user.superadmin) {
          query += ` and c.reseller_uuid in (${stringUuids})`;
        }
      }
      if (type === "SWOUT") {
        let meseForQuery =
          row.mese == "01"
            ? "12"
            : (Number(row.mese) - 1).toString().padStart(2, "0");
        let annoForQuery =
          row.mese == "01"
            ? "20" + (Number(row.anno) - 1).toString()
            : "20" + row.anno;
        queryArray = [
          row.mese,
          row.anno,
          annoForQuery,
          meseForQuery,
          annoForQuery,
          meseForQuery,
        ];
        query = `select cts."COD_PDR",cts."COD_REMI",cts."PIVA_UDB",cts."DEFAULT_TRAS",cts."CF",cts."PIVA",cts."CF_STRANIERO" 
        from contract_tisg_swout cts 
        join contract_tisg_imports cti on cti.id = cts.import_tisg_id 
        join resellers_customers rc on rc.pdp = cts."COD_PDR" 
        join resellers r on rc.reseller_vat_number  = r.vat_number 
        where cti.mese = ? and cti.anno = ? 
        and rc.date_from <= make_date(?,?,'1') and (rc.date_to is null or rc.date_to >= make_date(?,?,'1')) `;
        if (!auth.user.superadmin) {
          query += ` and r.uuid in (${stringUuids})`;
        }
      }
      const queryRaw = await Database.raw(query, queryArray);
      const json2csvParser = new Json2csvParser({
        header: true,
        delimiter: ";",
        escapedQuote: "",
        quote: "",
      });
      return await json2csvParser.parse(queryRaw.rows);
    } catch (error) {
      console.log(error)
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }
}

module.exports = ContractTisgController;
