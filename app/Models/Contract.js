"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");
const moment = require('moment')

class Contract extends Model {

  static get computed() {
    return ['created_at_it','data_stipula_it','date_switch_it']
  }

  getDataStipulaIt({ data_stipula }) {
    return moment(data_stipula,'YYYY-MM-DD').format("DD/MM/YYYY")   
  }

  getDateSwitchIt({ date_switch }) {
    return date_switch ? moment(date_switch,'YYYY-MM-DD').format("DD/MM/YYYY") : null
  }

  getCreatedAtIt({ created_at }) {
    return moment(created_at,'YYYY-MM-DD').format("DD/MM/YYYY")   
  }
  contract_types () {
    return this.belongsTo('App/Models/ContractType','type','code')
  }

  switch_contract_flows () {
    return this.belongsTo('App/Models/ContractFlow','switch_cp_utente_sii','CP_UTENTE')
  }

  ann_contract_flows () {
    return this.belongsTo('App/Models/ContractFlow','ann_cp_utente_sii','CP_UTENTE')
  }

  tipiutenza_types () {
    return this.belongsTo('App/Models/TipoUtenzaType','tipoutenza_code','code')
  }

  classiutenza_types () {
    return this.belongsTo('App/Models/ClasseUtenzaType','classeutenza_code','code')
  }

  categorieutenza_types () {
    return this.belongsTo('App/Models/CategoriaUtenzaType','categoriautenza_code','code')
  }

  stakeholders_distributore () {
    return this.belongsTo('App/Models/Stakeholder','distributore','partita_iva')
  }

  stakeholders_precedente_fornitore () {
    return this.belongsTo('App/Models/Stakeholder','precedente_fornitore','partita_iva')
  }

  prices () {
    return this.belongsTo('App/Models/Price','codice_offerta','external_id').with('parentPrice')
  }
  
  remi () {
    return this.belongsTo('App/Models/Remi','remi_code','code')
  }

  reseller () {
    return this.belongsTo('App/Models/Reseller','reseller_uuid','uuid')
  }
  
  contract_status () {
    return this.hasOne('App/Models/ContractStatus','status','code')
  }

  istat_clima () {
    return this.hasOne('App/Models/IstatClima','sede_istat','istat')
  }

  contract_note() {
    return this.hasMany("App/Models/ContractNote", "id", "contract_id").with('reseller').orderBy('created_at','desc');
  }

  export_details() {
    return this.belongsTo('App/Models/ExportDetails','id','contract_id')
  }
  

  static boot() {
    super.boot();
  }
}

module.exports = Contract;
