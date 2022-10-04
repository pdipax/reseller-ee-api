'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemiDistributoreSchema extends Schema {
  up () {
    this.create('remi_distributore', (table) => {
      table.increments()
      table.string('remi_code',32).notNullable().index().references('code').inTable('remi')
      table.integer('stakeholder_id').notNullable().index().references('id_soggetto').inTable('stakeholders')
    })
  }

  down () {
    this.drop('remi_distributore')
  }
}

module.exports = RemiDistributoreSchema
