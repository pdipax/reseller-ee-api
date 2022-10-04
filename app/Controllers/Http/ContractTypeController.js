"use strict";

const ContractType = use("App/Models/ContractType");

class ContractTypeController {
  async get({ request, response, auth, params }) {
    try {
      const { commodity } = request.all();
      var data = ContractType.query()
      if (commodity && commodity.length > 0) data.where("code", "ilike", `${commodity}%`);
      data = await data.orderBy("name", "asc").fetch();
      return response.success(data);
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error.response.message });
    }
  }
}

module.exports = ContractTypeController;
