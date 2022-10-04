'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ContractUpload extends Model {
    static get table () {
        return 'contract_uploads'
      }

      contracts () {
        return this.hasMany('App/Models/Contract','id','upload_id')
      }

      reseller () {
        return this.hasOne('App/Models/Reseller','reseller_uuid','uuid')
      }

}

module.exports = ContractUpload
