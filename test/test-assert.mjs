/**
 * Chai-compatible assertion helpers implemented on top of node:assert.
 *
 * This module exists to support the migration from Mocha/Chai to the
 * Node.js built-in test runner (node:test).  It exposes the subset of
 * the Chai `assert` interface used by the AkashaRender test suite,
 * implemented entirely with `node:assert/strict`.  This lets the
 * existing test bodies remain unchanged while removing the runtime
 * dependency on Chai.
 *
 * Only the methods actually used by the test suite are provided.  If a
 * new test needs an additional Chai assertion, add it here.
 */

import nodeAssert from 'node:assert';

function fail(message) {
    nodeAssert.fail(message);
}

export const assert = {

    // Equality
    equal(actual, expected, message) {
        // Chai assert.equal is non-strict (==).  Use loose comparison
        // to preserve the original semantics.
        nodeAssert.equal(actual, expected, message);
    },
    notEqual(actual, expected, message) {
        nodeAssert.notEqual(actual, expected, message);
    },
    deepEqual(actual, expected, message) {
        nodeAssert.deepEqual(actual, expected, message);
    },

    // Truthiness
    ok(value, message) {
        nodeAssert.ok(value, message);
    },
    isOk(value, message) {
        nodeAssert.ok(value, message);
    },
    isNotOk(value, message) {
        nodeAssert.ok(!value, message);
    },
    isTrue(value, message) {
        nodeAssert.equal(value, true, message);
    },
    isFalse(value, message) {
        nodeAssert.equal(value, false, message);
    },

    // Existence (not null and not undefined)
    exists(value, message) {
        nodeAssert.ok(
            value !== null && value !== undefined,
            message ?? `expected value to exist`
        );
    },
    notExists(value, message) {
        nodeAssert.ok(
            value === null || value === undefined,
            message ?? `expected value to not exist`
        );
    },
    isDefined(value, message) {
        nodeAssert.ok(
            typeof value !== 'undefined',
            message ?? `expected value to be defined`
        );
    },
    isUndefined(value, message) {
        nodeAssert.equal(typeof value, 'undefined', message);
    },

    // Types
    isArray(value, message) {
        nodeAssert.ok(
            Array.isArray(value),
            message ?? `expected ${typeof value} to be an array`
        );
    },
    isString(value, message) {
        nodeAssert.equal(typeof value, 'string', message);
    },
    isBoolean(value, message) {
        nodeAssert.equal(typeof value, 'boolean', message);
    },
    isObject(value, message) {
        nodeAssert.ok(
            value !== null
            && typeof value === 'object'
            && !Array.isArray(value),
            message ?? `expected ${typeof value} to be an object`
        );
    },

    // Inclusion: substring for strings, membership for arrays,
    // property containment for objects (matching Chai semantics).
    include(haystack, needle, message) {
        if (typeof haystack === 'string') {
            nodeAssert.ok(
                haystack.includes(needle),
                message ?? `expected "${haystack}" to include "${needle}"`
            );
        } else if (Array.isArray(haystack)) {
            nodeAssert.ok(
                haystack.includes(needle),
                message ?? `expected array to include ${needle}`
            );
        } else if (haystack && typeof haystack === 'object') {
            for (const [key, val] of Object.entries(needle)) {
                nodeAssert.equal(haystack[key], val, message);
            }
        } else {
            fail(message ?? `cannot check inclusion on ${typeof haystack}`);
        }
    },

    // Regular expression matching
    match(value, regexp, message) {
        nodeAssert.match(String(value), regexp, message);
    },
    notMatch(value, regexp, message) {
        nodeAssert.doesNotMatch(String(value), regexp, message);
    },

    // Exceptions
    throws(fn, matcher, message) {
        // Chai signatures used: throws(fn), throws(fn, /regexp/),
        // throws(fn, errorLike), throws(fn, 'substring of message').
        //
        // In Chai, a string second argument is matched as a SUBSTRING
        // of the thrown error's message.  node:assert instead treats a
        // string as the assertion message, so translate a string
        // matcher into a predicate that checks message inclusion.
        if (typeof matcher === 'string') {
            const needle = matcher;
            nodeAssert.throws(fn, (err) => {
                nodeAssert.ok(
                    err instanceof Error
                    && typeof err.message === 'string'
                    && err.message.includes(needle),
                    message
                        ?? `expected error message to include "${needle}"`
                );
                return true;
            });
        } else if (typeof matcher === 'undefined') {
            nodeAssert.throws(fn);
        } else {
            nodeAssert.throws(fn, matcher, message);
        }
    },

    // Generic failure
    fail
};

export default assert;
