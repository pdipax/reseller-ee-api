'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StakeholdersSchema extends Schema {
  up () {
    this.create('stakeholders', (table) => {
      table.integer('id_soggetto').primary()
      table.string('societa').notNullable().index()
      table.string('partita_iva',32)
      table.string('codice_fiscale',32)
      table.string('gruppo_societario',128)
      table.string('anno_costituzione',128)
      table.string('email')
      table.string('sito')
      table.string('sede_legale')
      table.string('sede_operativa')
      table.string('fax_sede_legale',64)
      table.string('fax_sede_operativa',64)
      table.string('tel_sede_legale',64)
      table.string('tel_sede_operativa',64)
      table.text('settori')
      table.string('numero_registro',64)
      table.string('data_iscrizione',16)
      table.text('contatti_cliente')
      table.text('contatti_cliente2')
    })
  }

  down () {
    this.drop('stakeholders')
  }
}

module.exports = StakeholdersSchema
