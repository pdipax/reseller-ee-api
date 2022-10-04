'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemiSchema extends Schema {
  up () {
    this.create('remi', (table) => {
      table.increments()
      table.string('code',32).index().notNullable().unique()
      table.boolean('enabled').notNullable().defaultTo(false)
    })
  }

  down () {
    this.drop('remi')
  }
}

module.exports = RemiSchema
