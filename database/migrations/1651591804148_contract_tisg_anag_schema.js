'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TisgAnagSchema extends Schema {
  up () {
    this.create('contract_tisg_anag', (table) => {
      table.increments()
      table.integer('import_tisg_id').references('id').inTable('contract_tisg_imports').notNullable().index()
      table.string('COD_PDR').index()
      table.string('COD_REMI')
      table.string('ID_REG_CLIM')
      table.string('CAP_TRASP_PDR')
      table.string('PIVA_UDB')
      table.string('DEFAULT_TRAS')
      table.string('CF')
      table.string('PIVA')
      table.string('CF_STRANIERO')
      table.string('STATO_PDR')
      table.string('TIPO_PDR')
      table.string('COD_PROF_PREL_STD')
      table.string('PRELIEVO_ANNUO_PREV')
      table.string('TRATTAMENTO')
      table.string('TIPO_FORNITURA')
      table.string('FO_DATA_INIZIO')
      table.string('CODICE_COMUNE')
    })
  }

  down () {
    this.drop('tisg_anag')
  }
}

module.exports = TisgAnagSchema
