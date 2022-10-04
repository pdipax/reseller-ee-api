'use strict'

class Active {
  async handle ({ request, auth, response }, next) {
    if(!auth.user.active)
      response.status(401).send({'message': 'Account disabilitato'})
    else
      await next()
  }
}

module.exports = Active
