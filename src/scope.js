'use strict';

var _ = require('lodash');

function Scope() {
    // Giving the scope a place to store all watchers that have been registered.
    // $$ before watchers means that $$watchers should be considered private 
    // to the Angular framework and not be called from the app code.
    this.$$watchers = [];
}

Scope.prototype.$watch = function(watchFn, listenerFn) {
    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn
    };
    // Each $watch pushes the watch and listenerFn to the array of $$watchers
    this.$$watchers.push(watcher);
};

//Loops over each watcher and calls the listenerFn
Scope.prototype.$digest = function() {
    // self in this instance is scope
    var self = this;
    var newValue, oldValue;
    _.forEach(this.$$watchers, function(watcher) {
        // So when we call the following line self is referring to scope
        newValue = watcher.watchFn(self);
        // on first iteration oldValue is null
        oldValue = watcher.last;
        // Here we compare newValue to oldValue
        if (newValue !== oldValue) {
            // if newValue is not equal to oldValue, we set watcher.last to newValue
            watcher.last = newValue;
            // If the values differ we call the listener function on the watcher
            watcher.listenerFn(newValue, oldValue, self);
        }
    });
};

module.exports = Scope;
