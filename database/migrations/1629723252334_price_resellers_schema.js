'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PriceResellersSchema extends Schema {
  up () {
    this.create('price_resellers', (table) => {
      table.increments()
      table.integer('price_id').notNullable().index().references('id').inTable('prices')
      table.uuid('reseller_uuid').notNullable().index().references('uuid').inTable('resellers')
      table.timestamps()
    })
  }

  down () {
    this.drop('price_resellers')
  }
}

module.exports = PriceResellersSchema
