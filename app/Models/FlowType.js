'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FlowType extends Model {


    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }

      static get table () {
        return 'flows_types'
      }

      flows () {
        return this.hasMany('App/Models/Flow','id','flow_type_id')
      }


}

module.exports = FlowType
