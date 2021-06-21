const BSON = require('bson')

module.exports.parse = function (buff) {
    return BSON.deserialize(buff,{allowObjectSmallerThanBufferSize:true,promoteBuffers:true})
}

module.exports.serialize = function (obj,buff) {
    if(buff){
        BSON.serializeWithBufferAndIndex(obj,buff)
        return buff
    }else{
        return BSON.serialize(obj)
    }
}

module.exports.deserialize = function (buff,opt) {
    return BSON.deserialize(buff,opt)
}