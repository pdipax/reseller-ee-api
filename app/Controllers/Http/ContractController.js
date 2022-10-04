"use strict";

const ContractNote = use("App/Models/ContractNote");
const Contract = use("App/Models/Contract");
const Json2csvParser = require("json2csv").Parser;
const Mail = use("Mail");
const Helpers = use("Helpers");

class ContractController {
  async annullaContratto({ params, response, auth }) {
    const { id } = params;
    try {
      const contratto = await Contract.query().where("id", id).first();
      await contratto.merge({ status: "ANN" });
      await contratto.save();
      return response.success(contratto);
    } catch (error) {
      return response.status(500).send({ message: "System Error", error: error });
    }
  }

  async modificaStato({ params, response, auth, request }) {
    const { id } = params;
    const stato = request.input("stato", null);
    try {
      const contratto = await Contract.query().where("id", id).first();
      await contratto.merge({ status: stato });
      await contratto.save();
      return response.success(contratto);
    } catch (error) {
      return response.status(500).send({ message: "System Error", error: error });
    }
  }

  async annullaContrattoSII({ params, response, request, auth }) {
    const { id } = params;
    const { cod_causale, motivazione } = request.all();
    try {
      const contratto = await Contract.query().where("id", id).first();
      await contratto.merge({
        status: "RA",
        ann_cod_causale: cod_causale,
        ann_motivazione: motivazione,
      });
      await contratto.save();
      return response.success(contratto);
    } catch (error) {
      return response.status(500).send({ message: "System Error", error: error });
    }
  }
  async create({ request, response, auth }) {
    try {
      const { data } = request.all();
      const contratto = await Contract.create({
        ...data,
        reseller_uuid: auth.user.uuid,
      });

      if (contratto.type == "GAS_A01" || contratto.type == "GAS_A40") {
        let subject = "RESELLER.NEG - Nuova attivazione inserita : ";
        let logo = "/static/logo.png";
        let from = "noreply@negitaly.it";
        let url = "https://reseller.negitaly.it/pratiche/contratti/";
        let primary = "#00d1b2";

        Mail.send(
          "notify-attivazione",
          {
            contratto: {
              id: contratto.id,
              url: url + contratto.id,
              primary,
            },
          },
          (message) => {
            message
              .from(from)
              .to("reseller@negitaly.it")
              .subject(subject + contratto.id)
              .embed(Helpers.resourcesPath(logo), "logo");
          }
        );
      }

      response.success(contratto);
    } catch (error) {
      return response.status(500).send({ message: "System Error", error: error });
    }
  }

  async downloadEsiti({ request, response, auth }) {
    let whiteLabel = request.header("white-label") ? request.header("white-label") : "false";
    const switch_dates = request.input("switch_dates", []);
    const array_reseller = request.input("array_reseller", []);

    const search = request.input("search");
    const type = request.input("type");
    const array_types = request.input("array_types", []);
    const array_status = request.input("array_status", []);
    const upload_id = request.input("upload_id", null);
    const export_id = request.input("export_id", null);
    const export_type = request.input("export_type", null);
    let query = Contract.query().with("reseller");

    if (search && search.length > 0) {
      query.where((inner) => {
        inner
          .where((builder) => {
            builder.orWhereRaw("CONCAT(nome,' ',cognome) ilike ?", ["%" + search + "%"]);
            builder.orWhereRaw("CONCAT(cognome,' ',nome) ilike ?", ["%" + search + "%"]);
          })
          .orWhere("ragione_sociale", "iLIKE", `%${search}%`)
          .orWhere("pdp", "iLIKE", `%${search}%`)
          .orWhere("codice_fiscale", "iLIKE", `%${search}%`)
          .orWhere("partita_iva", "iLIKE", `%${search}%`);
      });
    }

    if (array_types.length > 0) {
      query.where((builder) => {
        for (let i in array_types) {
          builder.orWhere("type", array_types[i]);
        }
      });
    }

    if (array_status.length > 0) {
      query.where((builder) => {
        for (let i in array_status) {
          builder.orWhere("status", array_status[i]);
        }
      });
    }
    if (upload_id) {
      query.where("upload_id", upload_id);
    }
    if (export_id && export_type) {
      query.where(export_type === "A" ? "ann_export_id" : "switch_export_id", export_id);
    }
    if (type && type.length > 0) {
      query.where("type", type);
    }
    if (switch_dates.length > 0) {
      query.where((builder) => {
        builder.where("date_switch", ">=", new Date(switch_dates[0]));
        builder.where("date_switch", "<=", new Date(switch_dates[1]));
      });
    }
    if (array_reseller.length > 0) {
      query.where((builder) => {
        for (let i in array_reseller) {
          builder.orWhere("reseller_uuid", array_reseller[i]);
        }
      });
    }

    query.with("switch_contract_flows", (builder) => {
      if (["POS", "NEG", "TIM"].includes(array_status[0])) builder.where("COD_FLUSSO", ["POS", "NEG"].includes(array_status[0]) ? "0100" : "0200");
      if (array_status[0] === "AP" || array_status[0] === "AN") builder.where("COD_FLUSSO", "150").where("COD_SERVIZIO", "APR");
      if (array_status[0] === "AI" || array_status[0] === "AF") builder.where("COD_FLUSSO", "0100").where("COD_SERVIZIO", "APR");
      if (array_status[0] === "ANS") builder.where("COD_FLUSSO", "0200").where("COD_SERVIZIO", "APN");
    });
    query.with("ann_contract_flows", (builder) => {
      if (array_status[0] === "AP" || array_status[0] === "AN") builder.where("COD_FLUSSO", "150").where("COD_SERVIZIO", "APR");
      if (array_status[0] === "AI" || array_status[0] === "AF") builder.where("COD_FLUSSO", "0100").where("COD_SERVIZIO", "APR");
      if (array_status[0] === "ANS") builder.where("COD_FLUSSO", "0200").where("COD_SERVIZIO", "APN");
    });
    query.where(inside => {
      inside.whereHas("switch_contract_flows", (builder) => {
        if (["POS", "NEG", "TIM"].includes(array_status[0])) builder.where("COD_FLUSSO", ["POS", "NEG"].includes(array_status[0]) ? "0100" : "0200");
        if (array_status[0] === "AP" || array_status[0] === "AN") builder.where("COD_FLUSSO", "150").where("COD_SERVIZIO", "APR");
        if (array_status[0] === "AI" || array_status[0] === "AF") builder.where("COD_FLUSSO", "0100").where("COD_SERVIZIO", "APR");
        if (array_status[0] === "ANS") builder.where("COD_FLUSSO", "0200").where("COD_SERVIZIO", "APN");
      });
      inside.orWhereHas("ann_contract_flows", (builder) => {
        if (array_status[0] === "AP" || array_status[0] === "AN") builder.where("COD_FLUSSO", "150").where("COD_SERVIZIO", "APR");
        if (array_status[0] === "AI" || array_status[0] === "AF") builder.where("COD_FLUSSO", "0100").where("COD_SERVIZIO", "APR");
        if (array_status[0] === "ANS") builder.where("COD_FLUSSO", "0200").where("COD_SERVIZIO", "APN");
      });
    })
    if (!auth.user.superadmin && ((whiteLabel == "true" && !auth.user.master_reseller) || whiteLabel == "false")) {
      query.where("reseller_uuid", auth.user.uuid);
    }
    if (whiteLabel == "true" && auth.user.master_reseller) {
      query.where((inner) => {
        inner.where("reseller_uuid", auth.user.uuid);
        inner.orWhereHas("reseller", (inside) => {
          inside.where("master_reseller_uuid", auth.user.uuid);
        });
      });
    }
    query = await query.fetch();
    query = query.toJSON();
    let esitiArray = [];
    if (query.length > 0) {
      for (let i in query) {
        let obj = { company_name: query[i].reseller.company_name,pdp:query[i].pdp };
        if (query[i].ann_contract_flows && query[i].ann_contract_flows.extra) obj = { ...obj, ...query[i].ann_contract_flows.extra };
        if (query[i].switch_contract_flows && query[i].switch_contract_flows.extra) obj = { ...obj, ...query[i].switch_contract_flows.extra };
        esitiArray.push(obj);
      }
      const json2csvParser = new Json2csvParser({
        header: true,
        delimiter: ";",
        escapedQuote: "",
        quote: "",
      });
      return await json2csvParser.parse(esitiArray);
    } else return response.status(404).send("Nessun esito trovato");
  }

  async getAll({ request, response, auth }) {
    let whiteLabel = request.header("white-label") ? request.header("white-label") : "false";
    const page = request.input("page", 1);
    const rowsPerPage = request.input("perPage", 10);
    const sortBy = request.input("sortBy", "id");
    const order = request.input("order", "asc");
    const search = request.input("search");
    const type = request.input("type");
    const array_types = request.input("array_types", []);
    const array_status = request.input("array_status", []);
    const array_reseller = request.input("array_reseller", []);
    const switch_dates = request.input("switch_dates", []);
    const upload_id = request.input("upload_id", null);
    const export_id = request.input("export_id", null);
    const export_type = request.input("export_type", null);
    const download = request.input("download", false);
    let query = Contract.query();
    if (download === false) {
      query.with("contract_types").with("tipiutenza_types").with("classiutenza_types").with("stakeholders_distributore").with("stakeholders_precedente_fornitore").with("prices").with("remi").with("switch_contract_flows").with("ann_contract_flows").with("contract_status").with("reseller");
    }
    if (!auth.user.superadmin && ((whiteLabel == "true" && !auth.user.master_reseller) || whiteLabel == "false")) {
      query.where("reseller_uuid", auth.user.uuid);
    }
    if (whiteLabel == "true" && auth.user.master_reseller) {
      query.where((inner) => {
        inner.where("reseller_uuid", auth.user.uuid);
        inner.orWhereHas("reseller", (inside) => {
          inside.where("master_reseller_uuid", auth.user.uuid);
        });
      });
    }

    if (search && search.length > 0) {
      query.where((inner) => {
        inner
          .where((builder) => {
            builder.orWhereRaw("CONCAT(nome,' ',cognome) ilike ?", ["%" + search + "%"]);
            builder.orWhereRaw("CONCAT(cognome,' ',nome) ilike ?", ["%" + search + "%"]);
          })
          .orWhere("ragione_sociale", "iLIKE", `%${search}%`)
          .orWhere("pdp", "iLIKE", `%${search}%`)
          .orWhere("codice_fiscale", "iLIKE", `%${search}%`)
          .orWhere("partita_iva", "iLIKE", `%${search}%`);
      });
    }

    if (array_types.length > 0) {
      query.where((builder) => {
        for (let i in array_types) {
          builder.orWhere("type", array_types[i]);
        }
      });
    }

    if (array_status.length > 0) {
      query.where((builder) => {
        for (let i in array_status) {
          builder.orWhere("status", array_status[i]);
        }
      });
    }
    if (array_reseller.length > 0) {
      query.where((builder) => {
        for (let i in array_reseller) {
          builder.orWhere("reseller_uuid", array_reseller[i]);
        }
      });
    }
    if (switch_dates.length > 0) {
      query.where((builder) => {
        builder.where("date_switch", ">=", new Date(switch_dates[0]));
        builder.where("date_switch", "<=", new Date(switch_dates[1]));
      });
    }
    if (upload_id) {
      query.where("upload_id", upload_id);
    }
    if (export_id && export_type) {
      query.where(export_type === "A" ? "ann_export_id" : "switch_export_id", export_id);
    }
    if (type && type.length > 0) {
      query.where("type", type);
    }
    if (download === false) {
      return response.success(await query.orderBy(sortBy, order).paginate(page, rowsPerPage));
    } else {
      query = await query
        .select([
          "id",
          "resellers.company_name",
          "commodity",
          "type",
          "tipo_persona",
          "nome",
          "cognome",
          "ragione_sociale",
          "codice_fiscale",
          "partita_iva",
          "telefono",
          "sede_toponimo",
          "sede_indirizzo",
          "sede_civico",
          "sede_istat",
          "sede_comune",
          "sede_cap",
          "sede_provincia",
          "categoria_uso",
          "classe_prelievo",
          "consumo_annuo_presunto",
          "codice_offerta",
          "pdp",
          "misuratore",
          "distributore",
          "precedente_fornitore",
          "remi_code",
          "status",
          "reseller_uuid",
          "created_at",
          "data_stipula",
          "date_switch",
        ])
        .innerJoin("resellers", function () {
          this.on("reseller_uuid", "resellers.uuid");
        })
        .fetch();

      query = query.toJSON();
      const json2csvParser = new Json2csvParser({
        header: true,
        delimiter: ";",
        escapedQuote: "",
        quote: "",
      });
      return await json2csvParser.parse(query);
    }
  }

  async getById({ request, response, auth, params }) {
    return await Contract.query().where("id", params.id).with("contract_types").with("tipiutenza_types").with("classiutenza_types").with("stakeholders_distributore").with("stakeholders_precedente_fornitore").with("prices").with("remi").with("switch_contract_flows").with("ann_contract_flows").with("reseller").with("contract_status").with("contract_note").first();
  }

  async checkPdpUnique({ request, response, auth }) {
    try {
      const pdp = request.input("pdp", null);
      const commodity = request.input("commodity", null);
      var row = await Contract.query()
        .where("pdp", pdp)
        .where("commodity", commodity)
        .where((inn) => {
          inn.where("status", "INS").orWhere("status", "LAV");
        })
        .first();
      return row;
    } catch (error) {
      return response.status(500).send({ message: "System Error", error: error });
    }
  }

  async contractAddNote({ request, params, response, auth }) {
    let whiteLabel = request.header("white-label") ? request.header("white-label") : "false";
    let ownerWhiteLabel = request.header("owner-white-label");

    try {
      const note = request.input("note", null);
      let contratto = await Contract.query().with("reseller").where("id", params.id).first();
      contratto = contratto.toJSON();
      const contract_note = await ContractNote.create({
        contract_id: contratto.id,
        reseller_uuid: auth.user.uuid,
        status: contratto.status,
        note: note,
      });

      let mail = "";
      let subject = "RESELLER.NEG - Nuova nota sul contratto N: ";
      let logo = "/static/logo.png";
      let from = "noreply@negitaly.it";
      let url = "https://reseller.negitaly.it/pratiche/contratti/";
      let primary = "#00d1b2";

      if (contratto.reseller && contratto.reseller.master_reseller_uuid) {
        subject = "OENERGY Nuova nota sul contratto N: ";
        logo = "/static/logo-oenergy.png";
        from = "reseller@oenergy.it";
        url = "https://resellergas.oenergy.it/pratiche/contratti/";
        primary = "#9c1b7e";
      }

      if (auth.user.superadmin || (whiteLabel == "true" && auth.user.master_reseller)) mail = contratto.reseller.email_notifiche_pratiche;
      else mail = "reseller@negitaly.it";

      if (mail) {
        Mail.send(
          "notify-message",
          {
            contratto: {
              id: contratto.id,
              nota: note,
              url: url + contratto.id,
              primary,
            },
          },
          (message) => {
            message
              .from(from)
              .to(mail)
              .subject(subject + contratto.id)
              .embed(Helpers.resourcesPath(logo), "logo");
          }
        );
      }
      response.success(contract_note);
    } catch (error) {
      console.log(error);
      return response.status(500).send({ message: "System Error", error: error });
    }
  }
}

module.exports = ContractController;
