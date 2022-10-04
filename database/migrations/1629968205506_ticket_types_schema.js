'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TicketTypesSchema extends Schema {
  up () {
    this.create('ticket_types', (table) => {
      table.increments()
      table.string('code', 16).notNullable()
      table.string('name', 128).notNullable()
    })
  }

  down () {
    this.drop('ticket_types')
  }
}

module.exports = TicketTypesSchema
