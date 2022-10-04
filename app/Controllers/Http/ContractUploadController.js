"use strict";

const Contract = use("App/Models/Contract");
const ContractUpload = use("App/Models/ContractUpload");
const Env = use("Env");
const { validateAll } = use("Validator");
const fs = require("fs");
const csv = require("csvtojson/v2");
const mkdirp = require("mkdirp");
var allowedDateFormats = [
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM-DD-YYYY",
  "DD/MM/YYYY",
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY/MM/DD"
];
const Json2csvParser = require("json2csv").Parser;
const rule = require("indicative/builds/rule");

const moment = require("moment");
const {
  contract_structure
} = require("../../../utility/database_contract_structure.json");

class ContractUploadController {
  async getAll({ request, response, auth }) {
    let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
    try {
      const page = request.input("page", 1);
      const rowsPerPage = request.input("perPage", 9999);
      const sortBy = request.input("sortBy", "id");
      const order = request.input("order", "desc");
      const upload_dates = request.input("dates", null);
      const query = ContractUpload.query().with('contracts').with('reseller')
      if (!auth.user.superadmin && ((whiteLabel == 'true' && !auth.user.master_reseller) || (whiteLabel =='false'))) {
        query.where("reseller_uuid", auth.user.uuid)
      }
      if(whiteLabel == 'true' && auth.user.master_reseller) {
        query.where(inner =>{
          inner.where("reseller_uuid", auth.user.uuid)
          inner.orWhereHas('reseller', inside=> {
            inside.where('master_reseller_uuid',auth.user.uuid)
          })
        })
      }
      if (upload_dates) {
        query.where("created_at", ">=", upload_dates[0]);
        query.where("created_at", "<=", upload_dates[1]);
        query.where("totale_positivi",">",0)
      }
      response.success(
        await query.orderBy(sortBy, order).paginate(page, rowsPerPage)
      );
    } catch (error) {
      console.log("err", error);
    }
  }

  async downloadEsitoFile({ request, response, auth }) {
    let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
    try {
      const id = request.input("id");
      const path = request.input("path", null);
      if (id && path) {
        var contract_uploaded = ContractUpload.query().where("id", id);
        if (!auth.user.superadmin && ((whiteLabel == 'true' && !auth.user.master_reseller) || (whiteLabel =='false'))) {
          contract_uploaded.where("reseller_uuid", auth.user.uuid);
        }
        if(whiteLabel == 'true' && auth.user.master_reseller) {
          contract_uploaded.where(inner =>{
            inner.where("reseller_uuid", auth.user.uuid)
            inner.orWhereHas('reseller', inside=> {
              inside.where('master_reseller_uuid',auth.user.uuid)
            })
          })
        }
        contract_uploaded = await contract_uploaded.first();
        if (contract_uploaded) {
          var datafile = await fs.readFileSync(
            path === "importati"
              ? contract_uploaded.path_esito_positivo
              : contract_uploaded.path_esito_negativo
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
      console.log(error)
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }

  async uploadMassive({ request, response, auth }) {
    try {
      await mkdirp.sync(Env.get("pathUpload"));
      await mkdirp.sync(Env.get("pathUploadImportati"));
      await mkdirp.sync(Env.get("pathUploadScartati"));
      const csvFile = request.file("file");
      const csv_name = Date.now() + ".csv";
      await csvFile.move(Env.get("pathUpload"), {
        name: csv_name,
        overwrite: true
      });
      var dataFileJson = await csv({ delimiter: ";" }).fromFile(
        Env.get("pathUpload") + csv_name
      );
      const importateJSON = [];
      const scartateJSON = [];
      const contract_uploaded = await ContractUpload.create({
        totale: dataFileJson.length,
        reseller_uuid: auth.user.uuid
      });
      for (let i in dataFileJson) {
        try {
          delete dataFileJson[i].errore;
          delete dataFileJson[i].date_switch;
          dataFileJson[i] = await this._convertTypeElement(dataFileJson[i]);
          const validation = await this._validateElement({
            ...dataFileJson[i],
            user: auth.user
          });
          if (validation) {
            const mappedValidation = validation.map(el => {
              return el.message;
            });
            scartateJSON.push({ ...dataFileJson[i], errore: mappedValidation });
          } else {
            await Contract.create({
              ...dataFileJson[i],
              classeutenza_code:'ESENTE',
              upload_id: contract_uploaded.id,
              reseller_uuid: auth.user.uuid
            });
            importateJSON.push(dataFileJson[i]);
          }
        } catch (error) {
          console.log("err",error)
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
          Env.get("pathUploadImportati") +
            `${Env.get("OWNER_NAME")}_importate` +
            contract_uploaded.id +
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
          Env.get("pathUploadScartati") +
            `${Env.get("OWNER_NAME")}_scartate` +
            contract_uploaded.id +
            ".csv",
          scartate_csv,
          "binary"
        );
      }

      await contract_uploaded.merge({
        uploading: false,
        totale: dataFileJson.length,
        totale_positivi: importateJSON.length,
        totale_negativi: scartateJSON.length,
        path_esito_positivo:
          importateJSON.length > 0
            ? Env.get("pathUploadImportati") +
              `${Env.get("OWNER_NAME")}_importate` +
              contract_uploaded.id +
              ".csv"
            : null,
        path_esito_negativo:
          scartateJSON.length > 0
            ? Env.get("pathUploadScartati") +
              `${Env.get("OWNER_NAME")}_scartate` +
              contract_uploaded.id +
              ".csv"
            : null
      });
      await contract_uploaded.save();
      fs.unlinkSync(Env.get("pathUpload") + csv_name);
      return;
    } catch (error) {
      console.log("err",error)
      return response.status(500).send(error);
    }
  }

  //FUNZIONI INTERNE
  _convertTypeElement(obj) {
    for (const [key, value] of Object.entries(contract_structure)) {
      switch (value) {
        case "string":
          if (obj[key] == "") obj[key] = null;
          else obj[key] = obj[key].toString();
          if (
            obj[key] != null &&
            (key === "partita_iva" ||
              key === "distributore" ||
              key === "precedente_fornitore")
          )
            obj[key] = obj[key].padStart(11, "0");
          break;
        case "integer":
          if (obj[key] == "") obj[key] = null;
          else obj[key] = Number(obj[key]);
          break;
        case "numeric(8,2)":
          if (obj[key] == "") obj[key] = null;
          else
            obj[key] = Number(
              obj[key]
                .toString()
                .replace(/\./g, "")
                .replace(",", ".")
            );
          break;
        case "date":
          if (obj[key] == "") obj[key] = null;
          else {
            var dataFormat = "";
            // allowedDateFormats.forEach(element => {
            //   if (moment(obj[key], element, true).isValid()) dataFormat = element;
            // });
            // console.log("bef",obj[key])
            // console.log("dataFormat",dataFormat)
            obj[key] = moment(moment(obj[key], 'DD/MM/YYYY')).format(
              "YYYY-MM-DD"
            );
            console.log("obj[key]: ",obj[key] )
            break;
          }
      }
    }
    return obj;
  }

  async _validateElement(data) {
    const messages = {
      distributoreRemi:'il Campo remi_code non è associata ad alcun distributore',
      remis:"il Campo remi_code non contiene una cabina remi abilitata in combinazione con il codice sede_istat",
      pdpUnique:
        "il Campo pdp è gia presente sul portare reseller con uno stato tra (INSERITO/IN LAVORAZIONE)",
      contract_types: "Il Campo type non è valido per la commodity selezionata",
      prices:
        "Il Campo codice_offerta non è valido (potrebbe non essere associato a te oppure scaduto ",
      pdp:
        "Il campo pdp non è valido, in quanto essendo una voltura il punto deve appartenere al reseller",
      date: "Il Campo {{ field }} non è una data valida",
      email: "Il Campo {{ field }} non è una email valida",
      regex: "Il Campo {{ field }} non rispetta la regex",
      required: "Il Campo {{ field }} è un campo obbligatorio",
      integer: "Il Campo {{ field }} puo contenere solo interi",
      min: "Il Campo {{ field }} accetta minimo {{argument.0}} caratteri",
      max: "Il Campo {{ field }} accetta massimo {{argument.0}} caratteri",
      number: "Il Campo {{ field }} accetta solo numeri",
      boolean: "Il Campo {{ field }} deve essere un booleano",
      url: "Il Campo {{ field }} deve essere un url che inizia con http://",
      in: "Il Campo {{ field }} contiene un valore non consentito",
      exists:
        "Il Campo {{ field }} non esiste all'interno della tabella di riferimento",
      array: "Il Campo {{ field }} non è  un array",
      unique: "Il Campo {{ field }} è gia presente nel database",
      required_when: "Il Campo {{ field }} è obbligatorio",
      required_if: "Il Campo {{ field }} è obbligatorio",
      starts_with: "Il Campo {{ field }} deve iniziare con {{arg ument.0}}"
    };
    const rules = {
      commodity: "required|in:g,e",
      data_stipula: "required|date",
      type: "required|contract_types", //MANCA FILTER PER COMMODITY
      type_voltura: "required_when:type,EE_VOL|in:S,M",
      codice_offerta: "required|prices", //MANCA CHECK DATA E RESELLER APPARTENENZA E ACTIVE
      tipo_persona: "required|in:G,F",
      codice_fiscale: [
        rule("required_when", "tipo_persona", "F"),
        // rule(
        //   "regex",
        //   new RegExp(
        //     /^(?:[A-Z][AEIOU][AEIOUX]|[B-DF-HJ-NP-TV-Z]{2}[A-Z]){2}(?:[\dLMNP-V]{2}(?:[A-EHLMPR-T](?:[04LQ][1-9MNP-V]|[15MR][\dLMNP-V]|[26NS][0-8LMNP-U])|[DHPS][37PT][0L]|[ACELMRT][37PT][01LM]|[AC-EHLMPR-T][26NS][9V])|(?:[02468LNQSU][048LQU]|[13579MPRTV][26NS])B[26NS][9V])(?:[A-MZ][1-9MNP-V][\dLMNP-V]{2}|[A-M][0L](?:[1-9MNP-V][\dLMNP-V]|[0L][1-9MNP-V]))[A-Z]$/
        //   )
        // )
      ],
      partita_iva: [
        rule("required_when", "tipo_persona", "g"),
        rule("regex", new RegExp(/^[0-9]{11}$/))
      ],
      ragione_sociale: "required_when:tipo_persona,G",
      telefono: "min:7",
      nome: "required_when:tipo_persona,F",
      cognome: "required_when:tipo_persona,F",
      email: "email",
      pec: "email",
      toponimo: "required",
      indirizzo: "required",
      civico: "required",
      comune: "required",
      provincia: "required|max:3",
      cap: "required|max:8",
      istat: "required",
      sede_toponimo: "required",
      sede_indirizzo: "required",
      sede_civico: "required",
      sede_comune: "required",
      sede_provincia: "required|max:3",
      sede_cap: "required|max:8",
      sede_istat: "required",
      pdp: "required|pdp|pdpUnique|max:14",
      misuratore:
        "required_when:type,EE_A01|required_when:type,GAS_A40|required_when:type,A01|required_when:type,A40",
      tipoutenza_code: "required",
      categoria_uso: "required_when:commodity,g",
      classe_prelievo: "required_when:commodity,g",
      remi_code: "required_when:commodity,g|exists:remi,code",
      mercato_provenienza: "required|in:T,L,G,S",
      distributore: "required|exists:stakeholders,partita_iva",
      // |distributoreRemi",
      precedente_fornitore: "exists:stakeholders,partita_iva|required_when:type,GAS_SWG1",
      tensione: "required_when:commodity,e",
      consumo_annuo_presunto: "required"
      // status: "exists:contract_status,code"
    };
    const validation = await validateAll(data, rules, messages);
    if (validation.fails()) {
      return validation.messages();
    }
  }
}

module.exports = ContractUploadController;
