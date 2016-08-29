'use strict';

var _ = require('lodash');

function Scope() {
    // Giving the scope a place to store all watchers that have been registered.
    // $$ before watchers means that $$watchers should be considered private 
    // to the Angular framework and not be called from the app code.
    this.$$watchers = [];
}

function initWatchVal() {

}

Scope.prototype.$watch = function(watchFn, listenerFn) {
    var watcher = {
        watchFn: watchFn,
        // Here we adding support to the watcher in case listenerFn is omitted
        listenerFn: listenerFn || function() { },
        last: initWatchVal
    };
    // Each $watch pushes the watch and listenerFn to the array of $$watchers
    this.$$watchers.push(watcher);
};

//Loops over each watcher and calls the listenerFn
Scope.prototype.$$digestOnce = function() {
    // self in this instance is scope
    var self = this;
    var newValue, oldValue, dirty;
    _.forEach(this.$$watchers, function(watcher) {
        // So when we call the following line self is referring to scope
        newValue = watcher.watchFn(self);
        // on first iteration oldValue is null, this is why when we call scope.$digest
        // in our test suite scope.counter++ increments because scope is NOT null
        oldValue = watcher.last;
        // Here we compare newValue to oldValue
        if (newValue !== oldValue) {
            // if newValue is not equal to oldValue, we set watcher.last to newValue
            watcher.last = newValue;
            // Here we're checking to see if the old value is the inital value and replacing if it is
            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
            // We set dirty to true here because this will let us know if we have actually done some dirtyChecking
            dirty = true;
        }
    });
    // If dirty returns false, it means there was no dirty checking
    return dirty;
};

Scope.prototype.$digest = function() {
    var dirty;
    do {
        dirty = this.$$digestOnce;
    } while (dirty);
};

module.exports = Scope;
