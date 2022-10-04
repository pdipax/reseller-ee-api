"use strict";

const Database = use("Database");

const Json2csvParser = require("json2csv").Parser;

const InvoiceOenergy = use('App/Models/InvoiceOenergy')
const Redis = use('Redis')

const Papa = use('Papa')


class InvoiceController {


    async getInvoices({auth, request, response}){

        const page = request.input('page', 1)
        const rowsPerPage = request.input('perPage', 999999)
        const sortBy = request.input('sortBy', 'company_name')
        const order = request.input('order', 'desc')
      
      
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

        if(whiteLabel == 'true') {

            let query = Database.select(["FATTURA_ID","NUMERO_FATTURA","DATA_FATTURA"]).from('invoices_oenergy').groupBy("FATTURA_ID","NUMERO_FATTURA","DATA_FATTURA")  
            //let query = InvoiceOenergy.query().select(["FATTURA_ID","NUMERO_FATTURA","DATA_FATTURA"]).orderBy("DATA_FATTURA",'desc').groupBy(["FATTURA_ID","NUMERO_FATTURA","DATA_FATTURA"])
            if(!auth.user.master_reseller) {
                query.where('CONTROPARTE',auth.user.company_name)
            }

            let total = await query.getCount()

            let data = await query
            .orderBy("FATTURA_ID",order)
            .offset((page-1) * rowsPerPage)
            .limit(rowsPerPage)
          
      
            let res = {
              data, total, perPage: rowsPerPage, page
            }

            return response.success(res);




        } else {
            return response.success([])

        }
        



    }


    async checkStatus ({ request, response }) {

        return await Redis.get('uploading-invoice-oenergy')
      }

    async uploadInvoice({auth, request, response}){

   
        let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

        if(whiteLabel == 'true' && auth.user.master_reseller) {
                await Redis.set('uploading-invoice-oenergy', true)
                await Redis.expire('uploading-invoice-oenergy', 600)
                       
                const {file} = request.all()
            
                var buffer = new Buffer.from(file, 'base64');            
            
                var text =buffer.toString()

                function toJson (text) {
                    // rewrite parseDynamic to return undefined
                    function parseDynamicReturningUndefined(value, field) {
                        return value === '' ? undefined : value
                    }

                    return new Promise((resolve, reject) => {
                    Papa.parse(text, {
                        dynamicTyping: false, // important, or will be called after transform
                        header: true, 
                        skipEmptyLines: true,
                        transform: parseDynamicReturningUndefined,
                      complete (results) {
                        resolve(results.data)
                      },
                      error (err) {
                        reject(err)
                      }
                    })
                  })
                }


                try {
                    const data = await toJson(text)
                    await InvoiceOenergy.createMany(data)
                    await Redis.del('uploading-invoice-oenergy')

                    return response.success('Inserimento completato')

                } catch (error) {
                    console.log(error)
                    await Redis.del('uploading-invoice-oenergy')
                    return response.status(400).send({message:"System Error"})
                    
                }


        } else if (whiteLabel == 'false' && auth.user.superadmin) {


            return response.success([])

        }
        



    }


    async downloadInvoice({ request, response, auth, params }) {
        try {
    
            const json2csvParser = new Json2csvParser({
                header: true,
                delimiter: ";",
                escapedQuote: '',
                quote: ''
              });


            let whiteLabel = request.header('white-label') ? request.header('white-label') : 'false'

            if(whiteLabel == 'true') {
                let query = Database.select('*').from('invoices_oenergy').where('FATTURA_ID',params.id) 
                if(auth.user.master_reseller) {
                    return await json2csvParser.parse(await query);
                } else {
                    query.where('CONTROPARTE',auth.user.company_name)
                    return await json2csvParser.parse(await query);
                }
            } else {
                return response.success([])
    
            }
        
    
    
        } catch (error) {
    
          return response
            .status(500)
            .send({ message: "System Error", error: error });
        }
      }




  
}

module.exports = InvoiceController;
