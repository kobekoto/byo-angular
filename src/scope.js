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
    _.forEach(this.$$watchers, function(watcher) {
        watcher.listenerFn();
    });
};

module.exports = Scope;
