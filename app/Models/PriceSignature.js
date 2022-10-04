'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PriceSignature extends Model {
    static get table () {
        return 'price_signatures'
      }

}


module.exports = PriceSignature
