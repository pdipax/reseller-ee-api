'use strict'


const Stakeholder = use('App/Models/Stakeholder')


class StakeholderController {

  async getStakeholderById ({ request, response, auth, params }) {

    return await Stakeholder.query().where('id_soggetto',params.id_soggetto).first()

  }

  async getStakeholders ({ request, response, auth }) {

    const page = request.input('page', 1)
    const rowsPerPage = request.input('perPage', 10)
    const sortBy = request.input('sortBy', 'societa')
    const order = request.input('order', 'asc')
    const query = request.input('query')
    const selectedSettore = request.input('selectedSettore')

    const stQuery = Stakeholder.query()

    if(query && query.length > 0) {
      stQuery.where('societa','ilike','%'+query+'%')
    }
    if(selectedSettore && selectedSettore.length > 0) {
      stQuery.where('settori','ilike','%'+selectedSettore+'%')
    }

    response.success(await stQuery.orderBy(sortBy,order).paginate(page,rowsPerPage) )


  } 

}

module.exports = StakeholderController
