const {google} = require('googleapis');
require('dotenv').config()
const _ = require('lodash')

class GSheet {
  constructor() {
    this.sheets = null
    this.asApiSchema = null
  }

  async auth () {
    const auth = await google.auth.getClient({ 
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'] 
    });
    const sheets = google.sheets({ version: 'v4', auth });
    this.sheets = sheets
  }

  /**
   * Convert from column, row into google sheet A1 notation
   *   
   * @param  {int} row    0-based
   * @param  {int} column 0-based
   * @return {string} The A1 notation
   */
  getA1Notation (row, column) {
    const a1Notation = [`${row + 1}`];
    const totalAlphabets = "Z".charCodeAt() - "A".charCodeAt() + 1;
    let block = column;
    while (block >= 0) {
      a1Notation.unshift(
        String.fromCharCode((block % totalAlphabets) + "A".charCodeAt())
      );
      block = Math.floor(block / totalAlphabets) - 1;
    }
    return a1Notation.join("");
  };

  /**
   * Fetch the defined schema from google sheet. 
   * 
   * @param  {string} category This is the sheet name of that schema table. ex. GSHEET_AS_API
   * @return {array} [{}]
   */
  async getSchemas (category) {
    let asApiSchema = await this.fetchAllRows(process.env.GSHEET_TOOLKIT_SCHEMA_SPREADSHEET_ID, category)

    asApiSchema.forEach((row, k) => {
      if (asApiSchema[k].Read) {
        asApiSchema[k].Read = JSON.parse(asApiSchema[k].Read)  
      }
      if (asApiSchema[k].Write) {
        asApiSchema[k].Write = JSON.parse(asApiSchema[k].Write)  
      }
    })

    this.asApiSchema = asApiSchema
    return asApiSchema
  }

  /**
   * Retrieve all rows for the given id
   * 
   * @param  {string} spreadsheetId 
   * @param  {string} sheetName
   * @return {array} [{...}]
   */
  async fetchAllRows(spreadsheetId, sheetName) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: sheetName,
    });

    let headers = response.data.values[0];
    let rows = response.data.values.slice(1).map( r => {
      return _.zipObject(headers, r)
    })

    return rows;
  }

  /**
   * Add rows into spreadsheet
   * @param  {string} spreadsheetId The google spreadsheet id
   * @param  {string} sheetName     The sheet display name
   * @param  {array} objects       Array of objects to inserts. It eliminate un-suitable columns.
   * @return {object} {values, updatedRows}
   */
  async appendRows(spreadsheetId, sheetName, objects) {
    // fetch headers
    let existingRows = await this.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}`,
    });
    let headers = existingRows.data.values[0];

    // convert the object into arrays
    let rowsToInsert = objects.map(obj => {
      let rowToInsert = []

      headers.forEach((fieldName, k) => {
        if (fieldName in obj) {
          rowToInsert[k] = obj[fieldName]
        }
      })

      return rowToInsert
    })

    // remove empty arrays
    rowsToInsert = rowsToInsert.filter(a=>a.length)

    // update that range
    let existingNumRows = existingRows.data.values.length
    let range = `${sheetName}!${this.getA1Notation(existingNumRows, 0)}:${this.getA1Notation(existingNumRows+rowsToInsert.length, headers.length)}`
    let response = await this.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rowsToInsert
      }
    });

    return Object.assign({values: rowsToInsert}, response.data)
  }
}

module.exports = GSheet