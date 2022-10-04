'use strict'

const Task = use('Task')

const Customer = use('App/Models/Customer')
const FlowCombination = use('App/Models/FlowCombination')

const moment = require('moment')
const Env = use ('Env')


class UpdateNullPdp extends Task {
  static get schedule() {
    //return '*/10 * * * * *'
    return '22 7,8,9,10,11,12,14,15,16,17,18,19,20 * * *'
  }

  async handle() {

    if(Env.get('NODE_ENV') =='development') return

    const nullPdpData = await FlowCombination.query().whereNull('pdp').fetch()

    const nullPdp = nullPdpData.toJSON()

    nullPdp.forEach(async element => {


      const customer = await Customer.query().where('meter_number',element.matr_mis).orWhere('meter_number',parseInt(element.matr_mis)).orderBy('date_from','desc').first()

      if(customer) {


        await FlowCombination.query()
        .where('id', element.id).update({
          pdp: customer.pdp
        })
      }
      


    });



    
  }





}

module.exports = UpdateNullPdp
