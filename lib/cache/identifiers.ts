// This is borrowed from SQLITE3ORM, which
// is under the MIT License as so:

// The MIT License (MIT)

// Copyright (c) 2016-2021 Guenter Sandner

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// -----------------------------------------------------------------

export function quoteSimpleIdentifier(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

export function backtickQuoteSimpleIdentifier(name: string): string {
  return '`' + name.replace(/`/g, '``') + '`';
}

// -----------------------------------------------------------------

export function quoteIdentifiers(name: string): string[] {
  return name.split('.').map((value) => quoteSimpleIdentifier(value));
}

export function quoteIdentifier(name: string): string {
  return quoteIdentifiers(name).join('.');
}

// -----------------------------------------------------------------

export function unqualifyIdentifier(name: string): string {
  return name.split('.').pop() as string;
}

export function quoteAndUnqualifyIdentifier(name: string): string {
  return quoteSimpleIdentifier(unqualifyIdentifier(name));
}

// -----------------------------------------------------------------

export function qualifiySchemaIdentifier(name: string, schema?: string): string {
  if (name.indexOf('.') !== -1) {
    /* istanbul ignore if */
    if (schema && name.split('.').shift() !== schema) {
      throw new Error(`failed to qualify '${name}' by '${schema}`);
    }
    return name;
  }
  // What is this for?  The definition comes
  // from the original SQLITE3ORM code
  // schema = schema || SQL_DEFAULT_SCHEMA;
  return `${schema}.${name}`;
}

export function splitSchemaIdentifier(name: string): {
  identName: string;
  identSchema?: string;
} {
  const identifiers = name.split('.');

  if (identifiers.length >= 2) {
    return {
      identSchema: identifiers.shift(),
      identName: identifiers.join('.'),
    };
  } else {
    return { identName: identifiers[0] };
  }
}
