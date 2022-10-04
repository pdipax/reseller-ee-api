'use strict'

const FlowType = use('App/Models/FlowType')
const Flow = use('App/Models/Flow')

class FlowTypeController {

    async getFlowType ({ request, response, params }) {

        return await FlowType.find(params.id)
    }

    async getAll ({ request, response }) {

        const onlyActive = request.input('onlyActive')



        const types = FlowType.query()

        if(onlyActive === 'true') {
            types.where('active',true)
        }

        return await types.orderBy('commodity').orderBy('service_code').orderBy('flow_code').orderBy('active').fetch()

    }

    async updateFlowType ({ request, response, auth }) {

        const {data} = request.all()

        if(data.service_code && data.service_code.trim().length == 0) {
            data.service_code = null
        }

        const flowTypeData = await FlowType.query().where('id',data.id).first()

        flowTypeData.merge(data)
        return await flowTypeData.save()

    }

    async createFlowType ({ request, response, auth }) {

        const {data} = request.all()

        if(data.service_code && data.service_code.trim().length == 0) {
            data.service_code = null
        }

        return await FlowType.create(data)

 

    }

    async getNewFlowTypes ({ request, response }) {

        return await Flow.query().select('service_code','flow_code').where('commodity','g').whereNull('flow_type_id').groupBy('service_code').groupBy('flow_code').fetch()
    }  

    
}

module.exports = FlowTypeController
