'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Price extends Model {


    static boot () {
        super.boot()
      }

      static get dates () {
        return super.dates.concat(['date_from','date_to','date_start'])
      }

      resellers () {
        return this.belongsToMany('App/Models/Reseller','price_id','reseller_uuid','id','uuid').pivotModel('App/Models/PriceReseller')
    }


    remis () {
        return this.belongsToMany('App/Models/Remi','price_id','remi_code','id','code').pivotModel('App/Models/PriceRemi')
    }

    signatures () {
        return this.belongsToMany('App/Models/Reseller','price_id','reseller_uuid','id','uuid').pivotModel('App/Models/PriceSignature')
        .withPivot(['signed','created_by'])
    }

    parentPrice () {
      return this.belongsTo('App/Models/Price','parent_price_id','id')
  }


}

module.exports = Price
