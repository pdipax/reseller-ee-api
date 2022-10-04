'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterPricesSchema extends Schema {
  up () {
    this.table('prices', (table) => {
      table.uuid('master_reseller_uuid').index().references('uuid').inTable('resellers')
      table.integer('parent_price_id').index().references('id').inTable('prices')
    })
  }

  down () {
    this.table('prices', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterPricesSchema
