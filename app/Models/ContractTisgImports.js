'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class ContractTisg extends Model {

  static get table () {
      return 'contract_tisg_imports'
  }
  
  anag() {
    return this.hasMany("App/Models/ContractTisgAnag", "id", "import_tisg_id");
  }
  
  swin() {
    return this.hasMany("App/Models/ContractTisgSwin", "id", "import_tisg_id");
  }

  swout() {
    return this.hasMany("App/Models/ContractTisgSwout", "id", "import_tisg_id");
  }
}

module.exports = ContractTisg
