// // This is borrowed from SQLITE3ORM, which
// // is under the MIT License as so:
export {};
// // The MIT License (MIT)
// // Copyright (c) 2016-2021 Guenter Sandner
// // Permission is hereby granted, free of charge, to any person obtaining a copy
// // of this software and associated documentation files (the "Software"), to deal
// // in the Software without restriction, including without limitation the rights
// // to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// // copies of the Software, and to permit persons to whom the Software is
// // furnished to do so, subject to the following conditions:
// // The above copyright notice and this permission notice shall be included in all
// // copies or substantial portions of the Software.
// // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// // IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// // FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// // AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// // LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// // OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// // SOFTWARE.
// // -----------------------------------------------------------------
// export function quoteSimpleIdentifier(name: string): string {
//   return '"' + name.replace(/"/g, '""') + '"';
// }
// export function backtickQuoteSimpleIdentifier(name: string): string {
//   return '`' + name.replace(/`/g, '``') + '`';
// }
// // -----------------------------------------------------------------
// export function quoteIdentifiers(name: string): string[] {
//   return name.split('.').map((value) => quoteSimpleIdentifier(value));
// }
// export function quoteIdentifier(name: string): string {
//   return quoteIdentifiers(name).join('.');
// }
// // -----------------------------------------------------------------
// export function unqualifyIdentifier(name: string): string {
//   return name.split('.').pop() as string;
// }
// export function quoteAndUnqualifyIdentifier(name: string): string {
//   return quoteSimpleIdentifier(unqualifyIdentifier(name));
// }
// // -----------------------------------------------------------------
// export function qualifiySchemaIdentifier(name: string, schema?: string): string {
//   if (name.indexOf('.') !== -1) {
//     /* istanbul ignore if */
//     if (schema && name.split('.').shift() !== schema) {
//       throw new Error(`failed to qualify '${name}' by '${schema}`);
//     }
//     return name;
//   }
//   // What is this for?  The definition comes
//   // from the original SQLITE3ORM code
//   // schema = schema || SQL_DEFAULT_SCHEMA;
//   return `${schema}.${name}`;
// }
// export function splitSchemaIdentifier(name: string): {
//   identName: string;
//   identSchema?: string;
// } {
//   const identifiers = name.split('.');
//   if (identifiers.length >= 2) {
//     return {
//       identSchema: identifiers.shift(),
//       identName: identifiers.join('.'),
//     };
//   } else {
//     return { identName: identifiers[0] };
//   }
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWRlbnRpZmllcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvaWRlbnRpZmllcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDO0FBQzdDLHFDQUFxQzs7QUFFckMsMkJBQTJCO0FBRTNCLDZDQUE2QztBQUU3QyxrRkFBa0Y7QUFDbEYsbUZBQW1GO0FBQ25GLGtGQUFrRjtBQUNsRiwrRUFBK0U7QUFDL0UsMkVBQTJFO0FBQzNFLDhEQUE4RDtBQUU5RCxvRkFBb0Y7QUFDcEYscURBQXFEO0FBRXJELGdGQUFnRjtBQUNoRiw4RUFBOEU7QUFDOUUsaUZBQWlGO0FBQ2pGLDRFQUE0RTtBQUM1RSxtRkFBbUY7QUFDbkYsbUZBQW1GO0FBQ25GLGVBQWU7QUFFZix1RUFBdUU7QUFFdkUsZ0VBQWdFO0FBQ2hFLGlEQUFpRDtBQUNqRCxJQUFJO0FBRUosd0VBQXdFO0FBQ3hFLGlEQUFpRDtBQUNqRCxJQUFJO0FBRUosdUVBQXVFO0FBRXZFLDZEQUE2RDtBQUM3RCx5RUFBeUU7QUFDekUsSUFBSTtBQUVKLDBEQUEwRDtBQUMxRCw2Q0FBNkM7QUFDN0MsSUFBSTtBQUVKLHVFQUF1RTtBQUV2RSw4REFBOEQ7QUFDOUQsNENBQTRDO0FBQzVDLElBQUk7QUFFSixzRUFBc0U7QUFDdEUsNkRBQTZEO0FBQzdELElBQUk7QUFFSix1RUFBdUU7QUFFdkUsb0ZBQW9GO0FBQ3BGLG9DQUFvQztBQUNwQywrQkFBK0I7QUFDL0IsMERBQTBEO0FBQzFELHNFQUFzRTtBQUN0RSxRQUFRO0FBQ1IsbUJBQW1CO0FBQ25CLE1BQU07QUFDTiwrQ0FBK0M7QUFDL0MseUNBQXlDO0FBQ3pDLDhDQUE4QztBQUM5QyxnQ0FBZ0M7QUFDaEMsSUFBSTtBQUVKLHlEQUF5RDtBQUN6RCx1QkFBdUI7QUFDdkIsMEJBQTBCO0FBQzFCLE1BQU07QUFDTix5Q0FBeUM7QUFFekMsbUNBQW1DO0FBQ25DLGVBQWU7QUFDZiwwQ0FBMEM7QUFDMUMsMENBQTBDO0FBQzFDLFNBQVM7QUFDVCxhQUFhO0FBQ2IsNENBQTRDO0FBQzVDLE1BQU07QUFDTixJQUFJIiwic291cmNlc0NvbnRlbnQiOlsiLy8gLy8gVGhpcyBpcyBib3Jyb3dlZCBmcm9tIFNRTElURTNPUk0sIHdoaWNoXG4vLyAvLyBpcyB1bmRlciB0aGUgTUlUIExpY2Vuc2UgYXMgc286XG5cbi8vIC8vIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuXG4vLyAvLyBDb3B5cmlnaHQgKGMpIDIwMTYtMjAyMSBHdWVudGVyIFNhbmRuZXJcblxuLy8gLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyAvLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4vLyAvLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbi8vIC8vIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbi8vIC8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIC8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyAvLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyAvLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbi8vIC8vIFNPRlRXQVJFLlxuXG4vLyAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBleHBvcnQgZnVuY3Rpb24gcXVvdGVTaW1wbGVJZGVudGlmaWVyKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIHJldHVybiAnXCInICsgbmFtZS5yZXBsYWNlKC9cIi9nLCAnXCJcIicpICsgJ1wiJztcbi8vIH1cblxuLy8gZXhwb3J0IGZ1bmN0aW9uIGJhY2t0aWNrUXVvdGVTaW1wbGVJZGVudGlmaWVyKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIHJldHVybiAnYCcgKyBuYW1lLnJlcGxhY2UoL2AvZywgJ2BgJykgKyAnYCc7XG4vLyB9XG5cbi8vIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBxdW90ZUlkZW50aWZpZXJzKG5hbWU6IHN0cmluZyk6IHN0cmluZ1tdIHtcbi8vICAgcmV0dXJuIG5hbWUuc3BsaXQoJy4nKS5tYXAoKHZhbHVlKSA9PiBxdW90ZVNpbXBsZUlkZW50aWZpZXIodmFsdWUpKTtcbi8vIH1cblxuLy8gZXhwb3J0IGZ1bmN0aW9uIHF1b3RlSWRlbnRpZmllcihuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICByZXR1cm4gcXVvdGVJZGVudGlmaWVycyhuYW1lKS5qb2luKCcuJyk7XG4vLyB9XG5cbi8vIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiB1bnF1YWxpZnlJZGVudGlmaWVyKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIHJldHVybiBuYW1lLnNwbGl0KCcuJykucG9wKCkgYXMgc3RyaW5nO1xuLy8gfVxuXG4vLyBleHBvcnQgZnVuY3Rpb24gcXVvdGVBbmRVbnF1YWxpZnlJZGVudGlmaWVyKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4vLyAgIHJldHVybiBxdW90ZVNpbXBsZUlkZW50aWZpZXIodW5xdWFsaWZ5SWRlbnRpZmllcihuYW1lKSk7XG4vLyB9XG5cbi8vIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBxdWFsaWZpeVNjaGVtYUlkZW50aWZpZXIobmFtZTogc3RyaW5nLCBzY2hlbWE/OiBzdHJpbmcpOiBzdHJpbmcge1xuLy8gICBpZiAobmFtZS5pbmRleE9mKCcuJykgIT09IC0xKSB7XG4vLyAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4vLyAgICAgaWYgKHNjaGVtYSAmJiBuYW1lLnNwbGl0KCcuJykuc2hpZnQoKSAhPT0gc2NoZW1hKSB7XG4vLyAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGZhaWxlZCB0byBxdWFsaWZ5ICcke25hbWV9JyBieSAnJHtzY2hlbWF9YCk7XG4vLyAgICAgfVxuLy8gICAgIHJldHVybiBuYW1lO1xuLy8gICB9XG4vLyAgIC8vIFdoYXQgaXMgdGhpcyBmb3I/ICBUaGUgZGVmaW5pdGlvbiBjb21lc1xuLy8gICAvLyBmcm9tIHRoZSBvcmlnaW5hbCBTUUxJVEUzT1JNIGNvZGVcbi8vICAgLy8gc2NoZW1hID0gc2NoZW1hIHx8IFNRTF9ERUZBVUxUX1NDSEVNQTtcbi8vICAgcmV0dXJuIGAke3NjaGVtYX0uJHtuYW1lfWA7XG4vLyB9XG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBzcGxpdFNjaGVtYUlkZW50aWZpZXIobmFtZTogc3RyaW5nKToge1xuLy8gICBpZGVudE5hbWU6IHN0cmluZztcbi8vICAgaWRlbnRTY2hlbWE/OiBzdHJpbmc7XG4vLyB9IHtcbi8vICAgY29uc3QgaWRlbnRpZmllcnMgPSBuYW1lLnNwbGl0KCcuJyk7XG5cbi8vICAgaWYgKGlkZW50aWZpZXJzLmxlbmd0aCA+PSAyKSB7XG4vLyAgICAgcmV0dXJuIHtcbi8vICAgICAgIGlkZW50U2NoZW1hOiBpZGVudGlmaWVycy5zaGlmdCgpLFxuLy8gICAgICAgaWRlbnROYW1lOiBpZGVudGlmaWVycy5qb2luKCcuJyksXG4vLyAgICAgfTtcbi8vICAgfSBlbHNlIHtcbi8vICAgICByZXR1cm4geyBpZGVudE5hbWU6IGlkZW50aWZpZXJzWzBdIH07XG4vLyAgIH1cbi8vIH1cbiJdfQ==