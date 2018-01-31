

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

exports.Array.prototype.delayedForEach = function(callback, timeout, thisArg){
var i = 0,
    l = this.length,
    self = this,
    caller = function(){
        callback.call(thisArg || self, self[i], i, self);
        (++i < l) && setTimeout(caller, timeout);
    };
caller();
};


