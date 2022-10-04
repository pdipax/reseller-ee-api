'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractImportTisgSchema extends Schema {
  up () {
    this.create('contract_tisg_imports', (table) => {
      table.increments()
      table.uuid('reseller_uuid').references('uuid').inTable('resellers').notNullable().index()
      table.string('mese',4).notNullable()
      table.string('anno',4).notNullable()
      table.integer('totale').notNullable().defaultTo(0)
      table.integer('tot_file_positivi').notNullable().defaultTo(0)
      table.integer('tot_file_negativi').notNullable().defaultTo(0)
      table.integer('tot_anag').notNullable().defaultTo(0)
      table.integer('tot_swin').notNullable().defaultTo(0)
      table.integer('tot_swout').notNullable().defaultTo(0)
      table.boolean('uploading').defaultTo(true)
      table.timestamps()
    })
  }

  down () {
    this.drop('contract_tisg_imports')
  }
}

module.exports = ContractImportTisgSchema
