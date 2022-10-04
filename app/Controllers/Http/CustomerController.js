"use strict";

const Papa = use("Papa");

const Customer = use("App/Models/Customer");
const Redis = use("Redis");
const Database = use("Database");

const moment = require("moment");

// Load the full build.
var _ = require("lodash");

class CustomerController {
  async getCustomerByPdp({ request, response, auth, params }) {
    try {
      const commodity = request.input("commodity", null);
      const pdp = request.input("pdp", null);
      var data = Customer.query().whereNull("date_to")
      .where("reseller_vat_number", auth.user.vat_number);
      if (commodity) data.where("commodity", commodity);
      if (pdp && pdp.length > 0) data.where("pdp",pdp);
      data = await data.first()
      if(data) {
        return response.success([data])
      }else return response.success([])
    } catch (error) {
      console.log("erro",error)
      return response
        .status(500)
        .send({ message: "System Error", error: error });
    }
  }

  async checkStatus({ request, response }) {
    return await Redis.get("uploading-customers");
  }

  async uploadCsv({ request, response }) {
    await Redis.set("uploading-customers", true);
    await Redis.expire("uploading-customers", 600);

    const { file } = request.all();

    var csvBuffer = new Buffer.from(file, "base64");
    var text = await csvBuffer.toString();

    await Customer.truncate();

    // rewrite parseDynamic to return undefined
    function parseDynamicReturningUndefined(value, field) {
      if (value.trim() == "") return undefined;
      if (field == "date_from" || field == "date_to") {
        return moment(value, "DD/MM/YYYY").format("YYYY-MM-DD");
      }
      return value;
      //return value.trim() === '' ? undefined : value
    }

    var result = await Papa.parse(text, {
      dynamicTyping: false, // important, or will be called after transform
      header: true,
      skipEmptyLines: true,
      transform: parseDynamicReturningUndefined,
      complete: async function(res) {
        // Break up our array of items into chunks of 500
        const chunks = _.chunk(res.data, 20);
          //await Customer.createMany(res.data)
          // Iterate through each chunk of 500 items
          chunks.map(async chunk => {
            try {
              var values = _.flatMap(chunk, item => {
                return (
                  "(" +
                  "'" +
                  item.commodity +
                  "'," +
                  "'" +
                  item.pdp +
                  "'," +
                  "E'" +
                  item.name.replace(/'/g, "\\'") +
                  "'," +
                  "'" +
                  item.reseller_vat_number +
                  "'," +
                  (item.date_from ? "'" + item.date_from + "'," : "NULL,") +
                  (item.date_to ? "'" + item.date_to + "'," : "NULL,") +
                  "'" +
                  item.meter_number +
                  "'," +
                  "'" +
                  item.meter_type +
                  "'," +
                  "'" +
                  item.use_category +
                  "'," +
                  "E'" +
                  item.address.replace(/'/g, "\\'") +
                  "'," +
                  "E'" +
                  item.city.replace(/'/g, "\\'") +
                  "'," +
                  "'" +
                  item.province +
                  "'," +
                  "'" +
                  item.postal_code +
                  "'," +
                  "E'" +
                  item.product_code.replace(/'/g, "\\'") +
                  "')"
                );
              });
    
              const query = `INSERT into resellers_customers (commodity, pdp, name,reseller_vat_number, date_from, date_to, meter_number, meter_type, use_category, address, city, province, postal_code, product_code)
        VALUES  ${values.join(",")}`;
    
              //console.log(query)
              const customers = await Database.raw(query);
              
            } catch (error) {
              console.log("error",error)
              console.log(chunk)  
            }
          });
  
          await Redis.del("uploading-customers");
      },
      error: async error => {
        console.log(error);
        await Redis.del("uploading-customers");
      }
    });

    /*

// Break up our array of items into chunks of 500
const chunks = _.chunk(result.data, 500)

// Iterate through each chunk of 500 items
chunks.map(async (chunk) => {

  const customers = await Database.raw(`
    INSERT into resellers_customers (commodity, pdp, name,reseller_vat_number, date_from, date_to, meter_number, meter_type, use_category, address, city, province, postal_code, product_code)
    VALUES ${Array(chunk.length).fill('(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',')}`, _.flatMap(chunk, (item) => {
      return [
      item.commodity, 
    item.pdp, 
    item.name,
    item.reseller_vat_number,
    item.date_from, 
    item.date_to, 
    item.meter_number, 
    item.meter_type, 
    item.use_category, 
    item.address, 
    item.city, 
    item.province, 
    item.postal_code, 
    item.product_code
      ]
      })
  )
  })
  
  

  // Extract record ids from the query result
  //const customers_ids = customers.rows.map(c => c.id)

*/

    //return result.data
  }
}

module.exports = CustomerController;
