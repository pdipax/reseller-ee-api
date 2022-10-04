'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EnergyIndexSchema extends Schema {
  up () {
    this.create('energy_index', (table) => {
      table.increments()
      table.date('competenza').notNullable().index()
      table.decimal('pun_f1').notNullable().unsigned()
      table.decimal('pun_f2').notNullable().unsigned()
      table.decimal('pun_f3').notNullable().unsigned()
      table.decimal('pun_medio').notNullable().unsigned()
    })
  }

  down () {
    this.drop('energy_index')
  }
}

module.exports = EnergyIndexSchema
