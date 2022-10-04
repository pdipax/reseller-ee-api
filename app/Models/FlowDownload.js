'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FlowDownload extends Model {


    static boot () {
        super.boot()
      }

      static get table () {
        return 'flows_downloads'
      }

}

module.exports = FlowDownload
