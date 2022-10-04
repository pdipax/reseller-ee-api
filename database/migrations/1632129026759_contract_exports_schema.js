'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractExportsSchema extends Schema {
  up () {
    this.create('contract_exports', (table) => {
      table.increments()
      table.uuid('reseller_uuid').references('uuid').inTable('resellers').notNullable().index()
      table.integer('totale').notNullable().defaultTo(0)
      table.boolean('exporting').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('contract_exports')
  }
}

module.exports = ContractExportsSchema
