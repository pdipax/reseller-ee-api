'use strict'

const moment = require('moment')
const unzipper = require('unzipper');
const Papa = use('Papa')

const RcuGas = use('App/Models/RcuGas')
const Redis = use('Redis')

class RcuGasController {

  async checkStatus ({ request, response }) {
    return await Redis.get('uploading-rcu-gas')
  }


  async uploadZip ({ request, response }) {


    await Redis.set('uploading-rcu-gas', true)
    await Redis.expire('uploading-rcu-gas', 600)



    const {file} = request.all()

    var buffer = new Buffer.from(file, 'base64');

    await RcuGas.truncate()


  var directory = await unzipper.Open.buffer(buffer);
  directory.files.forEach( async (parent) => {


    var parentBuffer = await unzipper.Open.buffer( await parent.buffer());

    parentBuffer.files.forEach( async (csv) => {

      var ext = csv.path.split('.').pop().toLowerCase();
      if(ext =='csv') {
        var csvBuffer = await csv.buffer()
        var text =csvBuffer.toString()

            // rewrite parseDynamic to return undefined
function parseDynamicReturningUndefined(value, field) {
  return value === '' ? undefined : value
 }

    
        var result = await Papa.parse(text, {
          dynamicTyping: false, // important, or will be called after transform
          header: true, 
          skipEmptyLines: true,
          transform: parseDynamicReturningUndefined,

          complete: async function(res) {
            await RcuGas.createMany(res.data)

    
          },
          error: error => {
            console.log(error)
          }})







}




  })
})





  }


    async create ({ request, response }) {

        const {csv} = request.all()

        let buff = new Buffer.from(csv, 'base64');
        let text = buff.toString('utf8');
       
     

      var csvData = text
          .split('\n') // split string to lines
          .map(e => e.trim()) // remove white spaces for each line
          .map(e => e.split(';').map(e => e.trim())); // split each line to array
      

          let header = csvData[0];


// Create a function to return the desired object structure
function formatObject(headers, cells) {
    return headers.reduce((result, header, idx) => {
      result[header] = cells[idx]
      return result
    }, {})
  }
  
      // Reduce each row into the desired format, and use the ID as a key
let result = csvData.reduce((res, row, idx) => {
    if(row[0].trim() !='COD_PDR' || !isNaN(row[0])) {
      let value = formatObject(header, row)
      res.push( value)
    }
    return res
  }, [])
      
      //  if(element[0].trim() != 'COD_PDR' && !isNaN(element[0])) {
            /*
          var dir = 'storage/'+element[17].trim().padStart(11, '0')+'/RCU_GAS/'+year+'/'+month
          if (fs.existsSync(dir)) {
            let row = element.join(";")
            let csvContent = row + "\r\n"    
            fs.appendFileSync(dir+'/RCU_'+today+'.csv', csvContent);
            
          } else {
            fs.mkdirSync(dir, { recursive: true })
            let header = csvData[0].join(";")
            let csvContent = header + "\r\n"
            let row = element.join(";")
            csvContent += row + "\r\n"
            fs.appendFileSync(dir+'/RCU_'+today+'.csv', csvContent);
      
      
          }
          */
         // data.push({commodity: 'g', pdp: element[0].trim().padStart(14, '0'), vat_number: element[17].trim().padStart(11, '0')})
      //  }
      
     // })
      
      await RcuGas.truncate()
      await RcuGas.createMany(result)
    }
      


}

module.exports = RcuGasController
