var thunky = require('thunky')

var _self = null;
function TestThunk()
{
    _self = this;
    this.rnumber = 0;
}

TestThunk.prototype.init = function()
{
    console.log('waiting 1s and returning random number');
}

TestThunk.prototype.open = thunky(function (callback) { // the inner function should only accept a callback
  _self.init();
  setTimeout(function () {
    var ran = Math.random();
    _self.rnumber = ran;
    callback(null,ran)
  }, 1000)
})
 
TestThunk.prototype.test = function(x){
    _self.open((err,num)=>{
        console.log(_self.rnumber + ' ' + x)
    });
}


var tt = new TestThunk();
tt.test(1);
tt.test(2);
tt.test(3);
tt.test(4);
tt.test(5);