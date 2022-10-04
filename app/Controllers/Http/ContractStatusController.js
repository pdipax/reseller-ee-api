
const ContractStatus = use("App/Models/ContractStatus");

class ContractStatusController {
  async get({ request, response, auth }) {
    try {
      const data = await ContractStatus.query()
        .orderBy("id", "asc")
        .fetch();
      return response.success(data);
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error.response.message });
    }
  }
}

module.exports = ContractStatusController;

