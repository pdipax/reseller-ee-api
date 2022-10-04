'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FlowsSchema extends Schema {
  up () {
    this.create('flows', (table) => {
      table.increments()
      table.string('commodity', 1).notNullable().index()
      table.string('service_code', 8).index()
      table.string('flow_code', 8).notNullable().index()
      table.integer('flow_type_id').index().references('id').inTable('flows_types')
      table.string('distributor_vat_number', 16)
      table.string('trader_vat_number', 16)
      table.text('path').notNullable().unique()
      table.integer('size')
      table.datetime('synchronized_at').index()
      table.timestamps()

      
    })
  }

  down () {
    this.drop('flows')
  }
}

module.exports = FlowsSchema
