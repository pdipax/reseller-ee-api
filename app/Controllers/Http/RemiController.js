"use strict";

const Remi = use("App/Models/Remi");
const RemiUdb = use("App/Models/RemiUdb");
const RemiComuni = use("App/Models/RemiComuni");

const moment = require("moment");

class RemiController {
  async getRemiById({ request, response, auth, params }) {
    return await Remi.query()
      .where("id", params.id)
      .with("istat_comuni")
      .with("distributori")
      .with("shippers")
      .first();
  }

  async storeRemi({ request, response, auth }) {
    if (auth.user.superadmin === false)
      response.status(401).send({ message: "Permesso negato" });

    const data = request.all();
    response.success(await Remi.create(data));
  }

  async updateRemi({ request, response, auth, params }) {
    if (auth.user.superadmin === false)
      response.status(401).send({ message: "Permesso negato" });

    const data = request.all();

    const remi = await Remi.find(params.id);
    remi.merge(data);

    await remi.save();
    response.success(remi);
  }

  async updateRemiDistributori({ request, response, auth, params }) {
    if (auth.user.superadmin === false)
      response.status(401).send({ message: "Permesso negato" });
    const distributori = request.input("distributori", []);

    const remi = await Remi.find(params.id);
    await remi.distributori().detach();
    console.log("st", distributori);
    if (distributori.length > 0) {
      await remi.distributori().attach(distributori);
    }
    response.success(remi);
  }

  async updateRemiIstat({ request, response, auth, params }) {
    if (auth.user.superadmin === false)
      response.status(401).send({ message: "Permesso negato" });
    const istat_comuni = request.input("istat_comuni", []);
    const remi = await Remi.find(params.id);
    await RemiComuni.query()
      .where("remi_code", remi.code)
      .delete();
    if (istat_comuni.length > 0) {
      const finalArray = istat_comuni.map(o => ({
        remi_code: remi.code,
        istat: o.istat,
        comune: o.comune
      }));
      await RemiComuni.createMany(finalArray);
    }
    response.success(remi);
  }

  async updateRemiUdb({ request, response, auth, params }) {
    try {
      if (auth.user.superadmin === false)
        response.status(401).send({ message: "Permesso negato" });
      const shippers = request.input("shippers", []);
      const remi = await Remi.find(params.id);
      await remi.shippers().detach();
      if (shippers.length > 0) {
        const finalArray = shippers.map(o => ({
          remi_code: remi.code,
          stakeholder_id: o.stakeholder_id,
          ...o.pivot
        }));
        await RemiUdb.createMany(finalArray);
      }
      response.success(remi);
    } catch (error) {
      console.log("err", error);
    }
  }

  async getRemis({ request, response, auth }) {
    const page = request.input("page", 1);
    const rowsPerPage = request.input("perPage", 999999);
    const sortBy = request.input("sortBy", "code");
    const order = request.input("order", "asc");
    const query = request.input("query");
    const istat = request.input("istat", null);
    const status = request.input("selectedStatus", true);
    const RemiQuery = Remi.query()
      .with("istat_comuni")
      .with("distributori")
      .with("shippers");
    RemiQuery.where("enabled", status);
    if (query && query.length > 0) {
      RemiQuery.where(builder => {
        builder.where("code", "ilike", query + "%");
        builder.orWhereHas("istat_comuni", builder => {
          builder.where("comune", "ilike", query + "%");
        });
      });
    }
    if (istat) {
      RemiQuery.whereHas("istat_comuni", builder => {
        builder.where("istat", istat);
      });
    }

    response.success(
      await RemiQuery.orderBy(sortBy, order).paginate(page, rowsPerPage)
    );
  }
}

module.exports = RemiController;
