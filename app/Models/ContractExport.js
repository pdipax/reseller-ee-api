"use strict";

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use("Model");

class ContractExport extends Model {
  contracts_switch() {
    return this.hasMany("App/Models/Contract", "id", "switch_export_id");
  }
  contracts_annullati() {
    return this.hasMany("App/Models/Contract", "id", "ann_export_id");
  }
}

module.exports = ContractExport;
