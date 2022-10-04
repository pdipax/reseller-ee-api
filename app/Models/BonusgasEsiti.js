'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BonusgasEsiti extends Model {

    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')

      }

      static get table () {
        return 'bonusgas_esiti'
      }



}

module.exports = BonusgasEsiti
