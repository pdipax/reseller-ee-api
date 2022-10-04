'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class InvoiceOenergy extends Model {

    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')

      }

      static get table () {
        return 'invoices_oenergy'
      }



}

module.exports = InvoiceOenergy
