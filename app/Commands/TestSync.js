
'use strict'

const Task = use('Task')
const Flow = use('App/Models/Flow')
const FlowType = use('App/Models/FlowType')
const FlowCombination = use('App/Models/FlowCombination')

const moment = require('moment')

const unzipper = require('unzipper')

const Logger = use('Logger')


const { Command } = require('@adonisjs/ace')

class TestSync extends Command {
  static get signature() {
    return 'test:sync'
  }

  static get description() {
    return 'Tell something helpful about this command'
  }

  async handle(args, options) {


      const lastSync = moment('2015-01-01T21:13:08.134Z')

      const { promisify } = require('util');
      const { resolve } = require('path');
      const fs = require('fs');
      const readdir = promisify(fs.readdir);
      const stat = promisify(fs.stat);
      const url = require('url');

      async function getFiles(dir) {
        const subdirs = await readdir(dir);
        const files = await Promise.all(subdirs.map(async (subdir) => {
          const res = resolve(dir, subdir);
          const stats = await stat(res)
          var data = { commodity: 'g', path: url.pathToFileURL(res).pathname.split('reseller-api/').pop(), size: stats.size, created_at: stats.ctime, updated_at: stats.ctime }
          if ((stats.isDirectory() || ['xml', 'zip'].includes(data.path.split('.').pop().toLowerCase())) && moment(stats.ctime) > lastSync)
            return stats.isDirectory() ? getFiles(res) : data;
          else return
        }));
        var res = files.reduce((a, f) => a.concat(f), []);
        return res.filter(function (el) {
          return el != undefined;
        });
      }


      getFiles('storage/siicloudgas/TMG_00353660400_07624531211/2021/0308')
        .then(async (files) => {

          console.log(files)


          Logger.info('Totale file da importare: ' + files.length)


          var fs = require('fs');
          var parser = require('xml2json');

          function findVal(object, key) {
            var value;
            Object.keys(object).some(function (k) {
              if (k.toLowerCase() === key.toLowerCase()) {
                value = object[k];
                return true;
              }
              if (object[k] && typeof object[k] === 'object') {
                value = findVal(object[k], key);
                return value !== undefined;
              }
            });
            return value;
          }



          for (let fk = 0; fk < files.length; fk++) {


            var file = files[fk]

            //console.log(file.path)

            Logger.info('File da importare: ' + file.path)

            var flow = await Flow.query().where('path', file.path).first()
            Logger.info('Flusso non trovato... importazione...')


            //console.log(flow)

            if (flow) {
              Logger.info('Flusso esistente: ' + flow.id)
              //console.log('esco')
              continue
            }




            var data = fs.readFileSync(file.path)

            if (file.path.split('.').pop().toLowerCase() == 'xml') {

              Logger.info('Lavoro file Xml')


              //console.log(file.path)

              try {

                var json = JSON.parse(parser.toJson(data, { reversible: false }));
                var ref_month = findVal(json, 'mese_comp')


                if (json['ns0:Prestazione']) {
                  json.Prestazione = json['ns0:Prestazione']
                }


                var obj = {}

                if (json.Prestazione) {
                  obj = json.Prestazione
                }


                if (json.FlussoMisure) {
                  obj = json.FlussoMisure
                }

                if (json.FlussoIGMG) {
                  obj = json.FlussoIGMG
                }


                file.service_code = obj.cod_servizio
                file.flow_code = obj.cod_flusso || obj.CodFlusso
                file.distributor_vat_number = findVal(json, 'piva_distr')
                file.trader_vat_number = findVal(json, 'piva_utente')
                file.synchronized_at = moment().format('YYYY-MM-DD HH:mm:ss')

 

                //const flow = await Flow.findOrCreate({path:file.path},file)

                var DatiPdR = undefined

                if (obj.DatiPdR) DatiPdR = obj.DatiPdR

                if (obj.DatiPdr) DatiPdR = obj.DatiPdr

                if (obj && DatiPdR && DatiPdR.length > 1) {

                  var tmpJson = JSON.parse(JSON.stringify(json))
  
                  if(tmpJson.Prestazione && tmpJson.Prestazione.DatiPdR) tmpJson.Prestazione.DatiPdR = {}
                  if(tmpJson.Prestazione && tmpJson.Prestazione.DatiPdr)  tmpJson.Prestazione.DatiPdr = {}
  
                  if(tmpJson.FlussoMisure && tmpJson.FlussoMisure.DatiPdR)  tmpJson.FlussoMisure.DatiPdR = {}
                  if(tmpJson.FlussoMisure && tmpJson.FlussoMisure.DatiPdr)  tmpJson.FlussoMisure.DatiPdr = {}
    
                  if(tmpJson.FlussoIGMG && tmpJson.FlussoIGMG.DatiPdR)  tmpJson.FlussoIGMG.DatiPdR = {}
                  if(tmpJson.FlussoIGMG && tmpJson.FlussoIGMG.DatiPdr)  tmpJson.FlussoIGMG.DatiPdr = {}
  
                  for(var i = 0; i< DatiPdR.length; i++) {
                    var el = DatiPdR[i]



                    var ref_date = null

                    if (ref_month) {
                      ref_date = moment(ref_month, 'MM/YYYY').endOf('month').format('YYYY-MM-DD')
                    } else {
                      ref_date = findVal(el, 'data_prest') || findVal(el, 'data_misura') || findVal(el, 'data_racc') || findVal(el, 'data_deco_switch') || findVal(el, 'data_att_contr') || findVal(el, 'data_attivazione') || findVal(el, 'data_disattivazione') || findVal(el, 'data_esec_int') || findVal(el, 'data_com_autolet_cf') || findVal(el, 'data_lettura') || findVal(el, 'data_ril') || findVal(el, 'data_sospensione') || findVal(el, 'data_comp')
                      if (ref_date) {
                        ref_date = moment(ref_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
                      }
                    }

                    if (json.Prestazione) {
                      if (json.Prestazione.DatiPdR) {
                        tmpJson.Prestazione.DatiPdR = el
                      } else {
                        tmpJson.Prestazione.DatiPdr = el
                      }
                    }

                    if (json.FlussoMisure) {
                      if (json.FlussoMisure.DatiPdR) {
                        tmpJson.FlussoMisure.DatiPdR = el
                      } else {
                        tmpJson.FlussoMisure.DatiPdr = el
                      }
                    }

                    if (json.FlussoIGMG) {
                      if (json.FlussoIGMG.DatiPdR) {
                        tmpJson.FlussoIGMG.DatiPdR = el
                      } else {
                        tmpJson.FlussoIGMG.DatiPdr = el
                      }
                    }




                  }


                } else {



                  var ref_date = null

                  if (ref_month) {
                    ref_date = moment(ref_month, 'MM/YYYY').endOf('month').format('YYYY-MM-DD')
                  } else {
                    ref_date = findVal(json, 'data_prest') || findVal(json, 'data_misura') || findVal(json, 'data_racc') || findVal(json, 'data_deco_switch') || findVal(json, 'data_att_contr') || findVal(json, 'data_attivazione') || findVal(json, 'data_disattivazione') || findVal(json, 'data_esec_int') || findVal(json, 'data_com_autolet_cf') || findVal(json, 'data_lettura') || findVal(json, 'data_ril') || findVal(json, 'data_sospensione') || findVal(json, 'data_comp')
                    if (ref_date) {
                      ref_date = moment(ref_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
                    }
                  }



    

                }
              } catch (e) {
                Logger.error('errore importazione Xml: ', {
                  error: e.message
                })

              }



            } else {
              try {

                Logger.info('Lavoro file Zip')

                //console.log('sono qui zip')


                var parentBuffer = await unzipper.Open.buffer(data);

                for (let ff = 0; ff < parentBuffer.files.length; ff++) {

                  var xml = parentBuffer.files[ff]


                  var ext = xml.path.split('.').pop().toLowerCase();
                  if (ext == 'xml') {
                    var xmlBuffer = await xml.buffer()
                    var json = JSON.parse(parser.toJson(xmlBuffer, { reversible: false }));
                    //console.log(json)

                    if (json['ns0:Prestazione']) {
                      json.Prestazione = json['ns0:Prestazione']
                    }

                    var obj = {}

                    if (json.Prestazione) {
                      obj = json.Prestazione
                    }

                    if (json.FlussoMisure) {
                      obj = json.FlussoMisure
                    }

                    if (json.FlussoIGMG) {
                      obj = json.FlussoIGMG
                    }




                    file.service_code = obj.cod_servizio
                    file.flow_code = obj.cod_flusso || obj.CodFlusso
                    file.distributor_vat_number = findVal(json, 'piva_distr')
                    file.trader_vat_number = findVal(json, 'piva_utente')
                    file.synchronized_at = moment().format('YYYY-MM-DD HH:mm:ss')


                    //const flow = await Flow.findOrCreate({path: file.path},file)
                    var ref_month = findVal(obj, 'mese_comp')

                    var DatiPdR = undefined

                    if (obj.DatiPdR) DatiPdR = obj.DatiPdR

                    if (obj.DatiPdr) DatiPdR = obj.DatiPdr


                    if (obj && DatiPdR && DatiPdR.length > 1) {

                      var tmpJson = JSON.parse(JSON.stringify(json))
      
                      if(tmpJson.Prestazione && tmpJson.Prestazione.DatiPdR) tmpJson.Prestazione.DatiPdR = {}
                      if(tmpJson.Prestazione && tmpJson.Prestazione.DatiPdr)  tmpJson.Prestazione.DatiPdr = {}
      
                      if(tmpJson.FlussoMisure && tmpJson.FlussoMisure.DatiPdR)  tmpJson.FlussoMisure.DatiPdR = {}
                      if(tmpJson.FlussoMisure && tmpJson.FlussoMisure.DatiPdr)  tmpJson.FlussoMisure.DatiPdr = {}
        
                      if(tmpJson.FlussoIGMG && tmpJson.FlussoIGMG.DatiPdR)  tmpJson.FlussoIGMG.DatiPdR = {}
                      if(tmpJson.FlussoIGMG && tmpJson.FlussoIGMG.DatiPdr)  tmpJson.FlussoIGMG.DatiPdr = {}
      
                      for(var i = 0; i< DatiPdR.length; i++) {
                        var el = DatiPdR[i]

                        if (json.Prestazione) {
                          if (json.Prestazione.DatiPdR) {
                            tmpJson.Prestazione.DatiPdR = el
                          } else {
                            tmpJson.Prestazione.DatiPdr = el
                          }
                        }

                        if (json.FlussoMisure) {
                          if (json.FlussoMisure.DatiPdR) {
                            tmpJson.FlussoMisure.DatiPdR = el
                          } else {
                            tmpJson.FlussoMisure.DatiPdr = el
                          }
                        }

                        if (json.FlussoIGMG) {
                          if (json.FlussoIGMG.DatiPdR) {
                            tmpJson.FlussoIGMG.DatiPdR = el
                          } else {
                            tmpJson.FlussoIGMG.DatiPdr = el
                          }
                        }


                        var ref_date = null

                        if (ref_month) {
                          ref_date = moment(ref_month, 'MM/YYYY').endOf('month').format('YYYY-MM-DD')
                        } else {
                          ref_date = findVal(el, 'data_prest') || findVal(el, 'data_misura') || findVal(el, 'data_racc') || findVal(el, 'data_deco_switch') || findVal(el, 'data_att_contr') || findVal(el, 'data_attivazione') || findVal(el, 'data_disattivazione') || findVal(el, 'data_esec_int') || findVal(el, 'data_com_autolet_cf') || findVal(el, 'data_lettura') || findVal(el, 'data_ril') || findVal(el, 'data_sospensione') || findVal(el, 'data_comp')
                          if (ref_date) {
                            ref_date = moment(ref_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
                          }
                        }

                      }


                    } else {

                      var ref_date = null

                      if (ref_month) {
                        ref_date = moment(ref_month, 'MM/YYYY').endOf('month').format('YYYY-MM-DD')
                      } else {
                        ref_date = findVal(json, 'data_prest') || findVal(json, 'data_misura') || findVal(json, 'data_racc') || findVal(json, 'data_deco_switch') || findVal(json, 'data_att_contr') || findVal(json, 'data_attivazione') || findVal(json, 'data_disattivazione') || findVal(json, 'data_esec_int') || findVal(json, 'data_com_autolet_cf') || findVal(json, 'data_lettura') || findVal(json, 'data_ril') || findVal(json, 'data_sospensione') || findVal(json, 'data_comp')
                        if (ref_date) {
                          ref_date = moment(ref_date, 'DD/MM/YYYY').format('YYYY-MM-DD')
                        }
                      }




      

                    }




                  }
                }

              } catch (e) {
                Logger.error('errore importazione Zip: ', {
                  error: e.message
                })
              }

             }

          }
        })

      }

    
  }

module.exports = TestSync
