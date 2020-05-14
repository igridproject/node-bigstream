var crypto = require('crypto');

module.exports.sha256 = function (text) {
    var dat = (typeof text == 'string')?text:String(text);
    return crypto.createHash('sha256').update(dat).digest('hex');
}