'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FlowPathSchema extends Schema {
  up () {
    this.create('flows_paths', (table) => {
      table.increments()
      table.string('commodity', 1).notNullable().index()
      table.text('path').notNullable().unique().index()
      table.timestamps()
    })
  }

  down () {
    this.drop('flows_paths')
  }
}

module.exports = FlowPathSchema
