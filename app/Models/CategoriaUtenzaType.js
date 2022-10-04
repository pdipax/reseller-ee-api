'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CategoriaUtenzaType extends Model {

    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }

      static get table () {
        return 'categorieutenza_types'
      }

}

module.exports = CategoriaUtenzaType
