'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ExportHistorySchema extends Schema {
  up () {
    this.create('export_details', (table) => {
      table.increments()
      table.integer('export_id').references('id').inTable('exports').notNullable().index()
      table.integer('contract_id').references('id').inTable('contracts').notNullable().index()
    })
  }

  down () {
    this.drop('export_details')
  }
}

module.exports = ExportHistorySchema
