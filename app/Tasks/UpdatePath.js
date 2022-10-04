'use strict'

const Task = use('Task')
const FlowPath = use('App/Models/FlowPath')

const moment = require('moment')


const Logger = use('Logger')

const Env = use ('Env')


class UpdatePath extends Task {
  static get schedule() {
    //return '*/10 * * * * *'
    return '15 22 * * *'
  }

  async handle() {

    if(Env.get('NODE_ENV') =='development') return

    try {


    const lastFile = await FlowPath.query().where('commodity', 'g').orderBy('created_at', 'desc').first()
    const lastSync = lastFile ? moment(lastFile.created_at).subtract(30, "days") : moment('2015-01-01T21:13:08.134Z')
    //const lastSync = moment('2021-01-01T21:13:08.134Z')
    Logger.info('Last Update Path: ' +lastSync)


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
        if ((stats.isDirectory() || ['xml', 'zip'].includes(data.path.split('.').pop().toLowerCase())) && moment(stats.ctime) > lastSync)
          return stats.isDirectory() ? getFiles(res) : data;
        else return
      }));
      var res = files.reduce((a, f) => a.concat(f), []);
      return res.filter(function (el) {
        return el != undefined;
      });
    }


    getFiles('storage/siicloudgas')
      .then(async (files) => {


        Logger.info('Totale file da importare: ' +files.length)


        //console.log(files.length)

        for(let fk=0; fk < files.length; fk++) {


          var file = files[fk]

          //console.log(file.path)

          Logger.info('File da importare: ' + file.path)

          var path = await FlowPath.query().where('path',file.path).first()
          Logger.info('Path non trovato... importazione...')


          //console.log(flow)

          if(path) {
            Logger.info('Path esistente: ' + path.id)
            //console.log('esco')
            continue
          }


          await FlowPath.create({path: file.path, commodity: 'g'})

        
      }

  


        

      })


    } catch (e) {
      Logger.error('errore globale: ', {
        error:  e.message
    })
  
    }


  }







}

module.exports = UpdatePath
