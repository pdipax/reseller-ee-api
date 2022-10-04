'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PriceRemisSchema extends Schema {
  up () {
    this.create('price_remi', (table) => {
      table.increments()
      table.integer('price_id').notNullable().index().references('id').inTable('prices')
      table.string('remi_code',32).notNullable().index().references('code').inTable('remi')
      table.timestamps()
    })
  }

  down () {
    this.drop('price_remi')
  }
}

module.exports = PriceRemisSchema
