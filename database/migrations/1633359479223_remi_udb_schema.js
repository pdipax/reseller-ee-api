'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemiUdbSchema extends Schema {
  up () {
    this.create('remi_udb', (table) => {
      table.increments()
      table.string('remi_code',32).notNullable().index().references('code').inTable('remi')
      table.integer('stakeholder_id').notNullable().index().references('id_soggetto').inTable('stakeholders')
      table.integer('volume')
      table.integer('cg').defaultTo(0).notNullable()
      table.string('price_type',1).notNullable()
      table.string('index',16)
      table.decimal('amount',[9,6]).unsigned().notNullable()
      table.date('date_from').index().notNullable() 
      table.date('date_to').index().notNullable() 
    })
  }

  down () {
    this.drop('remi_udb')
  }
}

module.exports = RemiUdbSchema
