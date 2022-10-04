'use strict'

class Superadmin {
  async handle ({ request, auth, response }, next) {
    if(!auth.user.master_reseller && !auth.user.superadmin)
      response.status(401).send({'message': 'Permesso negato'})
    else
      await next()
  }
}

module.exports = Superadmin
