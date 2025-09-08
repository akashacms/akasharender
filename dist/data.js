/**
 *
 * Copyright 2014-2024 David Herron
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
// import {
//     BaseDAO, field, schema, table
// } from 'sqlite3orm';
// import { sqdb } from './sqdb.js';
// @table({ name: 'TRACES' })
// class Trace {
//     @field({ name: 'basedir', dbtype: 'TEXT' })
//     basedir: string;
//     @field({ name: 'fpath', dbtype: 'TEXT' })
//     fpath: string;
//     @field({
//         name: 'fullpath',
//         // This caused an error
//         // dbtype: 'TEXT AS (concat(basedir, "/", fpath))',
//         // ERROR: cannot INSERT into generated column "fullpath"
//         dbtype: 'TEXT',
//     })
//     fullpath?: string;
//     @field({ name: 'renderTo', dbtype: 'TEXT' })
//     renderTo: string;
//     @field({
//         name: 'stage',
//         dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
//     })
//     stage: string;
//     @field({
//         name: 'start',
//         dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
//     })
//     start: string;
//     @field({
//         name: 'now',
//         dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
//     })
//     now: string;
// }
// await schema().createTable(sqdb, 'TRACES');
// const dao = new BaseDAO<Trace>(Trace, sqdb);
export async function report(basedir, fpath, renderTo, stage, start) {
    // const trace    = new Trace();
    // trace.basedir  = basedir;
    // trace.fpath    = fpath;
    // trace.fullpath = path.join(basedir, fpath);
    // trace.renderTo = renderTo;
    // trace.stage    = stage;
    // trace.start    = start;
    // trace.now      = new Date().toISOString();
    // await dao.insert(trace);
}
;
/**
 * Support removing items from the saved data.  This is useful
 * when we're rendering the same file multiple times.
 *
 * @param {*} basedir
 * @param {*} fpath
 */
export async function remove(basedir, fpath) {
    // try {
    //     await dao.deleteAll({ basedir, fpath });
    // } catch (err) {}
}
;
export async function removeAll() {
    // try {
    //     await dao.deleteAll({});
    // } catch (err) {}
}
;
export async function print() {
    // const traces = await dao.selectAll({
    //     order: { fullpath: true }
    // });
    // for (let trace of traces) {
    //     console.log(`${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds`)
    // }
}
;
export async function data4file(basedir, fpath) {
    // let ret = "";
    // const traces = await dao.selectAll({
    //     where: {
    //         basedir: { eq: basedir },
    //         fpath:   { eq: fpath }
    //     }
    // });
    // for (let trace of traces) {
    //     if (trace.basedir === basedir && trace.fpath === fpath) {
    //         ret += `${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds\n`;
    //     }
    // }
    // return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQUlILFdBQVc7QUFDWCxvQ0FBb0M7QUFDcEMsdUJBQXVCO0FBQ3ZCLG9DQUFvQztBQUVwQyw2QkFBNkI7QUFDN0IsZ0JBQWdCO0FBQ2hCLGtEQUFrRDtBQUNsRCx1QkFBdUI7QUFFdkIsZ0RBQWdEO0FBQ2hELHFCQUFxQjtBQUVyQixlQUFlO0FBQ2YsNEJBQTRCO0FBQzVCLGtDQUFrQztBQUNsQyw4REFBOEQ7QUFDOUQsbUVBQW1FO0FBQ25FLDBCQUEwQjtBQUMxQixTQUFTO0FBQ1QseUJBQXlCO0FBRXpCLG1EQUFtRDtBQUNuRCx3QkFBd0I7QUFFeEIsZUFBZTtBQUNmLHlCQUF5QjtBQUN6Qix5REFBeUQ7QUFDekQsU0FBUztBQUNULHFCQUFxQjtBQUVyQixlQUFlO0FBQ2YseUJBQXlCO0FBQ3pCLHlEQUF5RDtBQUN6RCxTQUFTO0FBQ1QscUJBQXFCO0FBRXJCLGVBQWU7QUFDZix1QkFBdUI7QUFDdkIseURBQXlEO0FBQ3pELFNBQVM7QUFDVCxtQkFBbUI7QUFFbkIsSUFBSTtBQUVKLDhDQUE4QztBQUM5QywrQ0FBK0M7QUFFL0MsTUFBTSxDQUFDLEtBQUssVUFBVSxNQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUs7SUFDL0QsZ0NBQWdDO0lBQ2hDLDRCQUE0QjtJQUM1QiwwQkFBMEI7SUFDMUIsOENBQThDO0lBQzlDLDZCQUE2QjtJQUM3QiwwQkFBMEI7SUFDMUIsMEJBQTBCO0lBQzFCLDZDQUE2QztJQUM3QywyQkFBMkI7QUFDL0IsQ0FBQztBQUFBLENBQUM7QUFFRjs7Ozs7O0dBTUc7QUFDSCxNQUFNLENBQUMsS0FBSyxVQUFVLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSztJQUN2QyxRQUFRO0lBQ1IsK0NBQStDO0lBQy9DLG1CQUFtQjtBQUN2QixDQUFDO0FBQUEsQ0FBQztBQUVGLE1BQU0sQ0FBQyxLQUFLLFVBQVUsU0FBUztJQUMzQixRQUFRO0lBQ1IsK0JBQStCO0lBQy9CLG1CQUFtQjtBQUN2QixDQUFDO0FBQUEsQ0FBQztBQUVGLE1BQU0sQ0FBQyxLQUFLLFVBQVUsS0FBSztJQUV2Qix1Q0FBdUM7SUFDdkMsZ0NBQWdDO0lBQ2hDLE1BQU07SUFFTiw4QkFBOEI7SUFDOUIsNEpBQTRKO0lBQzVKLElBQUk7QUFDUixDQUFDO0FBQUEsQ0FBQztBQUVGLE1BQU0sQ0FBQyxLQUFLLFVBQVUsU0FBUyxDQUFDLE9BQU8sRUFBRSxLQUFLO0lBQzFDLGdCQUFnQjtJQUNoQix1Q0FBdUM7SUFDdkMsZUFBZTtJQUNmLG9DQUFvQztJQUNwQyxpQ0FBaUM7SUFDakMsUUFBUTtJQUNSLE1BQU07SUFDTiw4QkFBOEI7SUFDOUIsZ0VBQWdFO0lBQ2hFLDZKQUE2SjtJQUM3SixRQUFRO0lBQ1IsSUFBSTtJQUNKLGNBQWM7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjQgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuXG4vLyBpbXBvcnQge1xuLy8gICAgIEJhc2VEQU8sIGZpZWxkLCBzY2hlbWEsIHRhYmxlXG4vLyB9IGZyb20gJ3NxbGl0ZTNvcm0nO1xuLy8gaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbi8vIEB0YWJsZSh7IG5hbWU6ICdUUkFDRVMnIH0pXG4vLyBjbGFzcyBUcmFjZSB7XG4vLyAgICAgQGZpZWxkKHsgbmFtZTogJ2Jhc2VkaXInLCBkYnR5cGU6ICdURVhUJyB9KVxuLy8gICAgIGJhc2VkaXI6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7IG5hbWU6ICdmcGF0aCcsIGRidHlwZTogJ1RFWFQnIH0pXG4vLyAgICAgZnBhdGg6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdmdWxscGF0aCcsXG4vLyAgICAgICAgIC8vIFRoaXMgY2F1c2VkIGFuIGVycm9yXG4vLyAgICAgICAgIC8vIGRidHlwZTogJ1RFWFQgQVMgKGNvbmNhdChiYXNlZGlyLCBcIi9cIiwgZnBhdGgpKScsXG4vLyAgICAgICAgIC8vIEVSUk9SOiBjYW5ub3QgSU5TRVJUIGludG8gZ2VuZXJhdGVkIGNvbHVtbiBcImZ1bGxwYXRoXCJcbi8vICAgICAgICAgZGJ0eXBlOiAnVEVYVCcsXG4vLyAgICAgfSlcbi8vICAgICBmdWxscGF0aD86IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7IG5hbWU6ICdyZW5kZXJUbycsIGRidHlwZTogJ1RFWFQnIH0pXG4vLyAgICAgcmVuZGVyVG86IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdzdGFnZScsXG4vLyAgICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuLy8gICAgIH0pXG4vLyAgICAgc3RhZ2U6IHN0cmluZztcbiAgICBcbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnc3RhcnQnLFxuLy8gICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbi8vICAgICB9KVxuLy8gICAgIHN0YXJ0OiBzdHJpbmc7XG5cbi8vICAgICBAZmllbGQoe1xuLy8gICAgICAgICBuYW1lOiAnbm93Jyxcbi8vICAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4vLyAgICAgfSlcbi8vICAgICBub3c6IHN0cmluZztcblxuLy8gfVxuXG4vLyBhd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnVFJBQ0VTJyk7XG4vLyBjb25zdCBkYW8gPSBuZXcgQmFzZURBTzxUcmFjZT4oVHJhY2UsIHNxZGIpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVwb3J0KGJhc2VkaXIsIGZwYXRoLCByZW5kZXJUbywgc3RhZ2UsIHN0YXJ0KSB7XG4gICAgLy8gY29uc3QgdHJhY2UgICAgPSBuZXcgVHJhY2UoKTtcbiAgICAvLyB0cmFjZS5iYXNlZGlyICA9IGJhc2VkaXI7XG4gICAgLy8gdHJhY2UuZnBhdGggICAgPSBmcGF0aDtcbiAgICAvLyB0cmFjZS5mdWxscGF0aCA9IHBhdGguam9pbihiYXNlZGlyLCBmcGF0aCk7XG4gICAgLy8gdHJhY2UucmVuZGVyVG8gPSByZW5kZXJUbztcbiAgICAvLyB0cmFjZS5zdGFnZSAgICA9IHN0YWdlO1xuICAgIC8vIHRyYWNlLnN0YXJ0ICAgID0gc3RhcnQ7XG4gICAgLy8gdHJhY2Uubm93ICAgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgLy8gYXdhaXQgZGFvLmluc2VydCh0cmFjZSk7XG59O1xuXG4vKipcbiAqIFN1cHBvcnQgcmVtb3ZpbmcgaXRlbXMgZnJvbSB0aGUgc2F2ZWQgZGF0YS4gIFRoaXMgaXMgdXNlZnVsXG4gKiB3aGVuIHdlJ3JlIHJlbmRlcmluZyB0aGUgc2FtZSBmaWxlIG11bHRpcGxlIHRpbWVzLlxuICpcbiAqIEBwYXJhbSB7Kn0gYmFzZWRpclxuICogQHBhcmFtIHsqfSBmcGF0aFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlKGJhc2VkaXIsIGZwYXRoKSB7XG4gICAgLy8gdHJ5IHtcbiAgICAvLyAgICAgYXdhaXQgZGFvLmRlbGV0ZUFsbCh7IGJhc2VkaXIsIGZwYXRoIH0pO1xuICAgIC8vIH0gY2F0Y2ggKGVycikge31cbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgLy8gdHJ5IHtcbiAgICAvLyAgICAgYXdhaXQgZGFvLmRlbGV0ZUFsbCh7fSk7XG4gICAgLy8gfSBjYXRjaCAoZXJyKSB7fVxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByaW50KCkge1xuXG4gICAgLy8gY29uc3QgdHJhY2VzID0gYXdhaXQgZGFvLnNlbGVjdEFsbCh7XG4gICAgLy8gICAgIG9yZGVyOiB7IGZ1bGxwYXRoOiB0cnVlIH1cbiAgICAvLyB9KTtcblxuICAgIC8vIGZvciAobGV0IHRyYWNlIG9mIHRyYWNlcykge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhgJHt0cmFjZS5mdWxscGF0aH0gJHt0cmFjZS5yZW5kZXJUb30gJHt0cmFjZS5zdGFnZX0gJHsobmV3IERhdGUodHJhY2Uubm93KS52YWx1ZU9mKCkgLSBuZXcgRGF0ZSh0cmFjZS5zdGFydCkudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHNgKVxuICAgIC8vIH1cbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkYXRhNGZpbGUoYmFzZWRpciwgZnBhdGgpIHtcbiAgICAvLyBsZXQgcmV0ID0gXCJcIjtcbiAgICAvLyBjb25zdCB0cmFjZXMgPSBhd2FpdCBkYW8uc2VsZWN0QWxsKHtcbiAgICAvLyAgICAgd2hlcmU6IHtcbiAgICAvLyAgICAgICAgIGJhc2VkaXI6IHsgZXE6IGJhc2VkaXIgfSxcbiAgICAvLyAgICAgICAgIGZwYXRoOiAgIHsgZXE6IGZwYXRoIH1cbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuICAgIC8vIGZvciAobGV0IHRyYWNlIG9mIHRyYWNlcykge1xuICAgIC8vICAgICBpZiAodHJhY2UuYmFzZWRpciA9PT0gYmFzZWRpciAmJiB0cmFjZS5mcGF0aCA9PT0gZnBhdGgpIHtcbiAgICAvLyAgICAgICAgIHJldCArPSBgJHt0cmFjZS5mdWxscGF0aH0gJHt0cmFjZS5yZW5kZXJUb30gJHt0cmFjZS5zdGFnZX0gJHsobmV3IERhdGUodHJhY2Uubm93KS52YWx1ZU9mKCkgLSBuZXcgRGF0ZSh0cmFjZS5zdGFydCkudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHNcXG5gO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuICAgIC8vIHJldHVybiByZXQ7XG59XG4iXX0=