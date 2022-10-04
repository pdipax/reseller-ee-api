'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
const Mail = use('Mail')
const Reseller = use('App/Models/Reseller')

Route.get('/', () => {
  return { greeting: 'Hello world in JSON' }
})


Route.group(function () {
  Route.get('customers', 'ResellerController.getCustomers')
  Route.get('customers/getCustomer/:id', 'ResellerController.getCustomer')
  Route.get('customers/getCustomerByPdp', 'CustomerController.getCustomerByPdp')

  Route.get('remi/download/:format', 'ResellerController.downloadRemi')
  Route.get('rcu/gas/download/:format', 'ResellerController.downloadRcuGas')
  Route.get('rcu/gas/getTotalCustomers', 'ResellerController.getTotalGasCustomers')
  Route.get('rcu/gas/getTotalRemis', 'ResellerController.getTotalGasRemis')
  Route.get('rcu/gas/getTotalConsumptions', 'ResellerController.getTotalGasConsumptions')

  Route.get('flows/getTypes', 'FlowTypeController.getAll')
  Route.get('flows/getNewTypes', 'FlowTypeController.getNewFlowTypes')
  Route.get('flows/types/:id', 'FlowTypeController.getFlowType')
  Route.patch('flows/types', 'FlowTypeController.updateFlowType').middleware(['superadmin'])
  Route.post('flows/types', 'FlowTypeController.createFlowType').middleware(['superadmin'])
  Route.get('flows/getFlows', 'ResellerController.getFlows')
  Route.get('flows/downloadFlows', 'FlowController.downloadFlows')
  Route.get('flows/getNotDownloadedFlows', 'ResellerController.getNotDownloadedFlowsCount')
  Route.get('flows/setAllDownloaded', 'ResellerController.setAllDownloaded')

  Route.get('resellers', 'ResellerController.getAll').middleware(['MasterReseller'])
  Route.get('resellers/:uuid', 'ResellerController.getReseller').middleware(['MasterReseller'])
  Route.patch('resellers', 'ResellerController.updateReseller').middleware(['MasterReseller'])
  Route.post('resellers', 'ResellerController.createReseller').middleware(['MasterReseller'])

  Route.post('prices/signature/notify-manuale', 'PriceController.NotifyManualeSignature')
  Route.get('prices', 'PriceController.getPrices')
  Route.post('prices', 'PriceController.storePrice')
  Route.patch('prices/:id', 'PriceController.updatePrice')
  Route.get('prices/:id', 'PriceController.getPriceById')
  Route.get('stakeholders', 'StakeholderController.getStakeholders')
  Route.get('stakeholders/:id_soggetto', 'StakeholderController.getStakeholderById')


  Route.get('remis', 'RemiController.getRemis')
  Route.post('remis', 'RemiController.storeRemi')
  Route.patch('remis/:id', 'RemiController.updateRemi')
  Route.patch('remis/:id/distributori', 'RemiController.updateRemiDistributori')
  Route.patch('remis/:id/shippers', 'RemiController.updateRemiUdb')
  Route.patch('remis/:id/istat_comuni', 'RemiController.updateRemiIstat')
  Route.get('remis/:id', 'RemiController.getRemiById')

  Route.get('categorie-utenze', 'CategoriaUtenzaTypeController.get')
  Route.get('tipi-utenze', 'TipoUtenzaTypeController.get')
  Route.get('classi-utenze', 'ClasseUtenzaTypeController.get')
  Route.get('tipo-contratti', 'ContractTypeController.get')

  Route.post('admin/upload/gas/rcu', 'RcuGasController.uploadZip').middleware(['superadmin'])
  Route.get('admin/upload/gas/rcu/check', 'RcuGasController.checkStatus').middleware(['superadmin'])
  Route.post('admin/upload/customers', 'CustomerController.uploadCsv').middleware(['superadmin'])
  Route.get('admin/upload/customers/check', 'CustomerController.checkStatus').middleware(['superadmin'])
  Route.post('admin/upload/flows', 'FlowController.uploadFlows').middleware(['superadmin'])
  Route.get('admin/upload/flows/check', 'FlowController.checkStatus').middleware(['superadmin'])

  Route.get('esportazioni/:id/download', 'ExportsController.downloadTracciato').middleware(['MasterReseller'])
  Route.post('esportazioni/anagrafiche', 'ExportsController.exportAnagrafiche').middleware(['MasterReseller'])
  Route.get('esportazioni/da-esportare', 'ExportsController.countDaEsportare').middleware(['MasterReseller'])
  Route.get('esportazioni', 'ExportsController.getAll').middleware(['MasterReseller'])

  Route.post('contract', 'ContractController.create')
  Route.get('contract','ContractController.getAll')
  Route.get('contract/download-esiti','ContractController.downloadEsiti')
  Route.get('contract/check-pdp','ContractController.checkPdpUnique')
  Route.post('contract/upload', 'ContractUploadController.uploadMassive')
  Route.post('contract/import', 'ContractImportController.uploadEsiti').middleware(['superadmin'])
  Route.post('contract/export-switch', 'ContractExportController.exportMassiveSwitch').middleware(['superadmin'])
  Route.post('contract/export-annullamenti', 'ContractExportController.exportMassiveAnnullamenti').middleware(['superadmin'])
  Route.get('contract/:id', 'ContractController.getById').middleware(['ContractPermission'])
  Route.post('contract/:id/annulla', 'ContractController.annullaContratto').middleware(['ContractPermission'])
  Route.post('contract/:id/richiesta-annullamento-sii', 'ContractController.annullaContrattoSII').middleware(['ContractPermission'])
  Route.post('contract/:id/add-note', 'ContractController.contractAddNote').middleware(['ContractPermission'])
  Route.patch('contract/:id/stato', 'ContractController.modificaStato').middleware(['superadmin'])
  

  Route.get('contract-tisg', 'ContractTisgController.getAll')
  // .middleware(['superadmin'])
  Route.post('contract-tisg', 'ContractTisgController.uploadZip').middleware(['superadmin'])
  Route.get('contract-tisg/download', 'ContractTisgController.downloadFile')
  

  
  Route.get('contract-uploads/', 'ContractUploadController.getAll')
  Route.get('contract-uploads/download-esito', 'ContractUploadController.downloadEsitoFile')

  Route.get('contract-import/', 'ContractImportController.getAll')
  Route.get('contract-import/download-esito', 'ContractImportController.downloadEsitoFile')


  Route.get('contract-exports/', 'ContractExportController.getAll')
  Route.get('contract-exports/download', 'ContractExportController.downloadFile')

  Route.get('contract-status', 'ContractStatusController.get')

  Route.get('utilities/contract_types','UtilityController.getContractTypes')
  Route.get('utilities/tipiutenza_types','UtilityController.getTipiutenzaTypes')
  Route.get('utilities/classiutenza_types','UtilityController.getClassiUtenzaTypes')
  Route.get('utilities/categorieutenza_types','UtilityController.getCategoriaUtenzaTypes')
  Route.get('utilities/stakeholders','UtilityController.getStakeholders')
  Route.get('utilities/contracts-template','UtilityController.getContractsTemplate')
  

  Route.post('richiesta-informazioni', async function( {request, auth} ) {
    let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
    let ownerWhiteLabel = request.header('owner-white-label')
    let mail = 'reseller@negitaly.it'
    if(whiteLabel == 'true') {
      if(ownerWhiteLabel == 'oenergy') mail = 'reseller@oenergy.it'
    }

    const user = auth.user
    const data = request.all()

    await Mail.raw(data.subject + ' --- Proveniente da: '+ user.username+ ' Azienda: ' +user.company_name, (message) => {
      message.subject(data.subject)
      message.from(user.email,'<'+user.company_name+'>')
      message.to(mail)
      message.cc('dev@ikonika.it')
    })

  })

  Route.post('richiesta-informazioni-otp', async function( {request, auth} ) {
    let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
    let ownerWhiteLabel = request.header('owner-white-label')
    let mail = 'reseller@negitaly.it'
    if(whiteLabel == 'true') {
      if(ownerWhiteLabel == 'oenergy') mail = 'reseller@oenergy.it'
    }

    const user = auth.user
    const data = request.all()
    await Mail.raw(data.subject + ' --- Proveniente da: '+ user.username+ ' Azienda: ' +user.company_name, (message) => {
      message.subject(data.subject)
      message.from(user.email)
      message.to(mail)
    })
  })

  Route.post('prices/signature', 'PriceController.Signature')

  Route.get('/invoices', 'InvoiceController.getInvoices')
  Route.get('/invoices/download/:id', 'InvoiceController.downloadInvoice')
  Route.post('/invoices/upload', 'InvoiceController.uploadInvoice')
  Route.get('/invoices/upload/check', 'InvoiceController.checkStatus')

  Route.get('/bonusgas/dettagli', 'BonusgasController.getDettagli').middleware(['MasterReseller'])
  Route.get('/bonusgas/esiti', 'BonusgasController.getEsiti').middleware(['MasterReseller'])
  Route.get('/bonusgas/annullamenti', 'BonusgasController.getAnnullamenti').middleware(['MasterReseller'])
  Route.get('/bonusgas/download/:id', 'BonusgasController.downloadCsv').middleware(['MasterReseller'])



}).prefix('v1').middleware(['auth','active'])

//Route.get('admin/sync/gas', 'FlowController.getGasFlowsToSync')



Route.get('v1/stripe-session', async function( {request} ) {

  const stripe = require('stripe')('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');

  const session = await stripe.checkout.sessions.create({

    success_url: 'https://negitaly.it/pagamento-effettuato',
    cancel_url: 'https://negitaly.it/pagamento-annullato',
    payment_method_types: ['card'],
    payment_intent_data: {

      metadata: {
        numero_fattura: request.input('numero_fattura'),
        codice_cliente: request.input('codice_cliente'),
        importo: request.input('importo'),
        canale: request.input('canale'),
      },
      description: request.input('description'),

    },

    metadata: {
      numero_fattura: request.input('numero_fattura'),
      codice_cliente: request.input('codice_cliente'),
      importo: request.input('importo'),
      canale: request.input('canale'),
    },
    line_items: [ {
      name: 'Fattura n. '+ request.input('numero_fattura'),
      description: request.input('descrizione'),
      images: [],
      amount: request.input('importo'),
      currency: 'eur',
      quantity: 1
    }
    ],
    mode: 'payment'

  })

  return session




})


Route.post('v1/login', 'ResellerController.login')

Route.post('v1/prices/signature/notify', 'PriceController.NotifySignature')


//Route.post('/rcu-gas', 'RcuGasController.create');



