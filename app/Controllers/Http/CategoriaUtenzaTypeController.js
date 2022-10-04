"use strict";

const CategoriaUtenzaType = use("App/Models/CategoriaUtenzaType");

class CategoriaUtenzaTypeController {
  async get({ request, response, auth }) {
    try {
      const data = await CategoriaUtenzaType.query()
        .orderBy("name", "asc")
        .fetch();
      return response.success(data);
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error.response.message });
    }
  }
}

module.exports = CategoriaUtenzaTypeController;
