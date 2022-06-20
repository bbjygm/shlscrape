const Util = {};

Util.getUrlContentText = function (url) {
  // const retries = 5;
  var response;
  do {
    response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  } while (response.getResponseCode() !== 200);
  return response.getContentText();
};

Util.decodeHTMLEntities = function (input) {
  var decode = XmlService.parse('<d>' + input + '</d>');
  return decode.getRootElement().getText();
};

Util.isRGBHexCode = function (str) {
  return /^#[0-9a-fA-F]{6}$/.test(str);
};

// https://leancrew.com/all-this/2020/06/ordinal-numerals-and-javascript/
Util.ordinal = function (n) {
  var s = ["th", "st", "nd", "rd"];
  var v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// function test() {
//   Util.addArrayToSheet(SpreadsheetApp.getActiveSpreadsheet().getSheetByName('db').getRange('S2'), [[1, 2, 3, 4, 5]]);
// }

Util.addArrayToSheet = function (range, values) {
  // let maxRows = values.length;
  // let maxColumns = values.reduce((len, row) => Math.max(len, row.length), 0);
  // let availableRows = maxRows - (range.getRow() - 1);
  // let availableColumns = maxColumns - (range.getColumn());
  for (let row in values) {
    // for (let col in values[row]) {
    range.offset(row, 0, 1, values[row].length).setValues([values[row]]);
    // }
  }
}

/**
 * @customfunction
 */
function GETCOLOR(reference) {
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let colors = ss.getRange(reference).getBackgroundObjects();
  return colors.map(row => row.map(cell => {
    let type = cell.getColorType();
    if (type == SpreadsheetApp.ColorType.THEME) {
      return cell.asThemeColor().getThemeColorType();
    }
    return cell.asRgbColor().asHexString();
  }));
}

Date.prototype.toDateInputValue = (function () {
  var local = new Date(this);
  local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
  return local.toJSON().slice(0, 10);
});

String.prototype.toCamelCase = (function() {
  return this.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
})
