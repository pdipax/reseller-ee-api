'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PricesSchema extends Schema {
  up () {
    this.create('prices', (table) => {
      table.increments()
      table.string('name').notNullable()
      table.string('commodity',1).notNullable()
      table.string('type',1).notNullable()
      table.string('index',16)
      table.decimal('amount').unsigned().notNullable()
      table.json('amount_extra').defaultTo('[]').notNullable()
      table.string('external_id',32).notNullable().unique()
      table.date('date_from').index().notNullable() 
      table.date('date_to').index().notNullable() 
      table.date('date_start').index().notNullable() 
      table.boolean('visible').index().notNullable().defaultTo(false)    
      table.timestamps()
    })
  }

  down () {
    this.drop('prices')
  }
}

module.exports = PricesSchema
