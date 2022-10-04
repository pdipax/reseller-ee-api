'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterResellerSchema extends Schema {
  up () {
    this.table('resellers', (table) => {
      table.date('master_reseller_date')

    })
  }

  down () {
    this.table('resellers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterResellerSchema
