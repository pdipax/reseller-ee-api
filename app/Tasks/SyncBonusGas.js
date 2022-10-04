'use strict'

const Task = use('Task')


const { Console } = require('console')
const moment = require('moment')

const unzipper = require('unzipper')
const Bonusgas = use('App/Models/Bonusgas')
const BonusgasEsiti = use('App/Models/BonusgasEsiti')
const BonusgasAnnullamenti = use('App/Models/BonusgasAnnullamenti')
const BonusgasDettaglio = use('App/Models/BonusgasDettaglio')

const Logger = use('Logger')

const Env = use ('Env')
const csvParser = require("csvtojson/v2");





class SyncBonusGas extends Task {
  static get schedule() {
    //return '55 0 * * *'
    return '30 6 * * *'
  }

  async handle() {

    //if(Env.get('NODE_ENV') =='development') return
    
    try {

      //console.log('ciao')
    const lastFile = await Bonusgas.query().orderBy('created_at', 'desc').first()
    const lastSync = lastFile ? moment(lastFile.created_at).subtract(30, "days") : moment('2021-01-01T21:13:08.134Z')


    //const lastSync = moment('2021-01-01T21:13:08.134Z')


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
        Logger.info('cTime Sync: ' +moment(stats.ctime))
        var data = { commodity: 'g', path: url.pathToFileURL(res).pathname.split('reseller-api/').pop(), size: stats.size, created_at: stats.ctime, updated_at: stats.ctime }
        if ((stats.isDirectory() || ['zip'].includes(data.path.split('.').pop().toLowerCase())) && moment(stats.ctime) > lastSync)
          return stats.isDirectory() ? getFiles(res) : data;
        else return
      }));
      var res = files.reduce((a, f) => a.concat(f), []);
      return res.filter(function (el) {
        return el != undefined;
      });
    }


    getFiles('storage/siiprocessigas/BSA5_07624531211')
      .then(async (files) => {

        Logger.info('Totale file bonus gas da importare: ' +files.length)

        //console.log(files.length)

        var fs = require('fs');



        for(let fk=0; fk < files.length; fk++) {

          var file = files[fk]

          //console.log(file.path)

          Logger.info('File bonus gas da importare: ' + file.path)

          const filename = (file.path.split('/').pop()).replace('07624531211','11014291006')

          var bg = await Bonusgas.query().where('path',file.path).first()
          
          
          //console.log(flow)
          
          if(bg) {
            Logger.info('Flusso bonus gas esistente: ' + bg.id)
            //console.log('esco')
            continue
          }
          
          Logger.info('Flusso bonus gas non trovato... importazione...')



          var data = fs.readFileSync(file.path)

            if (file.path.split('.').pop().toLowerCase() == 'zip') {

              try {

              Logger.info('Lavoro file Bonus Gas Zip')

              //console.log('sono qui zip')

              var parentBuffer = await unzipper.Open.buffer(data);

              for (let ff=0; ff< parentBuffer.files.length; ff++) {

                var csv = parentBuffer.files[ff]

                var ext = csv.path.split('.').pop().toLowerCase();
                if (ext == 'csv') {

                  var csvBuffer = await csv.buffer()
                  
                  if(!bg) {
                    bg = await Bonusgas.create({path: file.path, filename: filename})
                  }

  
                  let csvContent = csvBuffer.toString()

                  let fileObj = await csvParser({ delimiter: ";" }).fromString(csvContent)

                  fileObj = fileObj.map(el => {return {...el, filename:filename} })

                  if(file.path.includes('_ANN_')) {
                    try {
                      let res = await BonusgasAnnullamenti.createMany(fileObj)
                    } catch (error) {
                      console.log(error)
                    }    
                  }                  
                  else if(file.path.includes('_ESITO_')) {
                    try {
                      let res = await BonusgasEsiti.createMany(fileObj)
                    } catch (error) {
                      console.log(error)
                    }
                  }                  
                  else {
                    try {
                      let res = await BonusgasDettaglio.createMany(fileObj)
                    } catch (error) {
                      console.log(error)
                    }                  
                  }                  


                }
              }

            } catch (e) {
              Logger.error('errore importazione Zip Bonus Gas: ', {
                error:  e.message
            })
          }
        }
      }

  


        

      })


    } catch (e) {
      Logger.error('errore globale: ', {
        error:  e.message
    })
  
    }


  }







}

module.exports = SyncBonusGas
