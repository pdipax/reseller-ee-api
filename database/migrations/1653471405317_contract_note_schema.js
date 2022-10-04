'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractNoteSchema extends Schema {
  up () {
    this.create('contract_note', (table) => {
      table.increments()
      table.integer('contract_id').references('id').inTable('contracts').notNullable().index()
      table.uuid('reseller_uuid').references('uuid').inTable('resellers').notNullable().index()
      table.string('status', 3).notNullable()
      table.text('note')
      table.timestamps()
    })
  }

  down () {
    this.drop('contract_notes')
  }
}

module.exports = ContractNoteSchema
