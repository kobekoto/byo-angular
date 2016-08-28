'use strict';

var Scope = require('../src/scope');

describe('Scope', function() {

    it('can be constructed and used as an object', function() {
        // Creates a new Scope and adds random property
        var scope = new Scope();
        scope.aProperty = 1;

        //checks that scope.aProperty is 1
        expect(scope.aProperty).toBe(1);
    });

    describe('digest', function() {

        var scope;

        // initializes a new scope before each test
        beforeEach(function() {
            scope = new Scope();
        });

        it('calls the listener function of a watch on first $digest', function() {
            // For now watchFn is simply returning a string
            var watchFn = function() {
                return 'wat';
            };
            // jasmine.createSpy creates a callable function (a mock function)
            var listenerFn = jasmine.createSpy();

            scope.$watch(watchFn, listenerFn);


            scope.$digest();
            // After we call scope.$digest we're expecting to check that the 
            // listenerFn was actually called
            expect(listenerFn).toHaveBeenCalled();
        });

        it('calls the watch function with the scope as the argument', function() {
            // creates a mock function that has the ability to be called.
            var watchFn = jasmine.createSpy();
            var listenerFn = function() { };
            scope.$watch(watchFn, listenerFn);

            scope.$digest();

            // expects the watchFn to be called with scope
            expect(watchFn).toHaveBeenCalledWith(scope);
        });

        it('calls the listener function when the watched value changes', function() {
            scope.someValue = 'a';
            scope.counter = 0;

            scope.$watch(
                // scope.someValue is being watched
                // remember this is the watchFn
                function(scope) { 
                    return scope.someValue; 
                },
                // when scope.someValue changes we increment scope.counter
                // remember this is the listener fn
                // Here it knows the new and old value of the watcher as well as passes scope as an argument
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            //scope.counter here is supposed to be 0 because we have not 
            // called scope.$watch yet!!!
            expect(scope.counter).toBe(0);

            // Once we call scope.$digest once we expect the counter to be incremented
            scope.$digest();
            expect(scope.counter).toBe(1);

            // Here scope.$digest isn't incremented because scope.someValue hasn't changed.
            scope.$digest();
            expect(scope.counter).toBe(1);

            // We change scope.someValue here
            scope.someValue = 'b';
            //scope.counter doesn't change because scope.watch nor scope.$digest have changed.
            expect(scope.counter).toBe(1);

            scope.$digest();
            // Once we call scope.$digest, it knows that scope.someValue has changed so it increments scope.counter;
            expect(scope.counter).toBe(2);

        });


    });

});
