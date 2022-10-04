'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BonusgasDettaglio extends Model {

    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')

      }

      static get table () {
        return 'bonusgas_dettaglio'
      }


}

module.exports = BonusgasDettaglio
