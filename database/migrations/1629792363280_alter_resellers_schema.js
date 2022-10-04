'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterResellersSchema extends Schema {
  up () {
    this.table('resellers', (table) => {
      table.string('email')
      table.string('email_notifiche_pratiche')
      table.string('pec')      
      table.boolean('firmaotp').defaultTo(false).notNullable()
      table.string('firmaotp_name',128)
      table.string('firmaotp_phone',16)
      table.boolean('service_scoring').defaultTo(false).notNullable()
      table.boolean('service_iban').defaultTo(false).notNullable()
      table.boolean('service_sms').defaultTo(false).notNullable()
      table.boolean('service_firmaotp').defaultTo(false).notNullable()

    })
  }

  down () {
    this.table('resellers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterResellersSchema
