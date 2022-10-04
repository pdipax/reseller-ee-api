'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FlowTypesSchema extends Schema {
  up () {
    this.create('flows_types', (table) => {
      table.increments()
      table.string('commodity', 1).notNullable().index()
      table.string('flow_code', 8).notNullable().index()
      table.string('service_code', 8).index()
      table.string('description', 128).notNullable()
      table.string('tag',32)
      table.string('index',32)
      table.boolean('multiple').defaultTo(false)

      
    })
  }

  down () {
    this.drop('flows_types')
  }
}

module.exports = FlowTypesSchema
