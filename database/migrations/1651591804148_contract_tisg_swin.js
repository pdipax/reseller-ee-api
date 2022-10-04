'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TisgAnagSchema extends Schema {
  up () {
    this.create('contract_tisg_swin', (table) => {
      table.increments()
      table.integer('import_tisg_id').references('id').inTable('contract_tisg_imports').notNullable().index()
      table.string('COD_PDR').index(),
      table.string('COD_REMI'),
      table.string('ID_REG_CLIM'),
      table.string('CAP_TRASP_PDR'),
      table.string('PIVA_UDB'),
      table.string('DEFAULT_TRAS'),
      table.string('CF'),
      table.string('PIVA'),
      table.string('CF_STRANIERO'),
      table.string('NOME'),
      table.string('COGNOME'),
      table.string('RAGIONE_SOCIALE_DENOMINAZIONE'),
      table.string('STATO_PDR'),
      table.string('TIPO_PDR'),
      table.string('MATR_MIS'),
      table.string('CLASSE_GRUPPO_MIS'),
      table.string('UB_TOPONIMO'),
      table.string('UB_VIA'),
      table.string('UB_CIV'),
      table.string('UB_CAP'),
      table.string('UB_ISTAT'),
      table.string('UB_LOCALITA'),
      table.string('UB_PROV'),
      table.string('UB_NAZIONE'),
      table.string('UB_ALTRO'),
      table.string('AF_CF'),
      table.string('AF_PIVA'),
      table.string('AF_CF_STRANIERO'),
      table.string('AF_NOME'),
      table.string('AF_COGNOME'),
      table.string('AF_RAGIONE_SOCIALE_DENOMINAZIO'),
      table.string('ES_TOPONIMO'),
      table.string('ES_VIA'),
      table.string('ES_CIV'),
      table.string('ES_CAP'),
      table.string('ES_ISTAT'),
      table.string('ES_LOCALITA'),
      table.string('ES_PROV'),
      table.string('ES_NAZIONE'),
      table.string('ES_ALTRO'),
      table.string('COD_PROF_PREL_STD'),
      table.string('PRELIEVO_ANNUO_PREV'),
      table.string('TRATTAMENTO'),
      table.string('MAX_PRELIEVO_ORA'),
      table.string('PRESS_MISURA'),
      table.string('TIPO_FORNITURA'),
      table.string('BONUS'),
      table.string('BS_DATA_INIZIO'),
      table.string('BS_DATA_FINE'),
      table.string('BS_DATA_RINNOVO'),
      table.string('BS_TIPO_BONUS'),
      table.string('FO_DATA_INIZIO'),
      table.string('CODICE_COMUNE')
    })
  }

  down () {
    this.drop('tisg_anag')
  }
}

module.exports = TisgAnagSchema
