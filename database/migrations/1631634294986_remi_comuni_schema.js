'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemiComuniSchema extends Schema {
  up () {
    this.create('remi_comuni', (table) => {
      table.increments()
      table.string('istat').notNullable()
      table.string('remi_code',32).notNullable().index().references('code').inTable('remi')
      // table.timestamps()
    })
  }

  down () {
    this.drop('remi_comuni')
  }
}

module.exports = RemiComuniSchema
