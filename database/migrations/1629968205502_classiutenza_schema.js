'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClassiUtenzaSchema extends Schema {
  up () {
    this.create('classiutenza_types', (table) => {
      table.string('code', 32).primary()
      table.string('commodity', 1).notNullable()
      table.string('name', 128).notNullable().index()
      table.string('tariffa_distribuzione', 16)
      table.string('livello_tensione', 16)
      table.string('description')
    })
  }

  down () {
    this.drop('classiutenza_types')
  }
}

module.exports = ClassiUtenzaSchema
