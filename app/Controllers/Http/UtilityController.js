"use strict";

var json2xlsx = require("node-json-xlsx");
const Contract = use("App/Models/Contract");
const ContractType = use("App/Models/ContractType");
const TipoUtenzaType = use("App/Models/TipoUtenzaType");
const ClasseUtenzaType = use("App/Models/ClasseUtenzaType");
const CategoriaUtenzaType = use("App/Models/CategoriaUtenzaType");
const Stakeholder = use("App/Models/Stakeholder");

class UtilityController {
  async getContractsTemplate({ request, response, auth }) {
    try {
      var data = await Contract.query().fetch();
      data = data.toJSON();
      var xlsxFile = await json2xlsx(data, {
        fieldNames: Object.keys(data[0])
      });
      return Buffer.from(xlsxFile, "binary");
    } catch (error) {
      console.log("err", error);
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }

  async getContractTypes({ request, response, auth }) {
    try {
      var data = await ContractType.query().fetch();
      data = data.toJSON();
      var xlsxFile = await json2xlsx(data, {
        fieldNames: Object.keys(data[0])
      });
      return Buffer.from(xlsxFile, "binary");
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }
  
  async getContractTypes({ request, response, auth }) {
    try {
      var data = await ContractType.query().fetch();
      data = data.toJSON();
      var xlsxFile = await json2xlsx(data, {
        fieldNames: Object.keys(data[0])
      });
      return Buffer.from(xlsxFile, "binary");
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }

  async getTipiutenzaTypes({ request, response, auth }) {
    try {
      var data = TipoUtenzaType.query();
      if (!auth.user.superadmin) data.where("reseller", true);
      data = await data.fetch();
      data = data.toJSON();
      var xlsxFile = await json2xlsx(data, {
        fieldNames: Object.keys(data[0])
      });
      return Buffer.from(xlsxFile, "binary");
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }

  async getClassiUtenzaTypes({ request, response, auth }) {
    try {
      var data = await ClasseUtenzaType.query().fetch();
      data = data.toJSON();
      var xlsxFile = await json2xlsx(data, {
        fieldNames: Object.keys(data[0])
      });
      return Buffer.from(xlsxFile, "binary");
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }

  async getCategoriaUtenzaTypes({ request, response, auth }) {
    try {
      var data = await CategoriaUtenzaType.query().fetch();
      data = data.toJSON();
      var xlsxFile = await json2xlsx(data, {
        fieldNames: Object.keys(data[0])
      });
      return Buffer.from(xlsxFile, "binary");
    } catch (error) {
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }
}

module.exports = UtilityController;
