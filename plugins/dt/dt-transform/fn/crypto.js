var crypto = require("crypto");

var publicEncrypt = function(data, publicKey) {
    var buffer = Buffer.from(data);
    var encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString("base64");
};

var privateDecrypt = function(crypted_data, privateKey) {
    var buffer = Buffer.from(crypted_data, "base64");
    var decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString("utf8");
};

module.exports = {
    publicEncrypt: publicEncrypt,
    privateDecrypt: privateDecrypt
}