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
export declare function inferFormat(fileName: string, explicit?: string): CsvTableFormat;
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
export declare function parseTableData(text: string, format: CsvTableFormat, opts?: ParseTableOptions): CsvTableData;
//# sourceMappingURL=csv-table.d.ts.map