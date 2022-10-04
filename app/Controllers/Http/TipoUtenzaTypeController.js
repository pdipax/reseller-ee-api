const TipoUtenzaType = use("App/Models/TipoUtenzaType");

class TipoUtenzaTypeController {
  async get({ request, response, auth, params }) {
    try {
      const { commodity } = request.all();
      const data = await TipoUtenzaType.query()
        .where("commodity", commodity)
        .where("reseller", true)
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

module.exports = TipoUtenzaTypeController;
