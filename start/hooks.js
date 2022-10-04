"use strict";

const { hooks } = require("@adonisjs/ignitor");
const moment = require("moment");

hooks.before.providersBooted(() => {
  const Validator = use("Adonis/Addons/Validator");
  const Database = use("Database");

  const PdpFn = async (data, field, message, args, get) => {
    const value = get(data, field);
    if (!value || !data.commodity) return;
    if (data.type == "EE_VOL") {
      var row = Database.table("contracts").where("pdp", value);
      if (!data.user.superadmin)
        row.where("reseller_vat_number", data.user.vat_number);
      row = await row.where("commodity", data.commodity).first();
      if (!row) {
        throw message;
      }
    }
  };

  const PdpUniqueFn = async (data, field, message, args, get) => {
    const value = get(data, field);
    if (!value || !data.commodity) return;
    var row = await Database.table("contracts")
      .where("pdp", value)
      .where("commodity", data.commodity)
      .where(inn => {
        inn.where("status", "INS").orWhere("status", "LAV");
      })
      .first();
    if (row) {
      throw message;
    }
  };

  const DistributoreRemiFn = async (data, field, message, args, get) => {
    const value = get(data, field);
    if (!value || !data.commodity) return;
    if(data.commodity === 'g') {
      var row = await Database.raw(
        `select id_soggetto, partita_iva from stakeholders s 
        inner join	remi_distributore rd on rd.stakeholder_id = s.id_soggetto 
        where rd.remi_code = ? and s.partita_iva = ?`,
        [data.remi_code,data.distributore]
      );
      if (row.rows.length === 0) {
        throw message;
      }
    }
  };

  const RemisFn = async (data, field, message, args, get) => {
    const value = get(data, field);
    if (!value || !data.commodity) return;
    var row = await Database.raw(
      `select * from remi r 
      inner join remi_comuni rc on r.code = rc.remi_code 
      where enabled = true 
      and rc.istat = ?
      and rc.remi_code = ?`,
      [parseInt(data.sede_istat),data.remi_code]
    );
    console.log("data.sede_istat,data.remi_code",data.sede_istat,data.remi_code)
    console.log("row",row)
    if (row.rows.length === 0) {
      throw message;
    }
  };

  const contractTypesFn = async (data, field, message, args, get) => {
    const value = get(data, field);
    if (!value) return;
    const row = await Database.table("contract_types")
      .where("code", value)
      .where("code", "ilike", `${data.commodity}%`)
      .first();
    if (!row) {
      throw message;
    }
  };

  const PricesFn = async (data, field, message, args, get) => {
    const dataoggi = moment().format("YYYY-MM-DD");
    const value = get(data, field);
    if (!value) return;
    let row = null;
    if (!data.user.superadmin) {
      row = await Database.raw(
        `select * from prices p 
        left join price_resellers pr  on p.id = pr.price_id 
        inner join price_signatures ps on p.id = ps.price_id and ps.reseller_uuid = ? and ps.signed = true 
        where commodity = ?
        and sub_reseller = false
        and date_from <= ? and date_to >= ?
        and visible = true 
        and external_id = ?
        and (pr.id is null or pr.reseller_uuid = ?)`,
        [
          data.user.uuid,
          data.commodity,
          dataoggi,
          dataoggi,
          data.codice_offerta,
          data.user.uuid
        ])
    } else {
      row = await Database.raw(
        `select * from prices p 
      where commodity = ? 
      and date_from <= ? and date_to >= ?
      and visible = true 
      and external_id = ?`,
        [data.commodity, dataoggi, dataoggi, data.codice_offerta]
      );
    }
    if (row.rows.length === 0) {
      throw message;
    }
  };

  const existsFn = async (data, field, message, args, get) => {
    const value = get(data, field);
    if (!value) return;
    const [table, column] = args;
    const row = await Database.table(table)
      .where(column, value)
      .first();
    if (!row) {
      throw message;
    }
  };

  Validator.extend("exists", existsFn);
  Validator.extend("contractTypes", contractTypesFn);
  Validator.extend("prices", PricesFn);
  Validator.extend("pdp", PdpFn);
  Validator.extend("pdpUnique", PdpUniqueFn);
  Validator.extend("remis", RemisFn);
  Validator.extend("distributoreRemi", DistributoreRemiFn);
});

hooks.after.httpServer(() => {
  const Response = use("Adonis/Src/Response");

  Response.macro("success", function(data, message) {
    if (data.rows) {
      data = data.toJSON();
    }

    var successObject = {
      code: "SUCCESS",
      message: message || "Operazione eseguita con successo",
      status: 200,
      payload: {},
      pagination: {}
    };

    if (
      typeof data == "number" ||
      typeof data == "boolean" ||
      typeof data == "string"
    ) {
      successObject.payload = { value: data };
    }

    if (data.data) {
      successObject.payload = data.data;
      delete data.data;
      successObject.pagination = data;
    } else {
      successObject.payload = data;
    }

    this.status(200).send(successObject);
  });
});
