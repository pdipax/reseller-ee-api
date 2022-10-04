'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ContractFlow extends Model {
    static boot () {
      super.boot()
      this.addTrait('NoTimestamp')
    }
    static get table () {
      return 'contract_flows'
    }
}

module.exports = ContractFlow
