"use strict";

const Database = use("Database");

const Bonusgas = use("App/Models/Bonusgas");
const Reseller = use("App/Models/Reseller");

const Json2csvParser = require("json2csv").Parser;

const moment = require('moment')

class BonusgasController {

  async getDettagli({ request, response, auth }) {
    try {
      const page = Number(request.input("page", 1))
      const rowsPerPage = Number(request.input("perPage", 9999))
      const sortBy = request.input("sortBy", "id");
      const order = request.input("order", "asc");

      let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

      var subResellers = []
      if(auth.user.master_reseller && whiteLabel == 'true' )
      subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')



      let query = Database.select('bonusgas.id','bonusgas.filename','bonusgas.created_at','bonusgas.ultimo_download').from('bonusgas')
      .innerJoin('bonusgas_dettaglio','bonusgas.filename', 'bonusgas_dettaglio.filename')
      .innerJoin('resellers_customers','bonusgas_dettaglio.COD_PDR', 'resellers_customers.pdp')
      .whereIn('resellers_customers.reseller_vat_number', subResellers)
      .groupBy('bonusgas.id','bonusgas.filename','bonusgas.created_at','bonusgas.ultimo_download')
     

      let total = await query.getCount()

      let data = await query
      .orderBy(sortBy,order)
      .offset((page-1) * rowsPerPage)
      .limit(rowsPerPage)
    

      let res = {
        data, total, perPage: rowsPerPage, page
      }


      return response.success(res);

    } catch (error) {

      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }
  async getAnnullamenti({ request, response, auth }) {
    try {
      const page = Number(request.input("page", 1))
      const rowsPerPage = Number(request.input("perPage", 9999))
      const sortBy = request.input("sortBy", "id");
      const order = request.input("order", "asc");

      let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

      var subResellers = []
      if(auth.user.master_reseller && whiteLabel == 'true' )
      subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')


      let query = Database.select('bonusgas.id','bonusgas.filename','bonusgas.created_at','bonusgas.ultimo_download').from('bonusgas')
      .innerJoin('bonusgas_annullamenti','bonusgas_annullamenti.filename', 'bonusgas.filename')
      .innerJoin('bonusgas_dettaglio','bonusgas_annullamenti.COD_BONUS', 'bonusgas_dettaglio.COD_BONUS')
      .innerJoin('resellers_customers','bonusgas_dettaglio.COD_PDR', 'resellers_customers.pdp')
      .whereIn('resellers_customers.reseller_vat_number', subResellers)
      .groupBy('bonusgas.id','bonusgas.filename','bonusgas.created_at','bonusgas.ultimo_download')
     

      let total = await query.getCount()

      let data = await query
      .orderBy(sortBy,order)
      .offset((page-1) * rowsPerPage)
      .limit(rowsPerPage)
    

      let res = {
        data, total, perPage: rowsPerPage, page
      }


      return response.success(res);

    } catch (error) {

      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }
  async getEsiti({ request, response, auth }) {
    try {
      const page = Number(request.input("page", 1))
      const rowsPerPage = Number(request.input("perPage", 9999))
      const sortBy = request.input("sortBy", "id");
      const order = request.input("order", "asc");

      let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

      var subResellers = []
      if(auth.user.master_reseller && whiteLabel == 'true' )
      subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')


      let query = Database.select('bonusgas.id','bonusgas.filename','bonusgas.created_at','bonusgas.ultimo_download').from('bonusgas')
      .innerJoin('bonusgas_esiti','bonusgas_esiti.filename', 'bonusgas.filename')
      .innerJoin('bonusgas_dettaglio','bonusgas_esiti.COD_BONUS', 'bonusgas_dettaglio.COD_BONUS')
      .innerJoin('resellers_customers','bonusgas_dettaglio.COD_PDR', 'resellers_customers.pdp')
      .whereIn('resellers_customers.reseller_vat_number', subResellers)
      .groupBy('bonusgas.id','bonusgas.filename','bonusgas.created_at','bonusgas.ultimo_download')


      let total = await query.getCount()

      let data = await query
      .orderBy(sortBy,order)
      .offset((page-1) * rowsPerPage)
      .limit(rowsPerPage)
    

      let res = {
        data, total, perPage: rowsPerPage, page
      }


      return response.success(res);

    } catch (error) {

      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }
  async downloadCsv({ request, response, auth, params }) {
    try {
      const tipo_flusso = request.input("tipo_flusso")

      let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

      var subResellers = []
      if(auth.user.master_reseller && whiteLabel == 'true' )
      subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')


      let query = Database.from('bonusgas')

      if(tipo_flusso =='annullamenti') {
        query.select('bonusgas_annullamenti.COD_BONUS', 'bonusgas_annullamenti.COD_PDR','bonusgas_annullamenti.COD_CAUSALE','bonusgas_annullamenti.MOTIVAZIONE')
        .innerJoin('bonusgas_annullamenti','bonusgas_annullamenti.filename', 'bonusgas.filename')
        .innerJoin('bonusgas_dettaglio','bonusgas_annullamenti.COD_BONUS', 'bonusgas_dettaglio.COD_BONUS')

      } else if (tipo_flusso =='esiti') {
        query.select('bonusgas_esiti.COD_BONUS', 'bonusgas_esiti.ESITO')
        .innerJoin('bonusgas_esiti','bonusgas_esiti.filename', 'bonusgas.filename')
        .innerJoin('bonusgas_dettaglio','bonusgas_esiti.COD_BONUS', 'bonusgas_dettaglio.COD_BONUS')
      }
      else if (tipo_flusso =='dettagli') {
        query.select('bonusgas_dettaglio.COD_BONUS','bonusgas_dettaglio.TIPO_COMUNICAZIONE','bonusgas_dettaglio.COD_CAUSALE','bonusgas_dettaglio.COD_PDR','bonusgas_dettaglio.CF','bonusgas_dettaglio.REGIME_COMPENSAZIONE','bonusgas_dettaglio.ANNO_VALIDITA', 'bonusgas_dettaglio.DATA_INIZIO','bonusgas_dettaglio.DATA_FINE','bonusgas_dettaglio.DATA_CESSAZIONE')
        .innerJoin('bonusgas_dettaglio','bonusgas.filename', 'bonusgas_dettaglio.filename')
      }      


        try {
          let data = await query.innerJoin('resellers_customers','bonusgas_dettaglio.COD_PDR', 'resellers_customers.pdp')
          .whereIn('resellers_customers.reseller_vat_number', subResellers).where('bonusgas.id',params.id)
          
          const json2csvParser = new Json2csvParser({
            header: true,
            delimiter: ";",
            escapedQuote: '',
            quote: ''
          });

          const bg = await Bonusgas.find(params.id)
          bg.ultimo_download = moment()
          await bg.save()
    
          return await json2csvParser.parse(data);

        } catch (err) {
          console.log(err)
        }
      



    } catch (error) {

      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }







}

module.exports = BonusgasController;
