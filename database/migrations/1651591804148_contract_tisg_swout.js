'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TisgAnagSchema extends Schema {
  up () {
    this.create('contract_tisg_swout', (table) => {
      table.increments()
      table.integer('import_tisg_id').references('id').inTable('contract_tisg_imports').notNullable().index()
      table.string('COD_PDR').index(),
      table.string('COD_REMI'),
      table.string('PIVA_UDB'),
      table.string('DEFAULT_TRAS'),
      table.string('CF'),
      table.string('PIVA'),
      table.string('CF_STRANIERO')
    })
  }

  down () {
    this.drop('tisg_anag')
  }
}

module.exports = TisgAnagSchema
