"use strict";

const ContractExport = use("App/Models/ContractExport");
const Contract = use("App/Models/Contract");
const moment = require("moment");

const Json2csvParser = require("json2csv").Parser;
const Env = use("Env");

class ContractExportController {
  async exportMassiveSwitchGas(contracts, data_switch, export_id) {
    var d = new Date();
    var mese = d.getMonth() + 1;
    var anno = d.getFullYear();
    let contractsV2 = [];
    for (let i in contracts) {
      let obj = {
        COD_SERVIZIO: contracts[i].type.split("_")[1],
        COD_FLUSSO: '0050',
        PIVA_UTENTE: Env.get("PIVA_UTENTE"),
        PIVA_GESTORE: Env.get("PIVA_GESTORE"),
        CP_UTENTE: contracts[i].switch_cp_utente_sii
          ? contracts[i].switch_cp_utente_sii
          : `${ export_id.toString().padStart(6, "0")}_${contracts[i].id.toString().padStart(8, "0")}`,
        COD_PDR: contracts[i].pdp,
        CODICE_CONTRATTO: `${Env.get("OWNER_NAME")}_${contracts[i].reseller.vat_number}`,
        CF: contracts[i].codice_fiscale,
        PIVA: contracts[i].partita_iva,
        CF_STRANIERO: null,
        EMAIL: contracts[i].email,
        TELEFONO: contracts[i].telefono,
        DATA_CONTRATTO: moment(contracts[i].data_stipula).format("DD/MM/YYYY"),
        DATA_DECORRENZA: moment(
          contracts[i].date_switch ? contracts[i].date_switch : data_switch
        ).format("DD/MM/YYYY"),
        REVOCA: 1,
        ACQUISTO_CREDITO: 0,
        PIVA_CC: contracts[i].reseller.vat_number,
        PIVA_UDB: contracts[i].remi.piva_udb,
        SERVIZIO_ENERGETICO: "NO",
        SE_PIVA: null
      };
      contractsV2.push(obj);
    }
    return contractsV2;
  }

  async exportMassiveAnnullamentiGas(contracts,export_id) {
    let contractsV2 = [];
    for (let i in contracts) {
      let obj = {
        COD_SERVIZIO: 'APR',
        COD_FLUSSO: '0050',
        PIVA_UTENTE: Env.get("PIVA_UTENTE"),
        PIVA_GESTORE: Env.get("PIVA_GESTORE"),
        CP_UTENTE: contracts[i].ann_cp_utente_sii ? contracts[i].ann_cp_utente_sii : `${ export_id.toString().padStart(6, "0")}_${contracts[i].id.toString().padStart(8, "0")}`,
        CP_GESTORE_ANN: contracts[i].switch_contract_flows.extra.CP_GESTORE,
        CP_UTENTE_ANN: contracts[i].switch_contract_flows.extra.CP_UTENTE,
        SETTORE: 'G',
        COD_POD: null,
        COD_PDR: contracts[i].pdp,
        COD_CAUSALE: contracts[i].ann_cod_causale,
        MOTIVAZIONE: contracts[i].ann_motivazione,
        NOTE:null
      };
      contractsV2.push(obj);
    }
    return contractsV2;
  }

  async exportMassiveAnnullamentiEE(contracts,export_id) {
    let contractsV2 = [];
    for (let i in contracts) {
      let obj = {
        COD_SERVIZIO: 'APR',
        COD_FLUSSO: '0050',
        PIVA_UTENTE: Env.get("PIVA_UTENTE"),
        PIVA_GESTORE: Env.get("PIVA_GESTORE"),
        CP_UTENTE: contracts[i].ann_cp_utente_sii ? contracts[i].ann_cp_utente_sii : `${ export_id.toString().padStart(6, "0")}_${contracts[i].id.toString().padStart(8, "0")}`,
        CP_GESTORE_ANN: contracts[i].switch_contract_flows.extra.CP_GESTORE,
        CP_UTENTE_ANN: contracts[i].switch_contract_flows.extra.CP_UTENTE,
        SETTORE: 'E',
        COD_POD: contracts[i].pdp,
        COD_PDR: null,
        COD_CAUSALE: contracts[i].ann_cod_causale,
        MOTIVAZIONE: contracts[i].ann_motivazione,
        NOTE:null
      };
      contractsV2.push(obj);
    }
    return contractsV2;
  }

  async exportMassiveSwitchEE(contracts, data_switch, export_id) {
    let contractsV2 = [];
    for (let i in contracts) {
      let obj = {
        COD_SERVIZIO: contracts[i].type.split("_")[1],
        COD_FLUSSO: '0050',
        PIVA_UTENTE: Env.get("PIVA_UTENTE"),
        PIVA_GESTORE: Env.get("PIVA_GESTORE"),
        CP_UTENTE: contracts[i].switch_cp_utente_sii
          ? contracts[i].switch_cp_utente_sii
          : `${ export_id.toString().padStart(6, "0")}_${contracts[i].id.toString().padStart(8, "0")}`,
        COD_POD: contracts[i].pdp,
        CF: contracts[i].codice_fiscale,
        PIVA: contracts[i].partita_iva,
        CF_STRANIERO: null,
        DATA_CONTRATTO: moment(contracts[i].data_stipula).format("DD/MM/YYYY"),
        DATA_DECORRENZA: moment(
          contracts[i].date_switch ? contracts[i].date_switch : data_switch
        ).format("DD/MM/YYYY"),
        REVOCA_TIMOE: 1,
        ACQUISTO_CREDITO: contracts[i].mercato_provenienza === "S" ? 1 : 0,
        COD_CONTR_DISP: null,
        PIVA_CONTROPARTE_COMMERCIALE: contracts[i].reseller.vat_number,
        CONTRATTO_CONNESSIONE: null,
        COD_OFFERTA: null
      };
      contractsV2.push(obj);
    }
    return contractsV2;
  }

  async getAll({ request, response, auth }) {
    try {
      const page = request.input("page", 1);
      const rowsPerPage = request.input("perPage", 9999);
      const sortBy = request.input("sortBy", "id");
      const order = request.input("order", "asc");
      const exported_dates = request.input("dates", null);
      const type = request.input("type");
      const query = ContractExport.query();
      const export_type = request.input('export_type')
      if(export_type) query.where('type',export_type)
      if (!auth.user.superadmin)
        query.where("reseller_uuid", auth.user.uuid).with("contracts");
      if (exported_dates) {
        query.where("created_at", ">=", exported_dates[0]);
        query.where("created_at", "<=", exported_dates[1]);
      }
      if (type) query.where("type", type);
      response.success(
        await query.orderBy(sortBy, order).paginate(page, rowsPerPage)
      );
    } catch (error) {
      console.log("err", error);
    }
  }

  async exportMassiveSwitch({ request, response, auth }) {
    try {
      const switch_day = Env.get("SWITCH_DAY");
      var date_switch = null
      if (moment().date() > switch_day)
        date_switch = moment()
          .add(2, "month")
          .add(2, "hours")
          .startOf("month");
      else
      date_switch = moment()
          .add(1, "month")
          .add(2, "hours")
          .startOf("month");
          console.log(date_switch)
      const commodity = request.input("commodity", null);
      const type = commodity == "g" ? "GAS_SWG1" : "EE_SE1";
      var contracts = await Contract.query()
        .where("commodity", commodity)
        .where("type", type)
        .whereNull("date_switch")
        .where("status", "INS")
        .with("remi")
        .with("reseller")
        .fetch();
      contracts = contracts.toJSON();
      if (contracts.length > 0) {
        const export_item = await ContractExport.create({
          exporting: true,
          totale: contracts.length,
          reseller_uuid: auth.user.uuid,
          commodity: commodity,
          type: "S"
        });
        for (let i in contracts) {
          await Contract.query()
            .where("id", contracts[i].id)
            .update({
              switch_cp_utente_sii: `${export_item.id.toString().padStart(6, "0")}_${contracts[i].id.toString().padStart(8, "0")}`,
              status: "LAV",
              date_switch: date_switch.format('YYYY-MM-DD'),
              switch_export_id: export_item.id
            });
        }
        await export_item.merge({ exporting: false });
        await export_item.save();
        var contractsV2 = [];
        if (commodity === "g")
          contractsV2 = await this.exportMassiveSwitchGas(
            contracts,
            date_switch,
            export_item.id
          );
        else
          contractsV2 = await this.exportMassiveSwitchEE(
            contracts,
            date_switch,
            export_item.id
          );
          const json2csvParser = new Json2csvParser({
            header: true,
            delimiter: ";",
            escapedQuote: '',
            quote: ''
          });
        return await json2csvParser.parse(contractsV2);
      } else {
        return response.status(404).send("Nessun elemento trovato");
      }
    } catch (error) {
      console.log("err", error);
    }
  }

  async exportMassiveAnnullamenti({ request, response, auth }) {
    try {
      const commodity = request.input("commodity", null);
      const type = commodity == "g" ? "GAS_SWG1" : "EE_SE1";
      var contracts = await Contract.query()
        .where("commodity", commodity)
        .where("type", type)
        .where("status", "RA")
        .whereNotNull('date_switch')
        .with("remi")
        .with("reseller")
        .with("switch_contract_flows")
        .fetch();
      contracts = contracts.toJSON();
      if (contracts.length > 0) {
        const export_item = await ContractExport.create({
          exporting: true,
          totale: contracts.length,
          reseller_uuid: auth.user.uuid,
          commodity: commodity,
          type: "A"
        });
        for (let i in contracts) {
          await Contract.query()
            .where("id", contracts[i].id)
            .update({
              ann_cp_utente_sii: `${export_item.id.toString().padStart(6, "0")}_${contracts[i].id.toString().padStart(8, "0")}`,
              status: "AE",
              ann_export_id: export_item.id
            });
        }
        await export_item.merge({ exporting: false });
        await export_item.save();
        var contractsV2 = [];
        if (commodity === "g")
          contractsV2 = await this.exportMassiveAnnullamentiGas(
            contracts,
            export_item.id
          );
        else
          contractsV2 = await this.exportMassiveAnnullamentiEE(
            contracts,
            export_item.id
          );
          const json2csvParser = new Json2csvParser({
            header: true,
            delimiter: ";",
            escapedQuote: '',
            quote: ''
          });
        return await json2csvParser.parse(contractsV2);
      } else {
        return response.status(404).send("Nessun elemento trovato");
      }
    } catch (error) {
      console.log("err", error);
    }
  }

  async downloadFile({ request, response, auth }) {
    try {
      const id = request.input("id");
      const type = request.input("type");
      if (id && type) {
        var contract_export = Contract.query()
          .where(type === 'A' ? "ann_export_id" : 'switch_export_id', id)
          .with("remi")
          .with("reseller")
          .with("switch_contract_flows")
        if (!auth.user.superadmin)
          contract_export.where("reseller_uuid", auth.user.uuid);
        contract_export = await contract_export.fetch();
        contract_export = contract_export.toJSON();
        console.log(type === 'A' ? "ann_export_id" : 'switch_export_id')
        console.log(type)
        if (contract_export.length > 0) {
          var contractsV2 = [];
          if(type === 'S') {
            if (contract_export[0].commodity === "g")
            contractsV2 = await this.exportMassiveSwitchGas(contract_export);
            else contractsV2 = await this.exportMassiveSwitchEE(contract_export);
          }
          else if(type === 'A') {
            if (contract_export[0].commodity === "g")
            contractsV2 = await this.exportMassiveAnnullamentiGas(contract_export);
            else contractsV2 = await this.exportMassiveAnnullamentiEE(contract_export);
          }
          const json2csvParser = new Json2csvParser({
            header: true,
            delimiter: ";",
            escapedQuote: '',
            quote: ''
          });
          return await json2csvParser.parse(contractsV2);
        } else {
          return response
            .status(500)
            .send("Non sei abilitato a scaricare questo file");
        }
      } else {
        return response
          .status(422)
          .send("Richiesta non elaborata, parametri mancanti");
      }
    } catch (error) {
      console.log("err", error);
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }
}

module.exports = ContractExportController;
