'use strict'

const Task = use('Task')

const Database = use('Database')

const Env = use ('Env')


class UpdateFlowType extends Task {
  static get schedule() {
    //return '*/10 * * * * *'
    return '20 7,8,9,10,11,12,14,15,16,17,18,19,20 * * *'
  }

  async handle() {

    if(Env.get('NODE_ENV') =='development') return

    await Database.raw('update flows set flow_type_id = ft.id from flows_types ft where ((flows.service_code = ft.service_code) or flows.service_code is null) and flows.flow_code=ft.flow_code and flows.flow_type_id is null')

    
  }





}

module.exports = UpdateFlowType
