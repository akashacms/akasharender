
import { describe, it } from 'node:test';
import { assert } from './test-assert.mjs';
import * as akasha from '../dist/index.js';

const { inferFormat, parseTableData } = akasha;

describe('csv-table parser: inferFormat', function() {
    it('should infer csv from extension', function() {
        assert.equal(inferFormat('people.csv'), 'csv');
    });
    it('should infer tsv from extension', function() {
        assert.equal(inferFormat('people.tsv'), 'tsv');
        assert.equal(inferFormat('people.tab'), 'tsv');
    });
    it('should infer yaml from extension', function() {
        assert.equal(inferFormat('people.yaml'), 'yaml');
        assert.equal(inferFormat('people.yml'), 'yaml');
    });
    it('should default unknown extension to csv', function() {
        assert.equal(inferFormat('people.dat'), 'csv');
        assert.equal(inferFormat('people'), 'csv');
    });
    it('should honor explicit format overriding extension', function() {
        assert.equal(inferFormat('people.csv', 'yaml'), 'yaml');
        assert.equal(inferFormat('people.txt', 'tsv'), 'tsv');
        assert.equal(inferFormat('people.txt', 'yml'), 'yaml');
        assert.equal(inferFormat('people.txt', 'tab'), 'tsv');
    });
    it('should throw on unrecognized explicit format', function() {
        assert.throws(() => inferFormat('people.csv', 'json'));
    });
});

describe('csv-table parser: CSV', function() {
    it('should parse CSV with a header row', function() {
        const { columns, rows } = parseTableData(
            'name,city\nAlice,Oslo\nBob,Rio', 'csv', {});
        assert.deepEqual(columns, ['name', 'city']);
        assert.equal(rows.length, 2);
        assert.equal(rows[0].name, 'Alice');
        assert.equal(rows[0].city, 'Oslo');
        assert.deepEqual(rows[0].fields, ['Alice', 'Oslo']);
        assert.deepEqual(rows[0].columns, ['name', 'city']);
        assert.equal(rows[0].index, 0);
        assert.equal(rows[0].rowNumber, 1);
        assert.equal(rows[1].index, 1);
        assert.equal(rows[1].rowNumber, 2);
    });

    it('should parse CSV without a header row', function() {
        const { columns, rows } = parseTableData(
            'Alice,Oslo\nBob,Rio', 'csv', { header: false });
        assert.deepEqual(columns, ['0', '1']);
        assert.equal(rows.length, 2);
        assert.deepEqual(rows[0].fields, ['Alice', 'Oslo']);
        assert.equal(rows[0]['0'], 'Alice');
        assert.equal(rows[0]['1'], 'Oslo');
    });

    it('should handle quoted fields with embedded delimiters, newlines, escaped quotes', function() {
        const text = 'name,note\n'
            + '"Bob","Rio, RJ"\n'
            + '"Carol","line1\nline2"\n'
            + '"Dan","say ""hi"""\n';
        const { columns, rows } = parseTableData(text, 'csv', {});
        assert.deepEqual(columns, ['name', 'note']);
        assert.equal(rows.length, 3);
        assert.equal(rows[0].note, 'Rio, RJ');
        assert.equal(rows[1].note, 'line1\nline2');
        assert.equal(rows[2].note, 'say "hi"');
    });

    it('should honor a delimiter override', function() {
        const { columns, rows } = parseTableData(
            'name;city\nAlice;Oslo', 'csv', { delimiter: ';' });
        assert.deepEqual(columns, ['name', 'city']);
        assert.equal(rows[0].city, 'Oslo');
    });
});

describe('csv-table parser: TSV', function() {
    it('should parse TSV like CSV with a tab delimiter', function() {
        const { columns, rows } = parseTableData(
            'name\tcity\nAlice\tOslo', 'tsv', {});
        assert.deepEqual(columns, ['name', 'city']);
        assert.equal(rows[0].name, 'Alice');
        assert.equal(rows[0].city, 'Oslo');
    });
});

describe('csv-table parser: YAML', function() {
    it('should parse a YAML array of objects', function() {
        const text = '- name: Alice\n  city: Oslo\n- name: Bob\n  city: Rio';
        const { columns, rows } = parseTableData(text, 'yaml', {});
        assert.deepEqual(columns, ['name', 'city']);
        assert.equal(rows.length, 2);
        assert.equal(rows[1].name, 'Bob');
        assert.deepEqual(rows[1].fields, ['Bob', 'Rio']);
        assert.equal(rows[1].rowNumber, 2);
    });

    it('should parse a YAML array of arrays as headerless', function() {
        const text = '- [Alice, Oslo]\n- [Bob, Rio]';
        const { columns, rows } = parseTableData(text, 'yaml', {});
        assert.deepEqual(columns, ['0', '1']);
        assert.deepEqual(rows[0].fields, ['Alice', 'Oslo']);
    });

    it('should throw when YAML does not parse to an array', function() {
        assert.throws(() => parseTableData('name: Alice\ncity: Oslo', 'yaml', {}));
        assert.throws(() => parseTableData('just a scalar', 'yaml', {}));
    });

    it('should return empty for an empty YAML array', function() {
        const { columns, rows } = parseTableData('[]', 'yaml', {});
        assert.deepEqual(columns, []);
        assert.equal(rows.length, 0);
    });
});
