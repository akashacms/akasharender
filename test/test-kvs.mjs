
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { kvtable } from '../dist/sqlite-kvs.js';
import { default as akasha } from '../dist/index.js';
const mahabhuta = akasha.mahabhuta;
import { assert } from 'chai';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

describe('SINGLE KVS ITEM', function() {

    let table;

    it('should create a kvs table', async function() {
        table = await kvtable('table1');
    });

    it('should store value in kvs table', async function() {
        let result;
        try {
            result = await table.put('key1', {
                value1: 'Here I am',
                value2: 'JH'
            });
        } catch (err) {
            console.error('ERROR', err.stack);
            throw err;
        }
        console.log(result);
    });

    it('should retrieve stored value', async function() {
        const value = await table.get('key1');
        // console.log(value);
        assert.equal(typeof value, 'object');
        assert.deepEqual(value, {
            value1: 'Here I am',
            value2: 'JH'
        });
    });

    it('should update with new value', async function() {
        await table.update('key1', {
            question: 'What is the ultimate question of life, the universe, and everything',
            answer: 42
        });
    });

    it('should retrieve updated value', async function() {
        const value = await table.get('key1');
        // console.log(value);
        assert.equal(typeof value, 'object');
        assert.deepEqual(value, {
            question: 'What is the ultimate question of life, the universe, and everything',
            answer: 42
        });
    });

    it('should delete the item', async function() {
        await table.delete('key1');
    });

    it('should not retrieve stored value', async function() {
        const value = await table.get('key1');
        // console.log(value);
        assert.ok(typeof value === 'undefined');
    });

    it('should not retrieve value for bad key', async function() {
        const value = await table.get('BAD22222B0NE');
        // console.log(value);
        assert.ok(typeof value === 'undefined');
    });

    it('should delete table', async function() {
        await table.drop();
    });

    // FAIL Try inserting with key = { object values }
    // FAIL Try inserting with key = [ array values ]
    // FAIL Try inserting with key = undefined
    // FAIL Try inserting with key = number
    // FAIL Try inserting with key = 'key' value = BAD
});

describe('MULTIPLE ITEMS', function() {

    let table;

    it('should create a kvs table', async function() {
        table = await kvtable('multi');
    });

    // Add multiple items all of same shape
    // Query with get
    // Try find({ fieldnm: 'value' })
    // Try find({ fidlenm: { eq: 'value' }})
    // Try find({ fidlenm: { gt: 'value' }})
    // Try find({ fidlenm: { lt: 'value' }})
    // Try find({ fidlenm: { like: '%value%' }})
    // Try find({ fidlenm: { regex: 'REGEX' }})
    // Try find({
    //      field1nm: 'value'
    //      field2nm: 'value'
    // })
    // Try find({
    //      field1nm: { eq: 'value' }
    //      field2nm: { lt: 'value' }
    // })
    // Try find({
    //      field1nm: { gt: 'value' }
    //      field2nm: { lt: 'value' }
    // })
    // Try find({
    //      field1nm: { eq: 'value' }
    //      field2nm: { like: '%value%' }
    // })
    // Try find({
    //      field1nm: { regex: 'REGEX' }
    //      field2nm: { lt: 'value' }
    // })
    // try find({
    //      or: [
    //          { field1nm: 'value' },
    //          { field2nm: 'value' },
    //      ]
    // })
    // try find({
    //      or: [
    //          { field1nm: 'value' },
    //          { field2nm: { eq: 'value' }},
    //      ]
    // })
    // try find({
    //      or: [
    //          { field1nm: 'value' },
    //          { field2nm: { gt: 'value' }},
    //      ]
    // })
    // try find({
    //      or: [
    //          { field1nm: 'value' },
    //          { field2nm: { lt: 'value' }},
    //      ]
    // })
    // try find({
    //      or: [
    //          { field1nm: 'value' },
    //          { field2nm: { like: 'value' }},
    //      ]
    // })
    // try find({
    //      or: [
    //          { field1nm: 'value' },
    //          { field2nm: { regex: 'REGEX' }},
    //      ]
    // })

    it('should delete table', async function() {
        await table.drop();
    });

});


describe('MULTIPLE TABLES', function() {

    let table1;
    let table2;

    it('should create kvs tables', async function() {
        table1 = await kvtable('multi1');
        table2 = await kvtable('multi2');
    });

    // Add items to table 1
    // Add items to table 2
    // Query table 1 items in table 1
    // Query table 2 items in table 2
    // FAIL Query table 1 items in table 2
    // FAIL Query table 2 items in table 1

    it('should delete tables', async function() {
        await table1.drop();
        await table2.drop();
    });

});
