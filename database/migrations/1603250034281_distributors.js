'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DistributorSchema extends Schema {
  up () {
    this.create('distributors', (table) => {
      table.increments()
      table.string('commodity', 1).notNullable()
      table.string('company_name', 128).notNullable()
      table.string('vat_number', 16).notNullable()
      table.integer('arera_id').unsigned().notNullable()
      table.string('phone', 16)
      table.string('fax', 16)
      table.string('email', 128)
      table.string('web', 128)

      
    })
  }

  down () {
    this.drop('distributors')
  }
}

module.exports = DistributorSchema
