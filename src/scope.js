'use strict';

var _ = require('lodash');

function Scope() {
    // Giving the scope a place to store all watchers that have been registered.
    // $$ before watchers means that $$watchers should be considered private 
    // to the Angular framework and not be called from the app code.
    this.$$watchers = [];
    // this.$$lastDirtyWatch is meant to keep track of 
    this.$$lastDirtyWatch = null;
}

function initWatchVal() {

}

Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
    var watcher = {
        watchFn: watchFn,
        // Here we adding support to the watcher in case listenerFn is omitted
        listenerFn: listenerFn || function() {},
        // !! to force it to be a boolean
        // we could have also used new Boolean but that's unnecessary
        valueEq: !!valueEq,
        last: initWatchVal
    };
    // Each $watch pushes the watch and listenerFn to the array of $$watchers
    this.$$watchers.push(watcher);
    // TODO: Give a better explanation
    // We're resetting $$lastDirtyWatch when a watch is added.    
    this.$$lastDirtyWatch = null;
};

//Loops over each watcher and calls the listenerFn
Scope.prototype.$$digestOnce = function() {
    // self in this instance is scope
    var self = this;
    var newValue, oldValue, dirty;
    _.forEach(this.$$watchers, function(watcher) {
        // We wrap the $$digestOnce function in a try-catch blog to catch exceptions
        try {
            // So when we call the following line self is referring to scope
            newValue = watcher.watchFn(self);
            // on first iteration oldValue is null, this is why when we call scope.$digest
            // in our test suite scope.counter++ increments because scope is NOT null
            oldValue = watcher.last;

            // Here we are doing a deep value check of newValue and oldValue to see if they are equal,
            // in addition we're passing the boolean flag to scope.prototype.$$isEqual

            if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {

                // we are assigning the watcher to $$lastDirtyWatch on the scope
                self.$$lastDirtyWatch = watcher;

                // Now we're making a deep clone of newValue because we're checking objects 
                // by value, not reference
                watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                // Here we're checking to see if the old value is the inital value and replacing if it is
                watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
                // We set dirty to true here because this will let us know if we have actually done some dirtyChecking
                dirty = true;
                // If the current watcher is equal to our last dirty watch, let's stop iterating
                // over watches
            } else if (self.$$lastDirtyWatch === watcher) {
                return false;
            }
        } catch(e) {
            console.error(e);
        }
    });
    // If dirty returns false, it means there was no dirty checking
    return dirty;
};

Scope.prototype.$digest = function() {
    // TTL stands for time to live, which is basically the maximum amount of iterations
    // that we'll keep the digest loop running for.
    var ttl = 10;
    var dirty;
    this.$$lastDirtyWatch = null;
    // The do-while loop ensures that we run $$digestOnce at least once
    // The do-while loop keeps running until none of the watched values change
    // as $$digestOnce either returns true or false depending on dirty checking
    do {
        dirty = this.$$digestOnce();
        // If scope is still dirty checking & ttl has hit 0
        // throw an exception
        if (dirty && !(ttl--)) {
            throw '10 digest iterations reached';
        }
    } while (dirty);
};

Scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        return newValue === oldValue || (typeof newValue === 'number' &&
            typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue));
    }
};

module.exports = Scope;
