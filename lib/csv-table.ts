/**
 *
 * Copyright 2014-2025 David Herron
 *
 * This file is part of AkashaCMS (http://akashacms.com/).
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * CSV/TSV/YAML data-table parsing for the `<csv-table>` custom element.
 *
 * This module contains the pure, side-effect-free logic that turns a data
 * file's text into a normalized row model.  It reads no files and does no
 * rendering, so it can be unit-tested independently of the rendering
 * pipeline.  Delimited formats (CSV, TSV) are parsed with the mature
 * `csv-parse` package; YAML is parsed with `js-yaml`.
 *
 * @module csv-table
 */

import { parse as csvParseSync } from 'csv-parse/sync';
import * as jsyaml from 'js-yaml';
import path from 'node:path';

/**
 * The supported data-file formats.
 */
export type CsvTableFormat = 'csv' | 'tsv' | 'yaml';

/**
 * A single normalized data row handed to the per-row template.  In addition
 * to the named column fields (spread in at the top level), each row carries
 * positional and index helpers so templates can do positional and
 * index-based work.
 */
export interface CsvTableRow {
    /** Positional array of the row's values, in column order. */
    fields: any[];
    /** Ordered column-name list.  Identical for every row. */
    columns: string[];
    /** 0-based row number. */
    index: number;
    /** 1-based row number. */
    rowNumber: number;
    /** Named column values, e.g. `name`, `city`. */
    [column: string]: any;
}

/**
 * The result of parsing a data file: the ordered column names plus the
 * array of normalized rows.
 */
export interface CsvTableData {
    columns: string[];
    rows: CsvTableRow[];
}

/**
 * Options controlling how delimited data is parsed.
 */
export interface ParseTableOptions {
    /** Field delimiter override.  Defaults to `,` for csv and `\t` for tsv. */
    delimiter?: string;
    /**
     * Whether the first record of a delimited file is a header row supplying
     * column names.  Defaults to `true`.  Ignored for YAML.
     */
    header?: boolean;
}

/**
 * Determine the data-file format.
 *
 * An explicit format string (from the tag's `format` attribute) takes
 * precedence.  Otherwise the format is inferred from the file extension:
 * `.csv` → csv, `.tsv`/`.tab` → tsv, `.yaml`/`.yml` → yaml.  Unrecognized
 * extensions default to csv.
 *
 * @param fileName The data-file name (used for extension inference).
 * @param explicit An explicit format from the `format` attribute, if any.
 * @returns The resolved {@link CsvTableFormat}.
 * @throws If `explicit` is a non-empty but unrecognized format string.
 */
export function inferFormat(
    fileName: string,
    explicit?: string
): CsvTableFormat {
    if (explicit && explicit.trim() !== '') {
        const fmt = explicit.trim().toLowerCase();
        if (fmt === 'csv' || fmt === 'tsv' || fmt === 'yaml') {
            return fmt;
        }
        if (fmt === 'yml') return 'yaml';
        if (fmt === 'tab') return 'tsv';
        throw new Error(`csv-table unknown format '${explicit}'`);
    }
    const ext = path.extname(fileName || '').toLowerCase();
    switch (ext) {
        case '.tsv':
        case '.tab':
            return 'tsv';
        case '.yaml':
        case '.yml':
            return 'yaml';
        case '.csv':
        default:
            return 'csv';
    }
}

/**
 * Attach the positional/index helper fields to a bare row object.
 */
function decorateRow(
    row: Record<string, any>,
    fields: any[],
    columns: string[],
    index: number
): CsvTableRow {
    return Object.assign({}, row, {
        fields,
        columns,
        index,
        rowNumber: index + 1,
    }) as CsvTableRow;
}

/**
 * Normalize an array of arrays (a headerless delimited file, or a YAML
 * array-of-arrays) into the row model.  Column names are positional
 * strings `"0"`, `"1"`, ….
 */
function fromArrayOfArrays(records: any[][]): CsvTableData {
    let width = 0;
    for (const rec of records) {
        if (Array.isArray(rec) && rec.length > width) width = rec.length;
    }
    const columns: string[] = [];
    for (let i = 0; i < width; i++) columns.push(String(i));

    const rows: CsvTableRow[] = records.map((rec, index) => {
        const fields = Array.isArray(rec) ? rec.slice() : [rec];
        const named: Record<string, any> = {};
        for (let i = 0; i < columns.length; i++) {
            named[columns[i]] = fields[i];
        }
        return decorateRow(named, fields, columns, index);
    });
    return { columns, rows };
}

/**
 * Normalize an array of objects (a delimited file with a header row, or a
 * YAML array-of-objects) into the row model.  Column names are the union of
 * the objects' keys, preserving first-seen order.
 */
function fromArrayOfObjects(records: Record<string, any>[]): CsvTableData {
    const columns: string[] = [];
    for (const rec of records) {
        for (const key of Object.keys(rec)) {
            if (!columns.includes(key)) columns.push(key);
        }
    }
    const rows: CsvTableRow[] = records.map((rec, index) => {
        const fields = columns.map((col) => rec[col]);
        return decorateRow(rec, fields, columns, index);
    });
    return { columns, rows };
}

/**
 * Parse the text of a data file into the normalized {@link CsvTableData}
 * row model.
 *
 * For delimited formats (`csv`, `tsv`) the text is parsed with `csv-parse`.
 * When `header` is true (the default) the first record supplies the column
 * names and each subsequent record becomes an object keyed by those names;
 * when `header` is false, columns are positional strings and each row is
 * keyed by position.
 *
 * For `yaml` the text must parse to an array — either an array of objects
 * (used directly) or an array of arrays (treated as headerless).  A YAML
 * document that does not parse to an array is an error, because the
 * "series of rows of the same structure" contract does not hold.
 *
 * @param text The raw text of the data file.
 * @param format The data-file format.
 * @param opts Delimiter and header options for delimited formats.
 * @returns The parsed {@link CsvTableData}.
 * @throws If YAML does not parse to an array, or parsing otherwise fails.
 */
export function parseTableData(
    text: string,
    format: CsvTableFormat,
    opts: ParseTableOptions = {}
): CsvTableData {
    if (format === 'yaml') {
        const doc = jsyaml.load(text);
        if (!Array.isArray(doc)) {
            throw new Error(
                `csv-table YAML data must be an array of rows, got ${typeof doc}`
            );
        }
        if (doc.length === 0) {
            return { columns: [], rows: [] };
        }
        // Decide between array-of-arrays and array-of-objects based on the
        // first element.
        if (Array.isArray(doc[0])) {
            return fromArrayOfArrays(doc as any[][]);
        }
        if (doc[0] !== null && typeof doc[0] === 'object') {
            return fromArrayOfObjects(doc as Record<string, any>[]);
        }
        // Array of scalars: treat each scalar as a single-column row.
        return fromArrayOfArrays((doc as any[]).map((v) => [v]));
    }

    // Delimited: csv or tsv.
    const delimiter = typeof opts.delimiter === 'string' && opts.delimiter !== ''
        ? opts.delimiter
        : (format === 'tsv' ? '\t' : ',');
    const header = typeof opts.header === 'boolean' ? opts.header : true;

    if (header) {
        const records = csvParseSync(text, {
            columns: true,
            delimiter,
            skip_empty_lines: true,
            relax_column_count: true,
        }) as Record<string, any>[];
        return fromArrayOfObjects(records);
    } else {
        const records = csvParseSync(text, {
            columns: false,
            delimiter,
            skip_empty_lines: true,
            relax_column_count: true,
        }) as any[][];
        return fromArrayOfArrays(records);
    }
}
