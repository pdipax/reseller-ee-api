'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FlowCombination extends Model {


    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }

      static get table () {
        return 'flows_combinations'
      }


      customer () {
        return this.belongsTo('App/Models/Customer','pdp','pdp')
    }
      flow () {
        return this.belongsTo('App/Models/Flow','flow_id','id')
    }

}

module.exports = FlowCombination
