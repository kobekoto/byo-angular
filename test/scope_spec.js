'use strict';

var Scope = require('..src/scope');

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

    });

});
