'use strict'

const Contract = use("App/Models/Contract");
const Exports = use("App/Models/Exports");
const Helpers = use('Helpers')
const fs = require('fs');
const axios = require("axios");
const Json2csvParser = require("json2csv").Parser;
const Database = use("Database");
const FlowCombination = use('App/Models/FlowCombination')

const moment = require('moment')



class ExportsController {

    async getAll({ request, response, auth }) {
        try {
            const page = request.input("page", 1);
            const rowsPerPage = request.input("perPage", 9999);
            const sortBy = request.input("sortBy", "id");
            const order = request.input("order", "asc");
            const type = request.input("type",null);
            const query = Exports.query().with('reseller').withCount("details");
            if (!auth.user.superadmin) query.where("reseller_uuid", auth.user.uuid)
            if (type) query.where("type", type);
            response.success(await query.orderBy(sortBy, order).paginate(page, rowsPerPage));
        } catch (error) {
            console.log(error)
            return response.status(500).send({ message: "System Error", error: error.response.message });
        }
    }

    async exportAnagrafiche({ request, response, auth }){
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'        
        const trx = await Database.beginTransaction();
        try {
            let query = Contract.query().with('reseller').whereIn('status',['OK','POS','TIM'])
            .whereDoesntHave('export_details',(inner)=>{ 
                inner.whereHas('export',(inside)=>{ 
                    inside.where('reseller_uuid',auth.user.uuid).where('type','ANAG')
                })
            })
            if(auth.user.superadmin) query.where("reseller_uuid", auth.user.uuid)
            if(whiteLabel == 'true' && auth.user.master_reseller) {
                query.where(inner =>{
                  inner.where("reseller_uuid", auth.user.uuid)
                  inner.orWhereHas('reseller', inside=> {
                    inside.where('master_reseller_uuid',auth.user.uuid)
                    inside.where( function() {
                        this.whereNull('master_reseller_date').orWhereRaw('contracts.date_switch >= resellers.master_reseller_date')
                    })
                  })
                })
              }
            let ids = await query.pluck('id')
            if(ids.length > 0) {
                const export_item = await Exports.create({ reseller_uuid: auth.user.uuid, type: "ANAG" });
                await export_item.contracts().attach(ids,trx)
            }
            else throw { message: "Nessun file da esportare" };
            await trx.commit()
        } catch (error) {
            await trx.rollback()
            return response.status(500).send({ message: "System Error", error: error });
        }

    }

    async countDaEsportare({ request, response, auth }){
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'        
        try {
            let query = Contract.query().with('reseller').whereIn('status',['OK','POS','TIM'])
            .whereDoesntHave('export_details',(inner)=>{ 
                inner.whereHas('export',(inside)=>{ 
                    inside.where('reseller_uuid',auth.user.uuid).where('type','ANAG')
                })
            })
            if(auth.user.superadmin) query.where("reseller_uuid", auth.user.uuid)
            if(whiteLabel == 'true' && auth.user.master_reseller) {
                query.where(inner =>{
                  inner.where("reseller_uuid", auth.user.uuid)
                  inner.orWhereHas('reseller', inside=> {
                    inside.where('master_reseller_uuid',auth.user.uuid)
                    .where( function()  {
                        this.whereNull('master_reseller_date').orWhereRaw('contracts.date_switch >= resellers.master_reseller_date')
                    })
                  })
                })
              }
            let ids = await query.pluck('id')
            return response.success(ids.length)
        } catch (error) {
            return response.status(500).send({ message: "System Error", error: error });
        }
    }

    async downloadTracciato({ request,params, response, auth }){
        const type = request.input('type',null)
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'        
        let ownerWhiteLabel = request.header('owner-white-label')
        try {
            let contratti = await Contract.query().with('istat_clima').with('reseller').whereHas('export_details',(inner)=>{
                inner.whereHas('export',(inside)=>{ 
                    inside.where('reseller_uuid',auth.user.uuid).where('type',type).where('id',params.id)
                })
            }).fetch()
            contratti = contratti.toJSON()
            var datafile = null 
            if(whiteLabel == 'true' && ownerWhiteLabel == 'oenergy') datafile = await fs.readFileSync(Helpers.resourcesPath('static/export-oenergy.json'),'utf8')
            else if(whiteLabel == 'false') datafile = await fs.readFileSync(Helpers.resourcesPath('static/export.json'),'utf8')
            let array = []
            for(let i in contratti) {
                if(ownerWhiteLabel == 'oenergy') {
                    let contratto = contratti[i]

                    if(!contratto.date_switch_it) {

                        const fc = await FlowCombination.query().where('pdp', contratto.pdp).whereHas('flow', builder => {
                            builder.whereIn('flow_code',['A01','TMV','A40','R40'])
                        }).where('ref_date','>=',moment(contratto.created_at).format('YYYY-MM-DD')).first()


                        if(fc && fc.id) {
                            contratto.date_switch_it = moment(fc.ref_date, 'YYYY-MM-DD').format('DD/MM/YYYY')
                        }
                    }
                    if(!contratto.istat_clima) console.log("ISTAT NON CORRETTO ID CONTRATTO, ISTAT:", contratto.id, contratto.sede_istat)
                    let codice_prelievo = contratto.istat_clima && contratto.istat_clima.fascia_climatica ? contratto.categoria_uso + contratto.istat_clima.fascia_climatica + contratto.classe_prelievo : 'ISTAT NON CORRETTO'
                    // await axios.get(`https://api-comuni.ikonika.it/v1/comuni?istat=${contratto.sede_istat}`).then((data)=>{
                    //     if(data && data.data && data.data[0]) { fasciaclima = data.data[0].fascia_climatica ? data.data[0].fascia_climatica.fascia_climatica : null }
                    // }).catch((err)=>{
                    //     console.log(err)
                    // })
                    let temp = JSON.parse(datafile)
                    temp['RESELLER'] = contratto.reseller.company_name,
                    temp['SHIPPER'] = 'Oenergy S.p.A.',
                    temp['UTENTE_DELLA_DISTRIBUZIONE'] = 'NEG SpA'
                    temp['DISTRIBUTORE_LOCALE'] = contratto.distributore
                    temp['DENOMINAZIONE_CLIENTE'] = contratto.ragione_sociale ? contratto.ragione_sociale : contratto.cognome + ' ' + contratto.nome
                    temp['COGNOME'] = contratto.codice_fiscale && contratto.codice_fiscale.length === 16 ? contratto.cognome : ''
                    temp['NOME'] = contratto.codice_fiscale && contratto.codice_fiscale.length === 16 ? contratto.nome : ''
                    temp['SESSO'] = contratto.codice_fiscale && contratto.codice_fiscale.length === 16 ? Number(contratto.codice_fiscale.substring(9,11)) > 31 ? 'F' : 'M' : ''
                    temp['CODICE_FISCALE'] = contratto.codice_fiscale
                    temp['PARTITA_IVA'] = contratto.partita_iva ? contratto.partita_iva : (contratto.codice_fiscale && contratto.codice_fiscale.length == 11) ? contratto.codice_fiscale : ''
                    temp['FLAG_ENTE_SENZA_PARTITA_IVA'] = contratto.partita_iva && (contratto.partita_iva.startsWith('8') || contratto.partita_iva.startsWith('9')) ? '1' : '0'
                    temp['TOPONIMO'] = contratto.sede_toponimo
                    temp['INDIRIZZO_FORNITURA'] = contratto.sede_indirizzo
                    temp['NR_CIVICO'] = contratto.sede_civico
                    temp['CAP_FORNITURA'] = contratto.sede_cap
                    temp['COMUNE_FORNITURA'] = contratto.sede_comune
                    temp['SIGLA_PROV_FORNITURA'] = contratto.sede_provincia
                    temp['TOPONIMO_SL'] = contratto.reseller.toponimo
                    temp['INDIRIZZO_SL'] = contratto.reseller.indirizzo
                    temp['NR_CIVICO_SL'] = contratto.reseller.civico
                    temp['CAP_SL'] = contratto.reseller.cap
                    temp['COMUNE_SL'] = contratto.reseller.comune
                    temp['SIGLA_PROVINCIA_SL'] = contratto.reseller.provincia
                    switch(contratto.tipoutenza_code) {
                        case 'RESELLER CONDOMINIO' : 
                            temp['TIPOLOGIA_USO'] = 'CONDOMINIO CON USO DOMESTICO'
                            temp['SOTTOTIPOLOGIA_USO'] = 'G-CUD'
                        break;
                        case 'RESELLER DOMESTICO' : 
                            temp['TIPOLOGIA_USO'] = 'DOMESTICO'
                            temp['SOTTOTIPOLOGIA_USO'] = 'G-DOM'
                        break;
                        case 'RESELLER USI DIVERSI' : 
                            temp['TIPOLOGIA_USO'] = 'USI DIVERSI'
                            temp['SOTTOTIPOLOGIA_USO'] = 'G-FAR'
                        break;
                    }
                    temp['DATA_STIPULA'] = contratto.data_stipula_it
                    temp['DATA_INIZIO_VALIDITA'] = contratto.date_switch_it
                    temp['DATA_FINE_VALIDITA'] = '31/12/9999'
                    temp['REMI'] = contratto.remi_code
                    temp['PDR'] = contratto.pdp.padStart(14, '0')
                    temp['TIPO_CONSUMO_ANNUO'] = 'SWITCH'
                    temp['CONSUMO_ANNUO'] = contratto.consumo_annuo_presunto
                    temp['CODICE_PROFILO_PRELIEVO'] = codice_prelievo
                    temp['TIPO_CONTATORE'] = 'TRADIZIONALE GAS'
                    temp['CATEGORIA_IVA'] = 'Non soggetto IVA Art. 17.6 DPR 633/72 inv. contab.',
                    temp['FLAG_DIRETTO_REMI'] = '0'
                    temp['TIPO_CONTRATTO'] = 'VGRCO',
                    temp['DATA_FINE_CONTRATTO'] = '31/12/9999'
                    temp['TIPO_PAGAMENTO'] = '0FM'
                    temp['GIORNI'] = '0'
                    temp['METODO_PAGAMENTO'] = 'BONIFICO BANCARIO'
                    temp['BANCA_APPOGGIO'] = 'MONTE DEI PASCHI DI SIENA'
                    temp['IBAN'] = 'IT97V0103003217000001660275'
                    temp['CADENZA_FATTURAZIONE'] = 'Mensile'
                    temp['MERCATO_PROVENIENZA'] = 'L'
                    temp['MODALITA_SPEDIZIONE_FATTURA'] = 'EMAIL'
                    temp['VOLUME_ANNUO_CONTRATTO'] = contratto.consumo_annuo_presunto
                    
                    temp['TOPONIMO_SS'] = contratto.reseller.toponimo
                    temp['INDIRIZZO_SS'] = contratto.reseller.indirizzo
                    temp['NR_CIVICO_SS'] = contratto.reseller.civico
                    temp['CAP_SS'] = contratto.reseller.cap
                    temp['COMUNE_SS'] = contratto.reseller.comune
                    temp['SIGLA_PROVINCIA_SS'] = contratto.reseller.provincia
    
                    temp['LIVELLO_DETTAGLIO_REPORT'] = 'ANALITICA'
    
                    temp['CODICE_DESTINATARIO'] = contratto.reseller.codice_sdi
                    temp['PEC_FATT_ELETTRONICA'] = contratto.reseller.pec
    
                    array.push(temp)
                }
            }
            const jsonCsv= new Json2csvParser({
                header: true,
                delimiter: ";",
                escapedQuote: '',
                quote: ''
              });
            return await jsonCsv.parse(array);
            // await fs.writeFileSync("test.csv",array_csv,"binary");
        } catch (error) {
            console.log("error",error)
        }

    }
}

module.exports = ExportsController
