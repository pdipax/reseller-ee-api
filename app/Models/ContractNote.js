'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const moment = require('moment')

class ContractNote extends Model {
    static get table () {
        return 'contract_note'
    }

    static get computed() {
        return ['created_at_it']
      }

      getCreatedAtIt({ created_at }) {
        return moment(created_at).format("DD/MM/YYYY HH:mm:ss")   
      }

      reseller () {
        return this.belongsTo('App/Models/Reseller','reseller_uuid','uuid')
      }
}

module.exports = ContractNote
