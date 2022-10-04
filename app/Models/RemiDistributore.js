'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RemiDistributore extends Model {
  static boot () {
    super.boot()
    this.addTrait('NoTimestamp')
  }
    static get table () {
        return 'remi_distributore'
      }

      stakeholder () {
        return this.belongsTo('App/Models/Stakeholder','stakeholder_id','id_soggetto')
      }
}

module.exports = RemiDistributore
