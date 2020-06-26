const openpgp = require('openpgp');

async function encrypt (opt) {
    var publicKeyArmored = opt.public_key;
    var datain = opt.data;
    var armor = (opt.armor_out)?true:false;

    var enc = await openpgp.encrypt({
        message: openpgp.message.fromBinary(datain),
        publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys,
        armor: armor
    });

    if(!armor){
        enc = Buffer.from(enc.message.packets.write());
    }

    return enc;
}


async function decrypt (opt) {
    var privateKeyArmored = opt.private_key;
    var passphrase = opt.passphrase ;
    var datain = opt.data;
    var armor = (opt.armor_in)?true:false;

    var { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
    await privateKey.decrypt(passphrase);

    var msg = null;
    if(armor){
        msg = await openpgp.message.readArmored(datain);
    }else{
        msg = await openpgp.message.read(datain);
    }

    const { data: decrypted } = await openpgp.decrypt({
        message: msg,
        privateKeys: [privateKey],
        format:'binary'                                          
    });
 
    return Buffer.from(decrypted);
}


module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;