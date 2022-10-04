'use strict'
const Reseller = use('App/Models/Reseller')
const Database = use('Database')
const SpreadSheet = use('SpreadSheet')
const RcuGas = use('App/Models/RcuGas')
const Customer = use('App/Models/Customer')
const Flow = use('App/Models/Flow')
const FlowType = use('App/Models/FlowType')
const FlowDownload = use('App/Models/FlowDownload')
const Remi = use("App/Models/Remi");

const PaginationHelper = use('App/Helpers/PaginationHelper');


const moment = require('moment')

var _ = require('lodash');


class ResellerController {





    async login({ request, response, auth }) {

        const { username, password } = request.all()
        const reseller = await Reseller.query().where('username', username).first()

        return await auth.attempt(username, password, { reseller })

    }

    async getReseller({ request, response, auth, params }) {

        return await Reseller.query().where('uuid', params.uuid).first()

    }

    async updateReseller({ request, response, auth }) {

        const { user } = request.all()

        const reseller = await Reseller.query().where('uuid', user.uuid).first()

        reseller.merge(user)
        return await reseller.save()

    }

    async createReseller({ request, response, auth }) {

        const { user } = request.all()

        return await Reseller.create(user)



    }

    async getAll({ request, response, auth }) {

        const page = request.input('page', 1)
        const rowsPerPage = request.input('perPage', 999999)
        const sortBy = request.input('sortBy', 'company_name')
        const order = request.input('order', 'asc')
        const master_reseller = request.input('master_reseller', null)
        const search = request.input('search', null)
        const excludeMe = request.input('excludeMe', null)
        const query = Reseller.query().orderBy(sortBy, order).with('resellerMaster')
        if (auth.user.master_reseller) {
            query.where(inner => {
                if(!excludeMe) inner.where('uuid', auth.user.uuid)
                inner.orWhere('master_reseller_uuid', auth.user.uuid)
            })
        }
        if (master_reseller) {
            query.where('master_reseller', true)
        }
        
        if (search && search.length > 0) {
            query.where(inner => {
                inner
                    .where("company_name", "iLIKE", `%${search}%`)
                    .orWhere("vat_number", "iLIKE", `%${search}%`)
            });
        }
        response.success(await query.paginate(page, rowsPerPage))
    }

    async getNotDownloadedFlowsCount({ request, response, auth }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

        if(auth.user.master_reseller && whiteLabel == 'false') {
            return []
        }

        const showAll = request.input('showAll', false)
        var subResellers = []
        if(auth.user.master_reseller && whiteLabel == 'true') {
            subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')
        }
        const q = FlowType.query()
            .withCount('flows', (builder) => {
            builder.whereHas('combinations', (det) => {

                det.whereHas('customer', (cus) => {
                    if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {

                        if (subResellers.length > 0) {
                            cus.whereIn('resellers_customers.reseller_vat_number', subResellers)                             
                        } else {
                            cus.where('resellers_customers.reseller_vat_number', auth.user.vat_number)
                        }

                        cus.whereRaw('resellers_customers.date_from  <= flows_combinations.ref_date').where(function () {
                            this.whereNull('resellers_customers.date_to').orWhereRaw("resellers_customers.date_to <= flows_combinations.ref_date + interval '1 day'")


                        })
                    }
                    
                }, '>=', 1)


            })


                .whereDoesntHave('downloads', (builder) => {
                    builder.where('username', auth.user.username)
                })


        })
            return await q.fetch()







        //return await q.countDistinct('flows_types.id')





    }

    async setAllDownloaded({ request, response, auth }) {


        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

        const showAll = request.input('showAll', false)
        var subResellers = []
        if(auth.user.master_reseller && whiteLabel == 'true') {
            subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')
        }


        const flowsData = await Flow.query().whereNotNull('flow_type_id').whereHas('combinations', (det) => {

            det.whereHas('customer', (cus) => {
                if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {

                    if (subResellers.length > 0) {
                        
                                cus.whereIn('resellers_customers.reseller_vat_number', subResellers)

   
                    } else {
                        cus.where('resellers_customers.reseller_vat_number', auth.user.vat_number)
                    }   

                    cus.whereRaw('resellers_customers.date_from  <= flows_combinations.ref_date').where(function () {
                        this.whereNull('resellers_customers.date_to').orWhereRaw("resellers_customers.date_to <= flows_combinations.ref_date + interval '1 day'")


                    })
                }
            }, '>=', 1)


        })
            .whereDoesntHave('downloads', (builder) => {
                builder.where('username', auth.user.username)
            }).fetch()

        var flows = flowsData.toJSON()

        var result = flows.map(function (el) {
            var o = {};
            o.flow_type_id = el.flow_type_id
            o.flow_path = el.path
            o.username = auth.user.username;
            return o;
        })


        // Break up our array of items into chunks of 500
        const chunks = _.chunk(result, 500)

        // Iterate through each chunk of 500 items
        chunks.map(async (chunk) => {

            var today = moment().format('YYYY-MM-DD HH:mm:ss')

            var values = _.flatMap(chunk, (item) => {
                return '(' +
                    "" + item.flow_type_id + "," +
                    "'" + item.flow_path + "'," +
                    "'" + today + "'," +
                    "'" + today + "'," +
                    "'" + item.username + "')"

            })


            const query = `INSERT into flows_downloads (flow_type_id,flow_path, created_at, updated_at, username)
    VALUES  ${values.join(',')}`

            //console.log(query)
            return await Database.raw(query)

        })

        return true


    }


    async getFlows({ request, response, auth }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

        const showAll = request.input('showAll', false)
        const downloaded = request.input('downloaded', false)


        const commodity = request.input('commodity', null)
        const service_code = request.input('service_code', null)
        const flow_code = request.input('flow_code', null)
        const pdp = request.input('pdp', null)
        const withDetails = request.input('withDetails', false)

        const page = request.input('page', 1)
        const rowsPerPage = request.input('perPage', 999999)
        const sortBy = request.input('sortBy', 'created_at')
        const order = request.input('order', 'desc')

        const from = request.input('from', null)
        const to = request.input('from', moment())

        if(auth.user.master_reseller && whiteLabel == 'false') {
            return response.success([])
        }

        var subResellers = []
        if(auth.user.master_reseller && whiteLabel == 'true' )
        subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')

        const q = Flow.query().whereNotNull('flow_type_id')

        q.whereHas('combinations', (det) => {

            det.whereHas('customer', (cus) => {
                if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {

                    if (subResellers.length > 0) {
                        
                                cus.whereIn('resellers_customers.reseller_vat_number', subResellers)

                

                    } else {
                        cus.where('resellers_customers.reseller_vat_number', auth.user.vat_number)
                    }

                    cus.whereRaw('resellers_customers.date_from  <= flows_combinations.ref_date').where(function () {
                        this.whereNull('resellers_customers.date_to').orWhereRaw("resellers_customers.date_to <= flows_combinations.ref_date + interval '1 day'")


                    })
                }

                if (pdp) {
                    cus.where('pdp', pdp)
                }

            }, '>=', 1)


        })



        if (commodity) {
            q.where('commodity', commodity)
        }
        if (service_code) {
            q.where('service_code', service_code)
        }
        if (flow_code) {
            q.where('flow_code', flow_code)
        }

        if (from) {
            q.where('created_at', '>=', from)
        }
        if (to) {
            q.where('created_at', '<=', to)
        }



        q.with('distributor').with('downloads', (builder) => {
            builder.where('username', auth.user.username)
        })

        if (!downloaded && !withDetails) {
            q.whereDoesntHave('downloads', (builder) => {
                builder.where('username', auth.user.username)
            })
        }

        if (downloaded && !withDetails) {
            q.whereHas('downloads', (builder) => {
                builder.where('username', auth.user.username)
            })
        }

        if (withDetails) {
            q.with('combinations', (det) => {

                det.whereHas('customer', (cus) => {
                    if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {

                        if (subResellers.length > 0) {
                        
                            cus.whereIn('resellers_customers.reseller_vat_number', subResellers)

            

                        } else {
                            cus.where('resellers_customers.reseller_vat_number', auth.user.vat_number)
                        }
                        
                        cus.whereRaw('resellers_customers.date_from  <= flows_combinations.ref_date').where(function () {
                            this.whereNull('resellers_customers.date_to').orWhereRaw("resellers_customers.date_to <= flows_combinations.ref_date + interval '1 day'")


                        })
                    }

                    if (pdp) {
                        cus.where('pdp', pdp)
                    }




                }, '>=', 1)


            })

        }

        q.orderBy(sortBy, order)


        response.success(await q.paginate(page, rowsPerPage))


        /*
        
                const query = Database.table('flows').select('flows.*','flows_downloads.username','flows_downloads.created_at as downloaded_at','distributors.company_name as company_name','Max(flows_combinations.ref_date) as ref_date')
                .innerJoin('flows_combinations', 'flows.id', 'flows_combinations.flow_id')
                .innerJoin('resellers_customers', (inner) => {
                    inner.on('resellers_customers.pdp', 'flows_combinations.pdp')
                  }).leftJoin('flows_downloads',(left) => {
                    left.on('flows.id', 'flows_downloads.flow_id')
                  }).leftJoin('distributors',(left) => {
                    left.on('flows.distributor_vat_number', 'distributors.vat_number')
                  })
        
        
        
                  if(!auth.user.superadmin || (auth.user.superadmin && !showAll)) {
                    query.where('resellers_customers.reseller_vat_number',auth.user.vat_number)
                }
        
                query.whereRaw('resellers_customers.date_from  <= flows_combinations.ref_date')
                query.where( function () {
                    this.whereNull('resellers_customers.date_to').orWhereRaw("resellers_customers.date_to <= flows_combinations.ref_date + interval '1 day'")
                })
            
                  query.where( (builder) =>{
                    builder.whereNull('flows_downloads.username').orWhere('flows_downloads.username',auth.user.username)
                  })
                
                
                //raw('select f.* from flows f inner join flows_combinations c on f.id=c.flow_id inner join rcu_gas r on r."PIVA_CC" = ? and r."COD_PDR" = c.pdp  group by f.id', [auth.user.vat_number])
            
                if(commodity) {
                    query.where('flows.commodity', commodity)
                }
                if(service_code) {
                    query.where('flows.service_code', service_code)
                }
                if(flow_code) {
                    query.where('flows.flow_code', flow_code)
                }
                if(pdp) {
                    query.where('flows_combinations.pdp', pdp)
                }
        
                if (from) {
                    query.where('flows.created_at', '>=', from)
                }
                if (to) {
                    query.where('flows.created_at', '<=', to)
                }
              
                query.orderBy(sortBy, order)
        
        
                  if(withDetails) {
                      query.select('flows_combinations.details')  
                      query.groupBy('flows.id','flows_downloads.username','flows_downloads.created_at','distributors.company_name','flows_combinations.details','flows_combinations.ref_date')
        
                  } else {
                    query.groupBy('flows.id','flows_downloads.username','flows_downloads.created_at','distributors.company_name','flows_combinations.ref_date')
        
        
                  }
        
        
                  // 2. Make sure that you get the total. If your controller has search functionality,
                  // ensure that you recount the total of the filtered result and store in the `total` variable.
                  let total = await query.getCount();
        
                  query.limit(rowsPerPage)
                  query.offset((page - 1) * rowsPerPage)
          
        
                  
                  var res = await query
                  
                  // 3. For this use case, calling the `toJSON` function won't work on 
                  // the Database query result. The `PaginationHelper` class will internally
                  // serialise the result to JSON.
                  // 4. Ensure that you set `custom_build` to `true` when you are 
                  // querying from the `Database` class.
                  // 5. Pass in `per_page`, `page`, and `total` params too.
                  const pag = new PaginationHelper(res, request, { custom_build:true }, rowsPerPage, page, total).paginate
        
                  
              
                  
             
                response.success(pag)
        
                */
    }


    async getCustomers({ request, response, auth }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
        const id = request.input('id', null)
        const search = request.input('search', null)

        const showAll = request.input('showAll', false)


        const page = request.input('page', 1)
        const rowsPerPage = request.input('perPage', 25)
        const sortBy = request.input('sortBy', false)
        const order = request.input('order', 'asc')

        var subResellers = []
        if(auth.user.master_reseller && whiteLabel == 'true')
        subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')
        const query = Customer.query().with('reseller')



        if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {
            if(subResellers.length > 0) {
                query.whereIn('reseller_vat_number',subResellers)
            }
            else query.where('reseller_vat_number', auth.user.vat_number)
        }


        if (search) {
            //query.where('pdp', search)

            query.where(function () {
                this.where('pdp', search).orWhereHas('rcuGas', (builder) => {
                    builder.whereRaw('"COGNOME" ilike ?', ["%" + search + "%"])
                }).orWhereHas('rcuGas', (builder) => {
                    builder.whereRaw('"RAGIONE_SOCIALE_DENOMINAZIONE" ilike ?', ["%" + search + "%"])
                })



            })

        }
        query.with('rcuGas')

        if (sortBy) {
            query.orderBy(sortBy, order)
        }

        response.success(await query.paginate(page, rowsPerPage))


    }

    async getCustomer({ request, response, auth, params }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

        const showAll = request.input('showAll', false)

        var subResellers = []
        if(auth.user.master_reseller && whiteLabel == 'true')
        subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')

        const query = Customer.query()

        if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {
            if(subResellers.length > 0) {
                query.whereIn('reseller_vat_number',subResellers)
            }
            else query.where('reseller_vat_number', auth.user.vat_number)
        }


        return await query.where('id', params.id).with('rcuGas').with('reseller').first()


    }

    async downloadRemi({ request, response, auth, params }) {
        const ss = new SpreadSheet(response, params.format)
        const query = Remi.query().where('enabled', true).select('code as remi_pool')
        const pdrsData = await query.fetch()
        const data = [['remi_pool']]
        const pdrs = pdrsData.toJSON()
        pdrs.forEach(pdr => { data.push(Object.values(pdr)) })
        ss.addSheet('REMI', data)
        ss.download('REMI')
    }


    async downloadRcuGas({ request, response, auth, params }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
        const ss = new SpreadSheet(response, params.format)

        const showAll = request.input('showAll', false)


        const query = RcuGas.query()

        if (!auth.user.superadmin || (auth.user.superadmin && !showAll)) {
            if(whiteLabel == 'true' && auth.user.master_reseller) {
                var subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')
                query.whereIn('PIVA_CC', subResellers)
            }else query.where('PIVA_CC', auth.user.vat_number)
        }

        const pdrsData = await query.fetch()


        const columns = await Database.raw("SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = ? order by ordinal_position", ['rcu_gas'])

        const data = []

        data.push(columns.rows.map(el => {
            return el.column_name
        }))

        const pdrs = pdrsData.toJSON()
        pdrs.forEach(pdr => {
            data.push(Object.values(pdr))
        })

        ss.addSheet('RCU GAS', data)
        ss.download('RCU_GAS')


    }

    async getTotalGasCustomers({ request, response, auth }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
        const showAll = request.input('showAll', false)


        if (auth.user.superadmin && showAll) {
            return await RcuGas.query().getCount()

        } else if (whiteLabel == 'true' && auth.user.master_reseller) {
            var subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')
            return await RcuGas.query().whereIn('PIVA_CC', subResellers).getCount()
        }
        else return await RcuGas.query().where('PIVA_CC', auth.user.vat_number).getCount()
    }

    async getTotalGasRemis({ request, response, auth }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
        const showAll = request.input('showAll', false)
        if (auth.user.superadmin && showAll) {
            return await RcuGas.query().getCountDistinct('COD_REMI')

        } else if (whiteLabel == 'true' && auth.user.master_reseller) {
            var subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')
            return await RcuGas.query().whereIn('PIVA_CC', subResellers).getCountDistinct('COD_REMI')
        }
        else return await RcuGas.query().where('PIVA_CC', auth.user.vat_number).getCountDistinct('COD_REMI')
    }

    async getTotalGasConsumptions({ request, response, auth }) {
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'
        const showAll = request.input('showAll', false)
        if (auth.user.superadmin && showAll) {
            const result = await Database.raw('select sum( "PREL_ANNUO_PREV"::INTEGER ) as total from rcu_gas')
            return result.rows[0].total
        }
        else if (whiteLabel == 'true' && auth.user.master_reseller) {
            // DA CONTROLLARE
            var subResellers = await Reseller.query().where('master_reseller_uuid', auth.user.uuid).orWhere('uuid', auth.user.uuid).pluck('vat_number')
            let query = await RcuGas.query().sum("PREL_ANNUO_PREV as total").whereIn('PIVA_CC',subResellers).first()
            return query.total
            // const result = await Database.raw('select sum( "PREL_ANNUO_PREV"::INTEGER ) as total from rcu_gas where "PIVA_CC" = ? ', [auth.user.vat_number])
            // return result.rows[0].total
        } else {
            const result = await Database.raw('select sum( "PREL_ANNUO_PREV"::INTEGER ) as total from rcu_gas where "PIVA_CC" = ? ', [auth.user.vat_number])
            return result.rows[0].total
        }

    }



}

module.exports = ResellerController
