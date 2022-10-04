'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Customer extends Model {


    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }


      static get table () {
        return 'resellers_customers'
      }

      static get dates() {
        return super.dates.concat(['date_from','date_to'])
    }

    static castDates(field, value) {
        if (field === 'date_from' || field==='date_to') {
            return value.format('DD/MM/YYYY')
        }
        return super.formatDates(field, value)
    }

      rcuGas () {
        return this.belongsTo('App/Models/RcuGas','pdp','COD_PDR')
      }
      reseller () {
        return this.belongsTo('App/Models/Reseller','reseller_vat_number','vat_number')
      }
}

module.exports = Customer
