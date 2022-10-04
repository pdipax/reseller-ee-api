'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class IstatClima extends Model {

    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }
      
    static get table () {
        return 'istat_clima'
      }
}

module.exports = IstatClima
