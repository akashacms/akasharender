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
export function inferFormat(fileName, explicit) {
    if (explicit && explicit.trim() !== '') {
        const fmt = explicit.trim().toLowerCase();
        if (fmt === 'csv' || fmt === 'tsv' || fmt === 'yaml') {
            return fmt;
        }
        if (fmt === 'yml')
            return 'yaml';
        if (fmt === 'tab')
            return 'tsv';
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
function decorateRow(row, fields, columns, index) {
    return Object.assign({}, row, {
        fields,
        columns,
        index,
        rowNumber: index + 1,
    });
}
/**
 * Normalize an array of arrays (a headerless delimited file, or a YAML
 * array-of-arrays) into the row model.  Column names are positional
 * strings `"0"`, `"1"`, ….
 */
function fromArrayOfArrays(records) {
    let width = 0;
    for (const rec of records) {
        if (Array.isArray(rec) && rec.length > width)
            width = rec.length;
    }
    const columns = [];
    for (let i = 0; i < width; i++)
        columns.push(String(i));
    const rows = records.map((rec, index) => {
        const fields = Array.isArray(rec) ? rec.slice() : [rec];
        const named = {};
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
function fromArrayOfObjects(records) {
    const columns = [];
    for (const rec of records) {
        for (const key of Object.keys(rec)) {
            if (!columns.includes(key))
                columns.push(key);
        }
    }
    const rows = records.map((rec, index) => {
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
export function parseTableData(text, format, opts = {}) {
    if (format === 'yaml') {
        const doc = jsyaml.load(text);
        if (!Array.isArray(doc)) {
            throw new Error(`csv-table YAML data must be an array of rows, got ${typeof doc}`);
        }
        if (doc.length === 0) {
            return { columns: [], rows: [] };
        }
        // Decide between array-of-arrays and array-of-objects based on the
        // first element.
        if (Array.isArray(doc[0])) {
            return fromArrayOfArrays(doc);
        }
        if (doc[0] !== null && typeof doc[0] === 'object') {
            return fromArrayOfObjects(doc);
        }
        // Array of scalars: treat each scalar as a single-column row.
        return fromArrayOfArrays(doc.map((v) => [v]));
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
        });
        return fromArrayOfObjects(records);
    }
    else {
        const records = csvParseSync(text, {
            columns: false,
            delimiter,
            skip_empty_lines: true,
            relax_column_count: true,
        });
        return fromArrayOfArrays(records);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3N2LXRhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vbGliL2Nzdi10YWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFFSDs7Ozs7Ozs7OztHQVVHO0FBRUgsT0FBTyxFQUFFLEtBQUssSUFBSSxZQUFZLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2RCxPQUFPLEtBQUssTUFBTSxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLElBQUksTUFBTSxXQUFXLENBQUM7QUFnRDdCOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQ3ZCLFFBQWdCLEVBQ2hCLFFBQWlCO0lBRWpCLElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQztRQUNyQyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDMUMsSUFBSSxHQUFHLEtBQUssS0FBSyxJQUFJLEdBQUcsS0FBSyxLQUFLLElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFDO1lBQ25ELE9BQU8sR0FBRyxDQUFDO1FBQ2YsQ0FBQztRQUNELElBQUksR0FBRyxLQUFLLEtBQUs7WUFBRSxPQUFPLE1BQU0sQ0FBQztRQUNqQyxJQUFJLEdBQUcsS0FBSyxLQUFLO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsUUFBUSxHQUFHLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBQ0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDdkQsUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNWLEtBQUssTUFBTSxDQUFDO1FBQ1osS0FBSyxNQUFNO1lBQ1AsT0FBTyxLQUFLLENBQUM7UUFDakIsS0FBSyxPQUFPLENBQUM7UUFDYixLQUFLLE1BQU07WUFDUCxPQUFPLE1BQU0sQ0FBQztRQUNsQixLQUFLLE1BQU0sQ0FBQztRQUNaO1lBQ0ksT0FBTyxLQUFLLENBQUM7SUFDckIsQ0FBQztBQUNMLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsV0FBVyxDQUNoQixHQUF3QixFQUN4QixNQUFhLEVBQ2IsT0FBaUIsRUFDakIsS0FBYTtJQUViLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFO1FBQzFCLE1BQU07UUFDTixPQUFPO1FBQ1AsS0FBSztRQUNMLFNBQVMsRUFBRSxLQUFLLEdBQUcsQ0FBQztLQUN2QixDQUFnQixDQUFDO0FBQ3RCLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxpQkFBaUIsQ0FBQyxPQUFnQjtJQUN2QyxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDZCxLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ3hCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUs7WUFBRSxLQUFLLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUNyRSxDQUFDO0lBQ0QsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFO1FBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV4RCxNQUFNLElBQUksR0FBa0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNuRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEQsTUFBTSxLQUFLLEdBQXdCLEVBQUUsQ0FBQztRQUN0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3RDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEMsQ0FBQztRQUNELE9BQU8sV0FBVyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3RELENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUM3QixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsa0JBQWtCLENBQUMsT0FBOEI7SUFDdEQsTUFBTSxPQUFPLEdBQWEsRUFBRSxDQUFDO0lBQzdCLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7UUFDeEIsS0FBSyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDakMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO2dCQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbEQsQ0FBQztJQUNMLENBQUM7SUFDRCxNQUFNLElBQUksR0FBa0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUNuRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM5QyxPQUFPLFdBQVcsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDN0IsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQzFCLElBQVksRUFDWixNQUFzQixFQUN0QixPQUEwQixFQUFFO0lBRTVCLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRSxDQUFDO1FBQ3BCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDOUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN0QixNQUFNLElBQUksS0FBSyxDQUNYLHFEQUFxRCxPQUFPLEdBQUcsRUFBRSxDQUNwRSxDQUFDO1FBQ04sQ0FBQztRQUNELElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNuQixPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLENBQUM7UUFDckMsQ0FBQztRQUNELG1FQUFtRTtRQUNuRSxpQkFBaUI7UUFDakIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDeEIsT0FBTyxpQkFBaUIsQ0FBQyxHQUFjLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBQ0QsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDO1lBQ2hELE9BQU8sa0JBQWtCLENBQUMsR0FBNEIsQ0FBQyxDQUFDO1FBQzVELENBQUM7UUFDRCw4REFBOEQ7UUFDOUQsT0FBTyxpQkFBaUIsQ0FBRSxHQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQseUJBQXlCO0lBQ3pCLE1BQU0sU0FBUyxHQUFHLE9BQU8sSUFBSSxDQUFDLFNBQVMsS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFO1FBQ3pFLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUztRQUNoQixDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sTUFBTSxHQUFHLE9BQU8sSUFBSSxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUVyRSxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ1QsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRTtZQUMvQixPQUFPLEVBQUUsSUFBSTtZQUNiLFNBQVM7WUFDVCxnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLGtCQUFrQixFQUFFLElBQUk7U0FDM0IsQ0FBMEIsQ0FBQztRQUM1QixPQUFPLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7U0FBTSxDQUFDO1FBQ0osTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLElBQUksRUFBRTtZQUMvQixPQUFPLEVBQUUsS0FBSztZQUNkLFNBQVM7WUFDVCxnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLGtCQUFrQixFQUFFLElBQUk7U0FDM0IsQ0FBWSxDQUFDO1FBQ2QsT0FBTyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjUgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIENTVi9UU1YvWUFNTCBkYXRhLXRhYmxlIHBhcnNpbmcgZm9yIHRoZSBgPGNzdi10YWJsZT5gIGN1c3RvbSBlbGVtZW50LlxuICpcbiAqIFRoaXMgbW9kdWxlIGNvbnRhaW5zIHRoZSBwdXJlLCBzaWRlLWVmZmVjdC1mcmVlIGxvZ2ljIHRoYXQgdHVybnMgYSBkYXRhXG4gKiBmaWxlJ3MgdGV4dCBpbnRvIGEgbm9ybWFsaXplZCByb3cgbW9kZWwuICBJdCByZWFkcyBubyBmaWxlcyBhbmQgZG9lcyBub1xuICogcmVuZGVyaW5nLCBzbyBpdCBjYW4gYmUgdW5pdC10ZXN0ZWQgaW5kZXBlbmRlbnRseSBvZiB0aGUgcmVuZGVyaW5nXG4gKiBwaXBlbGluZS4gIERlbGltaXRlZCBmb3JtYXRzIChDU1YsIFRTVikgYXJlIHBhcnNlZCB3aXRoIHRoZSBtYXR1cmVcbiAqIGBjc3YtcGFyc2VgIHBhY2thZ2U7IFlBTUwgaXMgcGFyc2VkIHdpdGggYGpzLXlhbWxgLlxuICpcbiAqIEBtb2R1bGUgY3N2LXRhYmxlXG4gKi9cblxuaW1wb3J0IHsgcGFyc2UgYXMgY3N2UGFyc2VTeW5jIH0gZnJvbSAnY3N2LXBhcnNlL3N5bmMnO1xuaW1wb3J0ICogYXMganN5YW1sIGZyb20gJ2pzLXlhbWwnO1xuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJztcblxuLyoqXG4gKiBUaGUgc3VwcG9ydGVkIGRhdGEtZmlsZSBmb3JtYXRzLlxuICovXG5leHBvcnQgdHlwZSBDc3ZUYWJsZUZvcm1hdCA9ICdjc3YnIHwgJ3RzdicgfCAneWFtbCc7XG5cbi8qKlxuICogQSBzaW5nbGUgbm9ybWFsaXplZCBkYXRhIHJvdyBoYW5kZWQgdG8gdGhlIHBlci1yb3cgdGVtcGxhdGUuICBJbiBhZGRpdGlvblxuICogdG8gdGhlIG5hbWVkIGNvbHVtbiBmaWVsZHMgKHNwcmVhZCBpbiBhdCB0aGUgdG9wIGxldmVsKSwgZWFjaCByb3cgY2Fycmllc1xuICogcG9zaXRpb25hbCBhbmQgaW5kZXggaGVscGVycyBzbyB0ZW1wbGF0ZXMgY2FuIGRvIHBvc2l0aW9uYWwgYW5kXG4gKiBpbmRleC1iYXNlZCB3b3JrLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENzdlRhYmxlUm93IHtcbiAgICAvKiogUG9zaXRpb25hbCBhcnJheSBvZiB0aGUgcm93J3MgdmFsdWVzLCBpbiBjb2x1bW4gb3JkZXIuICovXG4gICAgZmllbGRzOiBhbnlbXTtcbiAgICAvKiogT3JkZXJlZCBjb2x1bW4tbmFtZSBsaXN0LiAgSWRlbnRpY2FsIGZvciBldmVyeSByb3cuICovXG4gICAgY29sdW1uczogc3RyaW5nW107XG4gICAgLyoqIDAtYmFzZWQgcm93IG51bWJlci4gKi9cbiAgICBpbmRleDogbnVtYmVyO1xuICAgIC8qKiAxLWJhc2VkIHJvdyBudW1iZXIuICovXG4gICAgcm93TnVtYmVyOiBudW1iZXI7XG4gICAgLyoqIE5hbWVkIGNvbHVtbiB2YWx1ZXMsIGUuZy4gYG5hbWVgLCBgY2l0eWAuICovXG4gICAgW2NvbHVtbjogc3RyaW5nXTogYW55O1xufVxuXG4vKipcbiAqIFRoZSByZXN1bHQgb2YgcGFyc2luZyBhIGRhdGEgZmlsZTogdGhlIG9yZGVyZWQgY29sdW1uIG5hbWVzIHBsdXMgdGhlXG4gKiBhcnJheSBvZiBub3JtYWxpemVkIHJvd3MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3N2VGFibGVEYXRhIHtcbiAgICBjb2x1bW5zOiBzdHJpbmdbXTtcbiAgICByb3dzOiBDc3ZUYWJsZVJvd1tdO1xufVxuXG4vKipcbiAqIE9wdGlvbnMgY29udHJvbGxpbmcgaG93IGRlbGltaXRlZCBkYXRhIGlzIHBhcnNlZC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQYXJzZVRhYmxlT3B0aW9ucyB7XG4gICAgLyoqIEZpZWxkIGRlbGltaXRlciBvdmVycmlkZS4gIERlZmF1bHRzIHRvIGAsYCBmb3IgY3N2IGFuZCBgXFx0YCBmb3IgdHN2LiAqL1xuICAgIGRlbGltaXRlcj86IHN0cmluZztcbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBmaXJzdCByZWNvcmQgb2YgYSBkZWxpbWl0ZWQgZmlsZSBpcyBhIGhlYWRlciByb3cgc3VwcGx5aW5nXG4gICAgICogY29sdW1uIG5hbWVzLiAgRGVmYXVsdHMgdG8gYHRydWVgLiAgSWdub3JlZCBmb3IgWUFNTC5cbiAgICAgKi9cbiAgICBoZWFkZXI/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIERldGVybWluZSB0aGUgZGF0YS1maWxlIGZvcm1hdC5cbiAqXG4gKiBBbiBleHBsaWNpdCBmb3JtYXQgc3RyaW5nIChmcm9tIHRoZSB0YWcncyBgZm9ybWF0YCBhdHRyaWJ1dGUpIHRha2VzXG4gKiBwcmVjZWRlbmNlLiAgT3RoZXJ3aXNlIHRoZSBmb3JtYXQgaXMgaW5mZXJyZWQgZnJvbSB0aGUgZmlsZSBleHRlbnNpb246XG4gKiBgLmNzdmAg4oaSIGNzdiwgYC50c3ZgL2AudGFiYCDihpIgdHN2LCBgLnlhbWxgL2AueW1sYCDihpIgeWFtbC4gIFVucmVjb2duaXplZFxuICogZXh0ZW5zaW9ucyBkZWZhdWx0IHRvIGNzdi5cbiAqXG4gKiBAcGFyYW0gZmlsZU5hbWUgVGhlIGRhdGEtZmlsZSBuYW1lICh1c2VkIGZvciBleHRlbnNpb24gaW5mZXJlbmNlKS5cbiAqIEBwYXJhbSBleHBsaWNpdCBBbiBleHBsaWNpdCBmb3JtYXQgZnJvbSB0aGUgYGZvcm1hdGAgYXR0cmlidXRlLCBpZiBhbnkuXG4gKiBAcmV0dXJucyBUaGUgcmVzb2x2ZWQge0BsaW5rIENzdlRhYmxlRm9ybWF0fS5cbiAqIEB0aHJvd3MgSWYgYGV4cGxpY2l0YCBpcyBhIG5vbi1lbXB0eSBidXQgdW5yZWNvZ25pemVkIGZvcm1hdCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmZlckZvcm1hdChcbiAgICBmaWxlTmFtZTogc3RyaW5nLFxuICAgIGV4cGxpY2l0Pzogc3RyaW5nXG4pOiBDc3ZUYWJsZUZvcm1hdCB7XG4gICAgaWYgKGV4cGxpY2l0ICYmIGV4cGxpY2l0LnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgY29uc3QgZm10ID0gZXhwbGljaXQudHJpbSgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChmbXQgPT09ICdjc3YnIHx8IGZtdCA9PT0gJ3RzdicgfHwgZm10ID09PSAneWFtbCcpIHtcbiAgICAgICAgICAgIHJldHVybiBmbXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGZtdCA9PT0gJ3ltbCcpIHJldHVybiAneWFtbCc7XG4gICAgICAgIGlmIChmbXQgPT09ICd0YWInKSByZXR1cm4gJ3Rzdic7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgY3N2LXRhYmxlIHVua25vd24gZm9ybWF0ICcke2V4cGxpY2l0fSdgKTtcbiAgICB9XG4gICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVOYW1lIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgIHN3aXRjaCAoZXh0KSB7XG4gICAgICAgIGNhc2UgJy50c3YnOlxuICAgICAgICBjYXNlICcudGFiJzpcbiAgICAgICAgICAgIHJldHVybiAndHN2JztcbiAgICAgICAgY2FzZSAnLnlhbWwnOlxuICAgICAgICBjYXNlICcueW1sJzpcbiAgICAgICAgICAgIHJldHVybiAneWFtbCc7XG4gICAgICAgIGNhc2UgJy5jc3YnOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICdjc3YnO1xuICAgIH1cbn1cblxuLyoqXG4gKiBBdHRhY2ggdGhlIHBvc2l0aW9uYWwvaW5kZXggaGVscGVyIGZpZWxkcyB0byBhIGJhcmUgcm93IG9iamVjdC5cbiAqL1xuZnVuY3Rpb24gZGVjb3JhdGVSb3coXG4gICAgcm93OiBSZWNvcmQ8c3RyaW5nLCBhbnk+LFxuICAgIGZpZWxkczogYW55W10sXG4gICAgY29sdW1uczogc3RyaW5nW10sXG4gICAgaW5kZXg6IG51bWJlclxuKTogQ3N2VGFibGVSb3cge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCByb3csIHtcbiAgICAgICAgZmllbGRzLFxuICAgICAgICBjb2x1bW5zLFxuICAgICAgICBpbmRleCxcbiAgICAgICAgcm93TnVtYmVyOiBpbmRleCArIDEsXG4gICAgfSkgYXMgQ3N2VGFibGVSb3c7XG59XG5cbi8qKlxuICogTm9ybWFsaXplIGFuIGFycmF5IG9mIGFycmF5cyAoYSBoZWFkZXJsZXNzIGRlbGltaXRlZCBmaWxlLCBvciBhIFlBTUxcbiAqIGFycmF5LW9mLWFycmF5cykgaW50byB0aGUgcm93IG1vZGVsLiAgQ29sdW1uIG5hbWVzIGFyZSBwb3NpdGlvbmFsXG4gKiBzdHJpbmdzIGBcIjBcImAsIGBcIjFcImAsIOKApi5cbiAqL1xuZnVuY3Rpb24gZnJvbUFycmF5T2ZBcnJheXMocmVjb3JkczogYW55W11bXSk6IENzdlRhYmxlRGF0YSB7XG4gICAgbGV0IHdpZHRoID0gMDtcbiAgICBmb3IgKGNvbnN0IHJlYyBvZiByZWNvcmRzKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHJlYykgJiYgcmVjLmxlbmd0aCA+IHdpZHRoKSB3aWR0aCA9IHJlYy5sZW5ndGg7XG4gICAgfVxuICAgIGNvbnN0IGNvbHVtbnM6IHN0cmluZ1tdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aDsgaSsrKSBjb2x1bW5zLnB1c2goU3RyaW5nKGkpKTtcblxuICAgIGNvbnN0IHJvd3M6IENzdlRhYmxlUm93W10gPSByZWNvcmRzLm1hcCgocmVjLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZHMgPSBBcnJheS5pc0FycmF5KHJlYykgPyByZWMuc2xpY2UoKSA6IFtyZWNdO1xuICAgICAgICBjb25zdCBuYW1lZDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9O1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbHVtbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG5hbWVkW2NvbHVtbnNbaV1dID0gZmllbGRzW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWNvcmF0ZVJvdyhuYW1lZCwgZmllbGRzLCBjb2x1bW5zLCBpbmRleCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgY29sdW1ucywgcm93cyB9O1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSBhbiBhcnJheSBvZiBvYmplY3RzIChhIGRlbGltaXRlZCBmaWxlIHdpdGggYSBoZWFkZXIgcm93LCBvciBhXG4gKiBZQU1MIGFycmF5LW9mLW9iamVjdHMpIGludG8gdGhlIHJvdyBtb2RlbC4gIENvbHVtbiBuYW1lcyBhcmUgdGhlIHVuaW9uIG9mXG4gKiB0aGUgb2JqZWN0cycga2V5cywgcHJlc2VydmluZyBmaXJzdC1zZWVuIG9yZGVyLlxuICovXG5mdW5jdGlvbiBmcm9tQXJyYXlPZk9iamVjdHMocmVjb3JkczogUmVjb3JkPHN0cmluZywgYW55PltdKTogQ3N2VGFibGVEYXRhIHtcbiAgICBjb25zdCBjb2x1bW5zOiBzdHJpbmdbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgcmVjIG9mIHJlY29yZHMpIHtcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMocmVjKSkge1xuICAgICAgICAgICAgaWYgKCFjb2x1bW5zLmluY2x1ZGVzKGtleSkpIGNvbHVtbnMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJvd3M6IENzdlRhYmxlUm93W10gPSByZWNvcmRzLm1hcCgocmVjLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCBmaWVsZHMgPSBjb2x1bW5zLm1hcCgoY29sKSA9PiByZWNbY29sXSk7XG4gICAgICAgIHJldHVybiBkZWNvcmF0ZVJvdyhyZWMsIGZpZWxkcywgY29sdW1ucywgaW5kZXgpO1xuICAgIH0pO1xuICAgIHJldHVybiB7IGNvbHVtbnMsIHJvd3MgfTtcbn1cblxuLyoqXG4gKiBQYXJzZSB0aGUgdGV4dCBvZiBhIGRhdGEgZmlsZSBpbnRvIHRoZSBub3JtYWxpemVkIHtAbGluayBDc3ZUYWJsZURhdGF9XG4gKiByb3cgbW9kZWwuXG4gKlxuICogRm9yIGRlbGltaXRlZCBmb3JtYXRzIChgY3N2YCwgYHRzdmApIHRoZSB0ZXh0IGlzIHBhcnNlZCB3aXRoIGBjc3YtcGFyc2VgLlxuICogV2hlbiBgaGVhZGVyYCBpcyB0cnVlICh0aGUgZGVmYXVsdCkgdGhlIGZpcnN0IHJlY29yZCBzdXBwbGllcyB0aGUgY29sdW1uXG4gKiBuYW1lcyBhbmQgZWFjaCBzdWJzZXF1ZW50IHJlY29yZCBiZWNvbWVzIGFuIG9iamVjdCBrZXllZCBieSB0aG9zZSBuYW1lcztcbiAqIHdoZW4gYGhlYWRlcmAgaXMgZmFsc2UsIGNvbHVtbnMgYXJlIHBvc2l0aW9uYWwgc3RyaW5ncyBhbmQgZWFjaCByb3cgaXNcbiAqIGtleWVkIGJ5IHBvc2l0aW9uLlxuICpcbiAqIEZvciBgeWFtbGAgdGhlIHRleHQgbXVzdCBwYXJzZSB0byBhbiBhcnJheSDigJQgZWl0aGVyIGFuIGFycmF5IG9mIG9iamVjdHNcbiAqICh1c2VkIGRpcmVjdGx5KSBvciBhbiBhcnJheSBvZiBhcnJheXMgKHRyZWF0ZWQgYXMgaGVhZGVybGVzcykuICBBIFlBTUxcbiAqIGRvY3VtZW50IHRoYXQgZG9lcyBub3QgcGFyc2UgdG8gYW4gYXJyYXkgaXMgYW4gZXJyb3IsIGJlY2F1c2UgdGhlXG4gKiBcInNlcmllcyBvZiByb3dzIG9mIHRoZSBzYW1lIHN0cnVjdHVyZVwiIGNvbnRyYWN0IGRvZXMgbm90IGhvbGQuXG4gKlxuICogQHBhcmFtIHRleHQgVGhlIHJhdyB0ZXh0IG9mIHRoZSBkYXRhIGZpbGUuXG4gKiBAcGFyYW0gZm9ybWF0IFRoZSBkYXRhLWZpbGUgZm9ybWF0LlxuICogQHBhcmFtIG9wdHMgRGVsaW1pdGVyIGFuZCBoZWFkZXIgb3B0aW9ucyBmb3IgZGVsaW1pdGVkIGZvcm1hdHMuXG4gKiBAcmV0dXJucyBUaGUgcGFyc2VkIHtAbGluayBDc3ZUYWJsZURhdGF9LlxuICogQHRocm93cyBJZiBZQU1MIGRvZXMgbm90IHBhcnNlIHRvIGFuIGFycmF5LCBvciBwYXJzaW5nIG90aGVyd2lzZSBmYWlscy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVGFibGVEYXRhKFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICBmb3JtYXQ6IENzdlRhYmxlRm9ybWF0LFxuICAgIG9wdHM6IFBhcnNlVGFibGVPcHRpb25zID0ge31cbik6IENzdlRhYmxlRGF0YSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gJ3lhbWwnKSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IGpzeWFtbC5sb2FkKHRleHQpO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkoZG9jKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIGBjc3YtdGFibGUgWUFNTCBkYXRhIG11c3QgYmUgYW4gYXJyYXkgb2Ygcm93cywgZ290ICR7dHlwZW9mIGRvY31gXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkb2MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4geyBjb2x1bW5zOiBbXSwgcm93czogW10gfTtcbiAgICAgICAgfVxuICAgICAgICAvLyBEZWNpZGUgYmV0d2VlbiBhcnJheS1vZi1hcnJheXMgYW5kIGFycmF5LW9mLW9iamVjdHMgYmFzZWQgb24gdGhlXG4gICAgICAgIC8vIGZpcnN0IGVsZW1lbnQuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRvY1swXSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmcm9tQXJyYXlPZkFycmF5cyhkb2MgYXMgYW55W11bXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRvY1swXSAhPT0gbnVsbCAmJiB0eXBlb2YgZG9jWzBdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuIGZyb21BcnJheU9mT2JqZWN0cyhkb2MgYXMgUmVjb3JkPHN0cmluZywgYW55PltdKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBBcnJheSBvZiBzY2FsYXJzOiB0cmVhdCBlYWNoIHNjYWxhciBhcyBhIHNpbmdsZS1jb2x1bW4gcm93LlxuICAgICAgICByZXR1cm4gZnJvbUFycmF5T2ZBcnJheXMoKGRvYyBhcyBhbnlbXSkubWFwKCh2KSA9PiBbdl0pKTtcbiAgICB9XG5cbiAgICAvLyBEZWxpbWl0ZWQ6IGNzdiBvciB0c3YuXG4gICAgY29uc3QgZGVsaW1pdGVyID0gdHlwZW9mIG9wdHMuZGVsaW1pdGVyID09PSAnc3RyaW5nJyAmJiBvcHRzLmRlbGltaXRlciAhPT0gJydcbiAgICAgICAgPyBvcHRzLmRlbGltaXRlclxuICAgICAgICA6IChmb3JtYXQgPT09ICd0c3YnID8gJ1xcdCcgOiAnLCcpO1xuICAgIGNvbnN0IGhlYWRlciA9IHR5cGVvZiBvcHRzLmhlYWRlciA9PT0gJ2Jvb2xlYW4nID8gb3B0cy5oZWFkZXIgOiB0cnVlO1xuXG4gICAgaWYgKGhlYWRlcikge1xuICAgICAgICBjb25zdCByZWNvcmRzID0gY3N2UGFyc2VTeW5jKHRleHQsIHtcbiAgICAgICAgICAgIGNvbHVtbnM6IHRydWUsXG4gICAgICAgICAgICBkZWxpbWl0ZXIsXG4gICAgICAgICAgICBza2lwX2VtcHR5X2xpbmVzOiB0cnVlLFxuICAgICAgICAgICAgcmVsYXhfY29sdW1uX2NvdW50OiB0cnVlLFxuICAgICAgICB9KSBhcyBSZWNvcmQ8c3RyaW5nLCBhbnk+W107XG4gICAgICAgIHJldHVybiBmcm9tQXJyYXlPZk9iamVjdHMocmVjb3Jkcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVjb3JkcyA9IGNzdlBhcnNlU3luYyh0ZXh0LCB7XG4gICAgICAgICAgICBjb2x1bW5zOiBmYWxzZSxcbiAgICAgICAgICAgIGRlbGltaXRlcixcbiAgICAgICAgICAgIHNraXBfZW1wdHlfbGluZXM6IHRydWUsXG4gICAgICAgICAgICByZWxheF9jb2x1bW5fY291bnQ6IHRydWUsXG4gICAgICAgIH0pIGFzIGFueVtdW107XG4gICAgICAgIHJldHVybiBmcm9tQXJyYXlPZkFycmF5cyhyZWNvcmRzKTtcbiAgICB9XG59XG4iXX0=