'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class PriceReseller extends Model {
    static get table () {
        return 'price_resellers'
      }
}

module.exports = PriceReseller
