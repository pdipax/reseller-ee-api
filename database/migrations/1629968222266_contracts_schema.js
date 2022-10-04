'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractsSchema extends Schema {
  up () {
    this.create('contracts', (table) => {
      table.increments()
      table.uuid('reseller_uuid').references('uuid').inTable('resellers').notNullable().index()
      table.string('commodity', 1).notNullable().index()
      table.string('type',16).references('code').inTable('contract_types').notNullable()
      table.string('type_voltura',1) // S /M
      table.date('data_stipula').notNullable().index()
      table.string('tipo_persona',1).notNullable()
      table.string('nome',64) //fisica
      table.string('cognome',64) //fisica
      table.string('ragione_sociale',128).index() //GIU
      table.string('partita_iva',11).index()
      table.string('codice_fiscale',16).index()
      table.string('telefono',16).index()
      table.string('fax',16)
      table.string('email',128)
      table.string('pec',128)
      table.string('toponimo',32).notNullable()
      table.string('indirizzo').notNullable()
      table.string('indirizzo2')
      table.string('comune').notNullable()
      table.string('cap',8).notNullable()
      table.string('provincia',3).notNullable()
      table.string('istat').notNullable()
      table.string('civico',16).notNullable()
      table.string('scala',16)
      table.string('piano',16)
      table.string('interno',16)
      table.string('rappresentante_legale',128).index()
      table.string('rl_codice_fiscale',16) 

      table.string('tipoutenza_code',32).references('code').inTable('tipiutenza_types') 
      table.string('classeutenza_code',32).references('code').inTable('classiutenza_types') 
      table.string('categoriautenza_code',32).references('code').inTable('categorieutenza_types') 
      table.string('categoria_uso',2) //SOLO GAS C1,C2,C3 ...
      table.integer('classe_prelievo') //SOLO GAS 1,2,3 (7,6,5 giorni)

      table.decimal('potenza_disponibile')
      table.decimal('potenza_impegnata')
      table.integer('tensione')
      table.string('mercato_provenienza',1).notNullable() //T= tutela, L=Libero, S=Salvaguardia
      table.integer('consumo_annuo_presunto').notNullable().unsigned()
      table.string('codice_offerta',32).notNullable().references('external_id').inTable('prices').index()
      table.string('pdp', 14).index()
      table.string('misuratore', 32)
      table.integer('cifre_misuratore') 
      table.string('correttore', 32)
      table.integer('cifre_correttore') 
      table.string('distributore',32).notNullable().references('partita_iva').inTable('stakeholders')
      table.string('precedente_fornitore',32).references('partita_iva').inTable('stakeholders')
      table.string('remi_code', 32).references('code').inTable('remi')
      
      table.string('sede_istat').notNullable()
      table.string('sede_comune').notNullable()
      table.string('sede_cap',8).notNullable()
      table.string('sede_provincia',3).notNullable()
      table.string('sede_toponimo',32).notNullable()
      table.string('sede_indirizzo').notNullable()
      table.string('sede_indirizzo2')
      table.string('sede_civico',16).notNullable()
      table.string('sede_scala',16)
      table.string('sede_piano',16)
      table.string('sede_interno',16)
      
      table.text('note')
      table.date('date_switch') 
      table.string('status', 3).notNullable().defaultTo('INS')
      table.integer('upload_id').references('id').inTable('contract_uploads').index()
      table.integer('switch_export_id').references('id').inTable('contract_exports').index()
      table.string('switch_cp_utente_sii').unique()
      table.string('ann_cod_causale',10)
      table.string('ann_motivazione',100)
      table.string('ann_cp_utente_sii',100).unique()
      table.integer('ann_export_id').references('id').inTable('contract_exports').index()

      table.timestamps()
    })
  }

  down () {
    this.drop('contracts')
  }
}

module.exports = ContractsSchema
