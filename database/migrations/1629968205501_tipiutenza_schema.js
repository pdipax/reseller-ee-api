'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TipiUtenzaSchema extends Schema {
  up () {
    this.create('tipiutenza_types', (table) => {
      table.string('code', 32).primary()
      table.string('commodity', 1).notNullable()
      table.string('name', 128).notNullable().index()
      table.boolean('reseller').notNullable().defaultTo(false)
    })
  }

  down () {
    this.drop('tipiutenza_types')
  }
}

module.exports = TipiUtenzaSchema
