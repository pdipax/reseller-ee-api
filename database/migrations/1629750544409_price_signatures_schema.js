'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PriceSignaturesSchema extends Schema {
  up () {
    this.create('price_signatures', (table) => {
      table.increments()
      table.integer('price_id').notNullable().index().references('id').inTable('prices')
      table.uuid('reseller_uuid').notNullable().index().references('uuid').inTable('resellers')     
      table.boolean('signed').defaultTo(false).notNullable()     
      table.timestamps()
    })
  }

  down () {
    this.drop('price_signatures')
  }
}

module.exports = PriceSignaturesSchema
