'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TicketType extends Model {

    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }

      static get table () {
        return 'ticket_types'
      }

}

module.exports = TicketType
