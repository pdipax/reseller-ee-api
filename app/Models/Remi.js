'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Remi extends Model {


    static boot () {
        super.boot()
        this.addTrait('NoTimestamp')

      }

      static get table () {
        return 'remi'
      }   

      static get dates () {
        return super.dates.concat(['date_from', 'date_to'])
      }

      istat_comuni () {
        return this.hasMany('App/Models/RemiComuni','code','remi_code')
      }
      
      distributori () {
        return this.belongsToMany('App/Models/Stakeholder','remi_code','stakeholder_id','code','id_soggetto').pivotModel('App/Models/RemiDistributore')
      }
      shippers () {
        return this.belongsToMany('App/Models/Stakeholder','remi_code','stakeholder_id','code','id_soggetto').pivotModel('App/Models/RemiUdb').withPivot(['volume','cg','amount','price_type','index','date_from','date_to'])
      }

}

module.exports = Remi
