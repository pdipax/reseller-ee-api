'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FlowsSchema extends Schema {
  up () {
    this.create('flows_combinations', (table) => {
      table.increments()
      table.integer('flow_id').notNullable().index().references('id').inTable('flows')
      table.string('pdp', 16).notNullable().index()
      table.jsonb('details')
      table.string('cod_prat_utente', 64)
      table.string('cod_prat_distr', 64)
      table.string('matr_mis', 32)
      table.date('ref_date')

      
    })
  }

  down () {
    this.drop('flows_combinations')
  }
}

module.exports = FlowsSchema
