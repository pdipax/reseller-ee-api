'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RcuGas extends Model {


    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }



      static get primaryKey () {
        return 'COD_PDR'
      }
      static get table () {
        return 'rcu_gas'
      }

      flows () {
        return this.belongsToMany('App/Models/Flow','pdp','flow_id','COD_PDR','id')
        .pivotModel('App/Models/FlowCombination')
    }


}

module.exports = RcuGas
