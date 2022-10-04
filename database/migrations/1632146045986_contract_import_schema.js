'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractImportSchema extends Schema {
  up () {
    this.create('contract_imports', (table) => {
      table.increments()
      table.uuid('reseller_uuid').references('uuid').inTable('resellers').notNullable().index()
      table.string('cod_servizio').notNullable()
      table.string('cod_flusso').notNullable()
      table.integer('totale').notNullable().defaultTo(0)
      table.integer('totale_positivi').notNullable().defaultTo(0)
      table.integer('totale_negativi').notNullable().defaultTo(0)
      table.string('path_esito_positivo')
      table.string('path_esito_negativo')
      table.boolean('uploading').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('contract_imports')
  }
}

module.exports = ContractImportSchema
