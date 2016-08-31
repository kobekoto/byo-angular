'use strict';

var _ = require('lodash');
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
            var listenerFn = function() {};
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
            //scope.counter doesn't change because scope.watch nor scope.$digest have been run.
            expect(scope.counter).toBe(1);

            scope.$digest();
            // Once we call scope.$digest, it knows that scope.someValue has changed so it increments scope.counter;
            expect(scope.counter).toBe(2);

        });

        // Here we are testing to see that we call the listener function 
        // even if the first legitimate value is undefined. Remember - from the last test 
        // watcher.last is always undefined initially.
        it('calls listener when watch value is first undefined', function() {
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.someValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            // The test will pass once we initialize watcher.last attribute to something unique
            expect(scope.counter).toBe(1);
        });

        it('calls the listener with new value as old value the first time', function() {
            scope.someValue = 123;
            var oldValueGiven;

            scope.$watch(
                function(scope) {
                    return scope.someValue;
                },
                function(newValue, oldValue, scope) {

                    oldValueGiven = oldValue;
                }
            );

            scope.$digest();
            expect(oldValueGiven).toBe(123);
        });

        it('may have watchers that omit the listener function', function() {
            var watchFn = jasmine.createSpy().and.returnValue('something');
            //Usually we call $watch with watchFn and listenerFn
            // because we've omitted listenerFn here, when we call $scope.watch and it's
            // missing the listenerFn as an argument, it will throw an exception
            scope.$watch(watchFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalled();
        });

        it('triggers chained watchers in the same digest', function() {
            scope.name = 'Jane';

            scope.$watch(
                function(scope) {
                    // scope.nameUpper is being watched here, but this is after we watch scope.name
                    // Note: this is what we're expecting
                    return scope.nameUpper;
                },
                function(newValue, oldValue, scope) {
                    if (newValue) {
                        // the listenerFn assigns initial based on scope.nameUpper as that's the watchFn
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            );

            scope.$watch(
                function(scope) {
                    // scope.name is being watched her
                    return scope.name;
                },
                function(newValue, oldValue, scope) {
                    if (newValue) {
                        // when scope.name is being watched we are uppercasing scope.nameUpper 
                        // which in turn eventually updates scope.initial
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );

            scope.$digest();
            expect(scope.initial).toBe('J.');

            scope.name = 'Bob';
            scope.$digest();
            // Because we've run digest scope.nameUpper will be uppercased
            // scope.initial is now B because scope.nameUpper is BOB
            expect(scope.initial).toBe('B.');

        });

        it('gives up on the watches after 10 iterations', function() {
            scope.counterA = 0;
            scope.counterB = 0;

            scope.$watch(
                function(scope) {
                    // Step 1: 1st iteration scope.counterA is 0
                    // Step 5: scope.counter A is 1 and so forth...
                    return scope.counterA;
                },
                function(newValue, oldValue, scope) {
                    // Step 2: counterB will increment once
                    scope.counterB++;
                }
            );

            scope.$watch(
                function(scope) {
                    // Step 3: counterB is now 1
                    return scope.counterB;
                },
                function(newValue, oldValue, scope) {
                    // Step 4: scope.counterA will increment 1
                    scope.counterA++;
                }
            );

            // Repeat Steps 1-5, meaning really because the two functions are watching 
            // each other this test will never stop running

            expect((function() { scope.$digest(); })).toThrow();

        });

        it('ends the digest when the last watch is clean', function() {

            // Creates an array 0 to 99;
            scope.array = _.range(100);
            var watchExecutions = 0;

            // Then we attach 100 watches, with each of them watching a single item 
            // in the array. 
            _.times(100, function(i) {
                scope.$watch(
                    function(scope) {
                        // watchExecutions keeps track of how many times we've 
                        // executed a watcher
                        watchExecutions++;
                        return scope.array[i];
                    },
                    function(newValue, oldValue, scope) {

                    }
                );
            });

            // TODO: Explain why in-depth the scope.$digest runs scope.$watch twice here
            scope.$digest();
            expect(watchExecutions).toBe(200);

            scope.array[0] = 420;
            scope.$digest();
            // Here we are expecting watchExecutions to equal 301 instead of the usual expectation 
            // that it would equal 400 because scope.$watch is run twice
            expect(watchExecutions).toBe(301);

        });

        it('does not end digest so that new watches are not run', function() {

            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function(scope) {
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    // Here we are adding a watch from the listener of another watch
                    scope.$watch(
                        function(scope) {
                            return scope.aValue;
                        },
                        function(newValue, oldValue, scope) {
                            scope.counter++;
                        }
                    );
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it('compares based on value if enabled', function() {
            scope.aValue = [1, 2, 3];
            scope.counter = 0;

            scope.$watch(
                function(scope) { 
                    return scope.aValue;
                },
                function(newValue, oldValue, scope) {
                    scope.counter++;
                },
                // We're adding a boolean flag to check values by VALUE, not reference
                true
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.aValue.push(4);
            scope.$digest();
            // Here we're expecting scope.counter to always increment
            // When we push an item to an array.
            expect(scope.counter).toBe(2);
        });

    });

});
