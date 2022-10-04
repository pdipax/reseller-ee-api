"use strict";

const ClasseUtenzaType = use("App/Models/ClasseUtenzaType");

class ClasseUtenzaTypeController {
  async get({ request, response, auth, params }) {
    try {
      const { commodity } = request.all();
      const data = await ClasseUtenzaType.query()
        .where("commodity", commodity)
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

module.exports = ClasseUtenzaTypeController;
