'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ContractStatus extends Model {
    static get table () {
        return 'contract_status'
      }
}

module.exports = ContractStatus
