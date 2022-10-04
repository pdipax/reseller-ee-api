'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TicketsSchema extends Schema {
  up () {
    this.create('tickets', (table) => {
      table.uuid('uuid').notNullable().primary()
      table.uuid('reseller_uuid').references('uuid').inTable('resellers').notNullable()
      table.string('commodity', 1).notNullable()
      table.integer('type_id').references('id').inTable('ticket_types')
      table.string('pdp', 14).notNullable().index()
      table.date('date_start').index().notNullable() 
      table.text('note')
      table.string('status', 1).notNullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('tickets')
  }
}

module.exports = TicketsSchema
