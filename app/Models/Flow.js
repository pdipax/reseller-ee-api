'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Flow extends Model {


    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')
      }



      combinations () {
        return this.hasMany('App/Models/FlowCombination','id','flow_id')
      }
      distributor () {
        return this.hasOne('App/Models/Distributor','distributor_vat_number','vat_number')
    }
      downloads () {
        return this.hasMany('App/Models/FlowDownload','path','flow_path')
    }

}

module.exports = Flow
