'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FlowPath extends Model {


    static boot () {
        super.boot()
      }

      static get table () {
        return 'flows_paths'
      }



}

module.exports = FlowPath
