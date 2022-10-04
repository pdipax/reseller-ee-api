'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Exports extends Model {

    static boot () {
      super.boot()
      this.addTrait('NoTimestamp')
    }

    static get table () {
      return 'export_details'
    } 

    export () {
      return this.hasOne('App/Models/Exports','export_id','id')
    }

}

module.exports = Exports
