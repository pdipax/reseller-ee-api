'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterResellerSchema extends Schema {
  up () {
    this.table('resellers', (table) => {
      table.uuid('master_reseller_uuid').index().references('uuid').inTable('resellers')
      table.string('toponimo',32)
      table.string('indirizzo')
      table.string('civico',16)
      table.string('comune')
      table.string('cap',8)
      table.string('provincia',3)
      table.string('codice_sdi',8)
      table.boolean('master_reseller').defaultTo(false)
    })
  }

  down () {
    this.table('resellers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterResellerSchema
