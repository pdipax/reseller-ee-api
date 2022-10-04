'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractTimSchema extends Schema {
  up () {
    this.create('contract_flows', (table) => {
      table.increments()
      table.string('CP_UTENTE').notNullable().index()
      table.string('COD_SERVIZIO').notNullable()
      table.string('COD_FLUSSO').notNullable()
      table.jsonb('extra')
    })
  }

  down () {
    this.drop('contract_flows')
  }
}

module.exports = ContractTimSchema
