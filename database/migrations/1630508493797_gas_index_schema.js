'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class GasIndexSchema extends Schema {
  up () {
    this.create('gas_index', (table) => {
      table.increments()

      table.date('competenza').notNullable().index()
      table.decimal('psv').notNullable().unsigned()
      table.decimal('pfor').notNullable().unsigned()
      table.decimal('ttf').notNullable().unsigned()

    })
  }

  down () {
    this.drop('gas_index')
  }
}

module.exports = GasIndexSchema
