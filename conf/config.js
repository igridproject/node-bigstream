module.exports = {
  'amqp' : require('./amqp.json'),
  'memstore' : require('./memstore.json'),
  'storage' : require('./storage.json'),
  'auth' : {
    'secret': require('./secret.json'),
	'acl' : require('./acl.json')
  }
}
