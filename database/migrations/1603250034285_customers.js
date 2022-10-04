'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ResellersCustomersSchema extends Schema {
  up () {
    this.create('resellers_customers', (table) => {
      table.increments()
      table.string('vat_number_reseller',16).index().notNullable()	
      table.date('date_from').index().notNullable()
      table.date('date_to').index()
      table.string('pdp',16).index().notNullable()
      table.string('meter_number',32).index()
      table.string('meter_type',32)	
      table.string('use_category',32)	
      table.string('address')	
      table.string('city')	
      table.string('province',8)
      table.string('postal_code',8)
      table.string('product_code')
      
    })
  }

  down () {
    this.drop('resellers_customers')
  }
}

module.exports = ResellersCustomersSchema
