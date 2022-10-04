'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EsportazioniSchema extends Schema {
  up () {
    this.create('exports', (table) => {
      table.increments()
      table.string('type',128).notNullable()
      table.string('commodity',1).notNullable()
      table.uuid('reseller_uuid').references('uuid').inTable('resellers').notNullable().index()
      table.timestamps()
    })
  }
esportazioni
  down () {
    this.drop('exports')
  }
}

module.exports = EsportazioniSchema
