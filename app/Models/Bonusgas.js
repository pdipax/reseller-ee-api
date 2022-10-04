'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Bonusgas extends Model {

    static boot () {
        super.boot()
      }

      static get table () {
        return 'bonusgas'
      }

}

module.exports = Bonusgas
