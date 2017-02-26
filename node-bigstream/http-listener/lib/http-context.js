module.exports.middleware = function(ctx){
  var funcCtx = function (req, res, next) {
    req.context = ctx;
    next();
  }

  return funcCtx;
}
