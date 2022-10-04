'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')


class Exports extends Model {

    static boot () {
      super.boot()
    }

    static get table () {
      return 'exports'
    } 

    static get computed() {
      return ['created_at_it','updated_at_it']
    }
  
    getCreatedAtIt({ created_at }) {
      return moment(created_at,'YYYY-MM-DD').format("DD/MM/YYYY")   
    }
  
    getUpdatedAtIt({ updated_at }) {
      return moment(updated_at,'YYYY-MM-DD').format("DD/MM/YYYY")   
    }

    details () {
      return this.hasMany('App/Models/ExportDetails','id','export_id')
    }

    reseller () {
      return this.belongsTo('App/Models/Reseller','reseller_uuid','uuid')
    }

    contracts () {
      return this.belongsToMany('App/Models/Contract','export_id','contract_id','id','id').pivotModel('App/Models/ExportDetails')
    }

}

module.exports = Exports
