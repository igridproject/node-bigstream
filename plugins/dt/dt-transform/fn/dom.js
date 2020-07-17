var DomParser = require('dom-parser');
var parser = new DomParser();

module.exports = function (html) {
    return parser.parseFromString(html);
}