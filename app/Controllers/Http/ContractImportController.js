"use strict";

const ContractImport = use("App/Models/ContractImport");
const Contract = use("App/Models/Contract");
const ContractFlow = use("App/Models/ContractFlow");
const fs = require("fs");
const mkdirp = require("mkdirp");
const Env = use("Env");
const csv = require("csvtojson/v2");
const Json2csvParser = require("json2csv").Parser;

class ContractImportController {
  async getAll({ request, response, auth }) {
    try {
      const page = request.input("page", 1);
      const rowsPerPage = request.input("perPage", 9999);
      const sortBy = request.input("sortBy", "id");
      const order = request.input("order", "asc");
      const import_dates = request.input("dates", null);
      const query = ContractImport.query();
      if (!auth.user.superadmin)
        query.where("reseller_uuid", auth.user.uuid).with("contracts");
      if (import_dates) {
        query.where("created_at", ">=", import_dates[0]);
        query.where("created_at", "<=", import_dates[1]);
      }
      response.success(
        await query.orderBy(sortBy, order).paginate(page, rowsPerPage)
      );
    } catch (error) {
      console.log("err", error);
    }
  }

  async uploadEsiti({ request, response, auth }) {
    try {
      await mkdirp.sync(Env.get("pathImport"));
      await mkdirp.sync(Env.get("pathImportImportati"));
      await mkdirp.sync(Env.get("pathImportScartati"));
      const csvFile = request.file("file");
      const csv_name = Date.now() + ".csv";
      await csvFile.move(Env.get("pathImport"), {
        name: csv_name,
        overwrite: true
      });
      var dataFileJson = await csv({ delimiter: ";" }).fromFile(
        Env.get("pathImport") + csv_name
      );
      const importateJSON = [];
      const scartateJSON = [];
      let cod_servizio = dataFileJson[0]["COD_SERVIZIO"];
      let cod_flusso = dataFileJson[0]["COD_FLUSSO"];
      const contract_import = await ContractImport.create({
        cod_servizio: cod_servizio,
        cod_flusso: cod_flusso,
        totale: dataFileJson.length,
        reseller_uuid: auth.user.uuid
      });
      for (let i in dataFileJson) {
        try {
          delete dataFileJson[i].errore;
          var cp_utente_sii = (cod_servizio === "APN" || cod_servizio === 'APR') ? dataFileJson[i]["CP_GESTORE_ANN"] : dataFileJson[i]["CP_UTENTE"];
          var contract =  Contract.query()
            if(cod_servizio === 'APN' || cod_servizio === 'APR'){
              contract.whereHas('switch_contract_flows',(builder)=>{
                builder.whereRaw("extra->>'CP_GESTORE' = ?",cp_utente_sii)
              })
            }
            if(cod_servizio != 'APN' && cod_servizio != 'APR') {
              contract.where('switch_cp_utente_sii', cp_utente_sii)
            }
            if(cod_servizio === "APR") {
              contract.where("status", dataFileJson[i]["COD_FLUSSO"] == 150 || dataFileJson[i]["COD_FLUSSO"] == '0150' ? "AI" : "AE")
            }
            else if(cod_servizio === "SWG1") {
              contract.where("status", dataFileJson[i]["COD_FLUSSO"] == 200 || dataFileJson[i]["COD_FLUSSO"] == '0200' ? "POS" : "LAV")
            }
            else if(cod_servizio === "APN") {
              contract.whereIn("status", ["POS","TIM","LAV"])
            }
            contract = await contract.first();
          if (contract) {
            if (dataFileJson[i]["COD_FLUSSO"] == 100 || dataFileJson[i]["COD_FLUSSO"] == '0100') {
              if(cod_servizio === "APR") await contract.merge({ status: dataFileJson[i]["VERIFICA_AMM"] == 1 ? "AI" : "AF"});
              else if(cod_servizio === "SWG1") await contract.merge({ status: dataFileJson[i]["VERIFICA_AMM"] == 1 ? "POS" : "NEG" });
              await contract.save();
            }

            if(cod_servizio === "SWG1" && (dataFileJson[i]["COD_FLUSSO"] == 200 || dataFileJson[i]["COD_FLUSSO"] == '0200')) {
              await contract.merge({ status: "TIM" });
              await contract.save();
            }

            if(cod_servizio === "APR" && (dataFileJson[i]["COD_FLUSSO"] == 150 || dataFileJson[i]["COD_FLUSSO"] == '0150')) {
              await contract.merge({ status: dataFileJson[i]["ESITO"] == 1 ? 'AP' : 'AN' });
              await contract.save();
            }

            if(cod_servizio === "APN" && (dataFileJson[i]["COD_FLUSSO"] == 200 || dataFileJson[i]["COD_FLUSSO"] == '0200')) {
              await contract.merge({ status: "ANS",ann_cod_causale: dataFileJson[i]["COD_CAUSALE"], ann_motivazione:dataFileJson[i]["MOTIVAZIONE"]});
              await contract.save();
            }

            await ContractFlow.create({
              CP_UTENTE: (cod_servizio === "APN" || cod_servizio === "APR") ? contract.switch_cp_utente_sii : dataFileJson[i]["CP_UTENTE"],
              COD_SERVIZIO: dataFileJson[i]["COD_SERVIZIO"],
              COD_FLUSSO: dataFileJson[i]["COD_FLUSSO"],
              extra: dataFileJson[i]
            });
            importateJSON.push(dataFileJson[i]);
          } else {
            scartateJSON.push({ ...dataFileJson[i], errore: "Contratto non trovato oppure in uno stato differente da quello predefinito" });
          }
        } catch (error) {
          console.log("err", error);
          scartateJSON.push({ ...dataFileJson[i], errore: error.message });
        }
      }

      if (importateJSON.length > 0) {
        const jsonCsvImportate= new Json2csvParser({
          header: true,
          delimiter: ";",
          escapedQuote: '',
          quote: ''
        });
        const importate_csv = jsonCsvImportate.parse(importateJSON);
        await fs.writeFileSync(
          Env.get("pathImportImportati") +
            `${Env.get("OWNER_NAME")}_importate` +
            contract_import.id +
            ".csv",
          importate_csv,
          "binary"
        );
      }
      if (scartateJSON.length > 0) {
        const jsonCsvScartate= new Json2csvParser({
          header: true,
          delimiter: ";",
          escapedQuote: '',
          quote: ''
        });
        const scartate_csv = jsonCsvScartate.parse(scartateJSON);
        await fs.writeFileSync(
          Env.get("pathImportScartati") +
            `${Env.get("OWNER_NAME")}_scartate` +
            contract_import.id +
            ".csv",
          scartate_csv,
          "binary"
        );
      }

      await contract_import.merge({
        uploading: false,
        totale_positivi: importateJSON.length,
        totale_negativi: scartateJSON.length,
        path_esito_positivo:
          importateJSON.length > 0
            ? Env.get("pathImportImportati") +
              `${Env.get("OWNER_NAME")}_importate` +
              contract_import.id +
              ".csv"
            : null,
        path_esito_negativo:
          scartateJSON.length > 0
            ? Env.get("pathImportScartati") +
              `${Env.get("OWNER_NAME")}_scartate` +
              contract_import.id +
              ".csv"
            : null
      });
      await contract_import.save();
      fs.unlinkSync(Env.get("pathImport") + csv_name);
      return;
    } catch (error) {
      console.log("err", error);
      return response.status(500).send(error);
    }
  }

  async downloadEsitoFile({ request, response, auth }) {
    try {
      const id = request.input("id");
      const path = request.input("path", null);
      if (id && path) {
        var contract_import = ContractImport.query().where("id", id);
        if (!auth.user.superadmin)
          contract_import.where("reseller_uuid", auth.user.uuid);
        contract_import = await contract_import.first();
        if (contract_import) {
          var datafile = await fs.readFileSync(
            path === "importati"
              ? contract_import.path_esito_positivo
              : contract_import.path_esito_negativo
          );
          return Buffer.from(datafile, "binary");
        } else {
          return response
            .status(401)
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

module.exports = ContractImportController;
