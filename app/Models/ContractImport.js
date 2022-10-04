'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ContractImport extends Model {
  static get table () {
    return 'contract_imports'
  }
    contracts () {
        return this.hasMany('App/Models/Contract','id','upload_id')
      }
}

module.exports = ContractImport
