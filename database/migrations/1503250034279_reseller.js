'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ResellerSchema extends Schema {
  up () {
    this.create('resellers', (table) => {
      table.uuid('uuid').notNullable().primary()
      table.string('company_name', 128).notNullable()
      table.string('vat_number', 32).notNullable().index()
      table.string('username', 32).notNullable().unique().index()
      table.string('password', 60).notNullable()
      table.boolean('superadmin').defaultTo(false).notNullable()
      table.boolean('active').defaultTo(true).notNullable()
      
    })
  }

  down () {
    this.drop('resellers')
  }
}

module.exports = ResellerSchema
