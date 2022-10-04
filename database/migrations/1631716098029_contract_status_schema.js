'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractStatusSchema extends Schema {
  up () {
    this.create('contract_status', (table) => {
      table.increments()
      table.string("code",3).notNullable()
      table.string("name",64).notNullable()
      table.text('descrizione')
      table.timestamps()
    })
  }

  down () {
    this.drop('contract_status')
  }
}

module.exports = ContractStatusSchema
