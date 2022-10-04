'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FlowsDownloadsSchema extends Schema {
  up () {
    this.create('flows_downloads', (table) => {
      table.increments()
      table.integer('flow_type_id').notNullable().index().references('id').inTable('flows_types')
      table.text('flow_path').notNullable().index()
      table.string('username', 32).notNullable().index().references('username').inTable('resellers')
      table.timestamps()
      
    })
  }

  down () {
    this.drop('flows_downloads')
  }
}

module.exports = FlowsDownloadsSchema
