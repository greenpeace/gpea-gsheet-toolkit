const express = require('express');
const router = express.Router();
const GSheet = require('../models/GSheet')
const _ = require("lodash")

router.get('/', (req, res, next) => {
  res.json({
    status: "OK",
    message: "Hello GSheet API"
  })
});

/**
 * Validate the apiName.
 * 
 * It should:
 *  - Appears in the definition
 *  - Should have spreadsheetId and sheetName
 *  - Status should be Enable
 */
router.param('apiName', async (req, res, next, apiName) => {
  let gsheet = new GSheet()

  await gsheet.auth()
  let schemas = await gsheet.getSchemas('GSHEET_AS_API')

  let foundSchema = schemas.find((obj) => {
    return obj.apiName && obj.apiName.trim().toLowerCase()===apiName.trim().toLowerCase()
  })

  if ( !foundSchema) {
    res.status(503).send(`This api name (${apiName}) is not supported.`);
  }

  if (foundSchema.status!=="Enable") {
    res.status(503).send(`This api name (${apiName}) is not enabled.`);
  }

  if ( !foundSchema.spreadsheetId || !foundSchema.sheetName) {
    res.status(503).send(`This api name (${apiName}) doesn't have the correct spreadsheetId or sheetName.`);
  }

  foundSchema.read = JSON.parse(foundSchema.read)
  foundSchema.write = JSON.parse(foundSchema.write)

  req.apiName = apiName;
  req.gsheet = gsheet; // for later use
  req.apiSchema = foundSchema

  next();
});

router.get('/:apiName', async (req, res, next) => {
  const gsheet = req.gsheet
  let {spreadsheetId, sheetName, read, apiName} = req.apiSchema

  // disable if Read if disabled
  if (read.enable!==true) {
    res.status(503).send(`This api name (${apiName}) doesn't support GET method.`);
  }

  // fetch all rows and parse locally
  let rows = await gsheet.fetchAllRows(spreadsheetId, sheetName)

  // filter 
  if (req.query.q && rows.length>0) {
    let q = JSON.parse(req.query.q)

    Object.keys(q).forEach((qfield) => {
      if (qfield in rows[0]) {
        rows = rows.filter(row => row[qfield]==q[qfield])
      }
    })
  }

  // sort
  if (req.query.sort && rows.length>0) {
    let tokens = req.query.sort.split(",")

    tokens.reverse().forEach(t => {
      let sortDirection = t.charAt(0)==="-" ? -1:1;
      t = _.trim(t, "-+ ") // extract the field name

      if (t in rows[0]) {
        rows = rows.sort((lhs, rhs) => {
          if (lhs[t]<rhs[t]) {return sortDirection*-1}
          if (lhs[t]>rhs[t]) {return sortDirection*1}
          return 0
        })
      } else {
        res.status(500).send(`There in no field called ${t} for sorting`);
      }
    })
  }

  // limit & offset
  res.set('X-Total-Count', rows.length);

  let limit = parseInt(req.query.limit, 10) || 100
  let offset = parseInt(req.query.offset, 10) || 0
  if (limit>100) { limit=100 }
  rows = rows.slice(offset, offset+limit)

  // trim fields based on schema settings
  if (read.fields && Array.isArray(read.fields)) {
    rows = rows.map(r => {return _.pick(r, read.fields)})
  }

  // read to return
  res.json({ 
    records: rows,
    limit,
    offset, 
  })
});

router.post('/:apiName', async (req, res, next) => {
  const gsheet = req.gsheet
  let {spreadsheetId, sheetName, write, apiName} = req.apiSchema

  // disable if Read if disabled
  if (write.enable!==true) {
    res.status(503).send(`This api name (${apiName}) doesn't support POST method.`);
  }

  if ( !Array.isArray(req.body)) {
    res.status(400).send(`The body should be an array of objects`);
  }

  // filter the object fields
  let objsToInsert = req.body
  if (write.fields && Array.isArray(write.fields)) {
    objsToInsert = objsToInsert.map(r => {return _.pick(r, write.fields)})
  }

  // insert rows
  let r = await gsheet.appendRows(spreadsheetId, sheetName, objsToInsert)

  res.json({
    values: r.values,
    updatedRows: r.updatedRows
  })
})




// 

module.exports = router;
