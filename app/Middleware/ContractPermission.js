'use strict'

const Contract = use("App/Models/Contract");
const Reseller = use('App/Models/Reseller')

class ContractPermission {
  async handle ({ params, auth, request,response }, next) {
    let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

    if(!auth.user.superadmin) {
      let contratto = Contract.query().where("id", params.id)
      if(whiteLabel == 'true' && auth.user.master_reseller) {
        let subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('uuid')
        contratto.whereIn('reseller_uuid',subResellers)
      }
      else contratto.where('reseller_uuid',auth.user.uuid)
      contratto = await contratto.first()
      if(contratto) await next()
      else response.status(403).send({'message': 'Permesso negato'})
    }
    else await next()
  }
}

module.exports = ContractPermission
