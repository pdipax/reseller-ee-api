'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategorieUtenzaSchema extends Schema {
  up () {
    this.create('categorieutenza_types', (table) => {
      table.string('code', 32).primary()
      table.string('name', 128).notNullable().index()
    })
  }

  down () {
    this.drop('categorieutenza_types')
  }
}

module.exports = CategorieUtenzaSchema
