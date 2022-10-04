'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RemiUdb extends Model {
  static boot () {
    super.boot()
    this.addTrait('NoTimestamp')
  }
    static get table () {
        return 'remi_udb'
      }

      stakeholder () {
        return this.belongsTo('App/Models/Stakeholder','stakeholder_id','id_soggetto')
      }
}

module.exports = RemiUdb
