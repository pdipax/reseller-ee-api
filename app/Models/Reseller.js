'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

const { v4: uuidv4 } = require('uuid');

class Reseller extends Model {

  static boot () {
    super.boot()
    
    this.addTrait('NoTimestamp')
   /**
     * A hook to hash the user password before saving
     * it to the database.
     */
    this.addHook('beforeCreate', async (istance) => {
      istance.uuid = uuidv4()
    })
    this.addHook('beforeSave', async (istance) => {

      if (istance.dirty.password) {
        istance.password = await Hash.make(istance.password)
      }
    })
  }

  static get hidden () {
    return ['password']
  }

  static get primaryKey () {
    return 'uuid'
  }
  /**
   * A relationship on tokens is required for auth to
   * work. Since features like `refreshTokens` or
   * `rememberToken` will be saved inside the
   * tokens table.
   *
   * @method tokens
   *
   * @return {Object}
   */
  tokens () {
    return this.hasMany('App/Models/Token')
  }

  pdrs () {
      return this.hasMany('App/Models/RcuGas','vat_number','PIVA_CC')
  }

  resellerMaster () {
      return this.belongsTo('App/Models/Reseller','master_reseller_uuid','uuid')
  }

  
}

module.exports = Reseller
