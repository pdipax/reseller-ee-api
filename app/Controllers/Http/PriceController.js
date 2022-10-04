"use strict";

const Price = use("App/Models/Price");
const PriceSignature = use("App/Models/PriceSignature");
const Env = use("Env");

const moment = require("moment");

const axios = require("axios");

class PriceController {
  async Signature({ request, response, auth, params }) {
    let whiteLabel = request.header("white-label") ? request.header("white-label") : "false";
    let ownerWhiteLabel = whiteLabel == "true" ? request.header("owner-white-label") : "neg";

    try {
      const price_id = request.input("price_id");
      const content = request.input("content");

      const data = {
        id_esterno: auth.user.uuid + "_" + price_id,
        tipo_firma: "FEA",
        firmatario: auth.user.firmaotp_name,
        telefono: auth.user.firmaotp_phone,
        email: auth.user.email,
        content: content.split(",")[1],
        endpoint: "https://apires.negitaly.it/v1/prices/signature/notify",
        template: "standard",
      };

      await axios.post("https://api.firmaotp.it/v1/documento", data, {
        headers: {
          Authorization: `Bearer ` + Env.get("FIRMAOTP_" + ownerWhiteLabel),
        },
      });
      const price = await Price.find(price_id);
      return response.success(await price.signatures().attach([auth.user.uuid]));
    } catch (error) {
      console.log("error", error);
      return response.status(500).send({ message: "System Error", error: error.response.message });
    }
  }

  async NotifySignature({ request, response, auth, params }) {
    try {
      const data = request.all();
      const orderData = data.orderID.split("_");
      const reseller_uuid = orderData[0];
      const price_id = orderData[1];
      const price = await PriceSignature.query().where("reseller_uuid", reseller_uuid).where("price_id", price_id).first();
      price.merge({ signed: true });
      await price.save();
    } catch (error) {
      console.log("NotifySignature", error);
    }
  }

  async NotifyManualeSignature({ request, response, auth, params }) {
    const { price_id, reseller_uuid } = request.all();
    const price = await PriceSignature.query().where("reseller_uuid", reseller_uuid).where("price_id", price_id).first();
    if (price) {
      price.merge({ signed: true, created_by: auth.user.uuid });
      await price.save();
    } else {
      await PriceSignature.create({ price_id, reseller_uuid, signed: true, created_by: auth.user.uuid });
    }
    return "Operazione effettuata con successo";
  }

  async getPriceById({ request, response, auth, params }) {
    let whiteLabel = request.header("white-label") ? request.header("white-label") : "false";

    const PriceQuery = Price.query().where("id", params.id);

    const user = auth.user;

    if (user.superadmin || (whiteLabel == "true" && auth.user.master_reseller)) {
      PriceQuery.with("resellers").with("remis").with("signatures").with("parentPrice");
    } else {
      PriceQuery.where((builder) => {
        builder.doesntHave("resellers").orWhereHas("resellers", (bld) => {
          bld.where("reseller_uuid", user.uuid);
        });
      })
        .where("visible", true)
        .with("remis")
        .with("parentPrice")
        .with("resellers", (builder) => {
          builder.where("reseller_uuid", user.uuid);
        });
    }

    return await PriceQuery.first();
  }

  async storePrice({ request, response, auth }) {
    let whiteLabel = request.header("white-label") ? request.header("white-label") : "false";

    if (auth.user.superadmin === false && whiteLabel == "true" && !auth.user.master_reseller) response.status(401).send({ message: "Permesso negato" });

    const data = request.all();

    var remis = [];
    var resellers = [];
    if (data.amount_extra) data.amount_extra = JSON.stringify(data.amount_extra);
    if (data.remis && data.remis.length > 0) {
      remis = data.remis.map((el) => el.code);
    }
    delete data.remis;

    if (data.resellers && data.resellers.length > 0) {
      resellers = data.resellers.map((el) => el.uuid);
    }
    delete data.resellers;

    delete data.signatures;

    if (whiteLabel == "true" && auth.user.master_reseller) {
      data.master_reseller_uuid = auth.user.uuid;
    }

    const price = await Price.create(data);
    const priceList = await Price.find(price.id);

    if (remis.length > 0) {
      await priceList.remis().attach(remis);
    }
    if (resellers.length > 0) {
      await priceList.resellers().attach(resellers);
    }

    response.success(priceList);
  }

  async updatePrice({ request, response, auth, params }) {
    if (auth.user.superadmin === false) response.status(401).send({ message: "Permesso negato" });

    const data = request.all();

    var remis = [];
    var resellers = [];
    if (data.amount_extra) data.amount_extra = JSON.stringify(data.amount_extra);
    if (data.remis && data.remis.length > 0) {
      remis = data.remis.map((el) => el.code);
    }
    delete data.remis;

    if (data.resellers && data.resellers.length > 0) {
      resellers = data.resellers.map((el) => el.uuid);
    }
    delete data.resellers;

    delete data.signatures;

    const price = await Price.find(params.id);
    price.merge(data);

    await price.save();

    await price.remis().detach();
    await price.resellers().detach();

    if (remis.length > 0) {
      await price.remis().attach(remis);
    }
    if (resellers.length > 0) {
      await price.resellers().attach(resellers);
    }

    response.success(price);
  }

  async getPrices({ request, response, auth }) {
    const page = request.input("page", 1);
    const rowsPerPage = request.input("perPage", 999999);
    const search = request.input("search", null);
    const sortBy = request.input("sortBy", "date_to");
    const order = request.input("order", "asc");
    const query = request.input("query");
    const commodity = request.input("commodity");
    const firmato = request.input("firmato", null);
    const parent = request.input("parent", null);

    //status active, expired, hidden
    const status = request.input("status", "active");

    const user = auth.user;

    const dataoggi = moment().format("YYYY-MM-DD");

    const PriceQuery = Price.query();
    let whiteLabel = request.header("white-label") ? request.header("white-label") : "false";
    if (whiteLabel == "true") {
      if (auth.user.master_reseller_uuid && !auth.user.master_reseller) {
        PriceQuery.where("master_reseller_uuid", auth.user.master_reseller_uuid);
      } else if (auth.user.master_reseller && !parent) {
        PriceQuery.where("master_reseller_uuid", auth.user.uuid);
      }
    } else {
      PriceQuery.whereNull("master_reseller_uuid");
    }
    if (parent) PriceQuery.where("sub_reseller", true);

    if (status == "active") {
      PriceQuery.where("date_from", "<=", dataoggi).where("date_to", ">=", dataoggi).where("visible", true);
    }
    if (status == "future") {
      PriceQuery.where("date_from", ">", dataoggi).where("date_to", ">=", dataoggi).where("visible", true);
    }
    if (status == "active_future") {
      PriceQuery.where((sub) => {
        sub
          .where((inner) => {
            inner.where("date_from", "<=", dataoggi).where("date_to", ">=", dataoggi).where("visible", true)
          })
          .orWhere((inner) => {
            inner.where("date_from", ">", dataoggi).where("date_to", ">=", dataoggi).where("visible", true)
          })
          
      });
    }
    if (status == "expired") {
      PriceQuery.where("date_to", "<=", moment()).where("visible", true);
    }
    if (status == "hidden" && (user.superadmin === true || (whiteLabel == "true" && user.master_reseller))) {
      PriceQuery.where("visible", false);
    }

    if (query && query.length > 0) {
      PriceQuery.where("external_id", "ilike", query + "%");
    }
    if (commodity) {
      PriceQuery.where("commodity", commodity);
    }

    if (user.superadmin || (whiteLabel == "true" && user.master_reseller && !parent)) {
      PriceQuery.with("resellers").with("remis").with("signatures");
    } else {
      PriceQuery.where((builder) => {
        builder.doesntHave("resellers").orWhereHas("resellers", (bld) => {
          bld.where("reseller_uuid", user.uuid);
        });
      })
        .whereNotNull("external_id")
        .with("resellers", (builder) => {
          builder.where("reseller_uuid", user.uuid);
        })
        .with("remis");
      if (firmato) {
        PriceQuery.where((inner) => {
          // inner.doesntHave("signatures")
          inner.whereHas("signatures", (builder) => {
            builder.where("reseller_uuid", user.uuid).where("signed", true);
          });
        });
      }
      PriceQuery.with("signatures", (builder) => {
        builder.where("reseller_uuid", user.uuid);
      });
    }

    response.success(await PriceQuery.orderBy(sortBy, order).paginate(page, rowsPerPage));
  }
}

module.exports = PriceController;
