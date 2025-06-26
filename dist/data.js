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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import path from 'node:path';
import { BaseDAO, field, schema, table } from 'sqlite3orm';
import { sqdb } from './sqdb.js';
let Trace = class Trace {
};
__decorate([
    field({ name: 'basedir', dbtype: 'TEXT' }),
    __metadata("design:type", String)
], Trace.prototype, "basedir", void 0);
__decorate([
    field({ name: 'fpath', dbtype: 'TEXT' }),
    __metadata("design:type", String)
], Trace.prototype, "fpath", void 0);
__decorate([
    field({
        name: 'fullpath',
        // This caused an error
        // dbtype: 'TEXT AS (concat(basedir, "/", fpath))',
        // ERROR: cannot INSERT into generated column "fullpath"
        dbtype: 'TEXT',
    }),
    __metadata("design:type", String)
], Trace.prototype, "fullpath", void 0);
__decorate([
    field({ name: 'renderTo', dbtype: 'TEXT' }),
    __metadata("design:type", String)
], Trace.prototype, "renderTo", void 0);
__decorate([
    field({
        name: 'stage',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    __metadata("design:type", String)
], Trace.prototype, "stage", void 0);
__decorate([
    field({
        name: 'start',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    __metadata("design:type", String)
], Trace.prototype, "start", void 0);
__decorate([
    field({
        name: 'now',
        dbtype: "TEXT DEFAULT(datetime('now') || 'Z')"
    }),
    __metadata("design:type", String)
], Trace.prototype, "now", void 0);
Trace = __decorate([
    table({ name: 'TRACES' })
], Trace);
await schema().createTable(sqdb, 'TRACES');
const dao = new BaseDAO(Trace, sqdb);
export async function report(basedir, fpath, renderTo, stage, start) {
    const trace = new Trace();
    trace.basedir = basedir;
    trace.fpath = fpath;
    trace.fullpath = path.join(basedir, fpath);
    trace.renderTo = renderTo;
    trace.stage = stage;
    trace.start = start;
    trace.now = new Date().toISOString();
    await dao.insert(trace);
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
    try {
        await dao.deleteAll({ basedir, fpath });
    }
    catch (err) { }
}
;
export async function removeAll() {
    try {
        await dao.deleteAll({});
    }
    catch (err) { }
}
;
export async function print() {
    const traces = await dao.selectAll({
        order: { fullpath: true }
    });
    for (let trace of traces) {
        console.log(`${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds`);
    }
}
;
export async function data4file(basedir, fpath) {
    let ret = "";
    const traces = await dao.selectAll({
        where: {
            basedir: { eq: basedir },
            fpath: { eq: fpath }
        }
    });
    for (let trace of traces) {
        if (trace.basedir === basedir && trace.fpath === fpath) {
            ret += `${trace.fullpath} ${trace.renderTo} ${trace.stage} ${(new Date(trace.now).valueOf() - new Date(trace.start).valueOf()) / 1000} seconds\n`;
        }
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRzs7Ozs7Ozs7OztBQUVILE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUU3QixPQUFPLEVBQ0gsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUNoQyxNQUFNLFlBQVksQ0FBQztBQUNwQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBR2pDLElBQU0sS0FBSyxHQUFYLE1BQU0sS0FBSztDQXFDVixDQUFBO0FBbkNHO0lBREMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7O3NDQUMzQjtBQUdoQjtJQURDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDOztvQ0FDM0I7QUFTZDtJQVBDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxVQUFVO1FBQ2hCLHVCQUF1QjtRQUN2QixtREFBbUQ7UUFDbkQsd0RBQXdEO1FBQ3hELE1BQU0sRUFBRSxNQUFNO0tBQ2pCLENBQUM7O3VDQUNnQjtBQUdsQjtJQURDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDOzt1Q0FDM0I7QUFNakI7SUFKQyxLQUFLLENBQUM7UUFDSCxJQUFJLEVBQUUsT0FBTztRQUNiLE1BQU0sRUFBRSxzQ0FBc0M7S0FDakQsQ0FBQzs7b0NBQ1k7QUFNZDtJQUpDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxPQUFPO1FBQ2IsTUFBTSxFQUFFLHNDQUFzQztLQUNqRCxDQUFDOztvQ0FDWTtBQU1kO0lBSkMsS0FBSyxDQUFDO1FBQ0gsSUFBSSxFQUFFLEtBQUs7UUFDWCxNQUFNLEVBQUUsc0NBQXNDO0tB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O1FBQ3ZCLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUUsQ0FBQztZQUNyRCxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsUUFBUSxJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxJQUFJLFlBQVksQ0FBQztRQUN0SixDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICpcbiAqIENvcHlyaWdodCAyMDE0LTIwMjQgRGF2aWQgSGVycm9uXG4gKlxuICogVGhpcyBmaWxlIGlzIHBhcnQgb2YgQWthc2hhQ01TIChodHRwOi8vYWthc2hhY21zLmNvbS8pLlxuICpcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqICBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqICBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiAgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqICBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgcGF0aCBmcm9tICdub2RlOnBhdGgnO1xuXG5pbXBvcnQge1xuICAgIEJhc2VEQU8sIGZpZWxkLCBzY2hlbWEsIHRhYmxlXG59IGZyb20gJ3NxbGl0ZTNvcm0nO1xuaW1wb3J0IHsgc3FkYiB9IGZyb20gJy4vc3FkYi5qcyc7XG5cbkB0YWJsZSh7IG5hbWU6ICdUUkFDRVMnIH0pXG5jbGFzcyBUcmFjZSB7XG4gICAgQGZpZWxkKHsgbmFtZTogJ2Jhc2VkaXInLCBkYnR5cGU6ICdURVhUJyB9KVxuICAgIGJhc2VkaXI6IHN0cmluZztcblxuICAgIEBmaWVsZCh7IG5hbWU6ICdmcGF0aCcsIGRidHlwZTogJ1RFWFQnIH0pXG4gICAgZnBhdGg6IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdmdWxscGF0aCcsXG4gICAgICAgIC8vIFRoaXMgY2F1c2VkIGFuIGVycm9yXG4gICAgICAgIC8vIGRidHlwZTogJ1RFWFQgQVMgKGNvbmNhdChiYXNlZGlyLCBcIi9cIiwgZnBhdGgpKScsXG4gICAgICAgIC8vIEVSUk9SOiBjYW5ub3QgSU5TRVJUIGludG8gZ2VuZXJhdGVkIGNvbHVtbiBcImZ1bGxwYXRoXCJcbiAgICAgICAgZGJ0eXBlOiAnVEVYVCcsXG4gICAgfSlcbiAgICBmdWxscGF0aD86IHN0cmluZztcblxuICAgIEBmaWVsZCh7IG5hbWU6ICdyZW5kZXJUbycsIGRidHlwZTogJ1RFWFQnIH0pXG4gICAgcmVuZGVyVG86IHN0cmluZztcblxuICAgIEBmaWVsZCh7XG4gICAgICAgIG5hbWU6ICdzdGFnZScsXG4gICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuICAgIH0pXG4gICAgc3RhZ2U6IHN0cmluZztcbiAgICBcbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnc3RhcnQnLFxuICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbiAgICB9KVxuICAgIHN0YXJ0OiBzdHJpbmc7XG5cbiAgICBAZmllbGQoe1xuICAgICAgICBuYW1lOiAnbm93JyxcbiAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4gICAgfSlcbiAgICBub3c6IHN0cmluZztcblxufVxuXG5hd2FpdCBzY2hlbWEoKS5jcmVhdGVUYWJsZShzcWRiLCAnVFJBQ0VTJyk7XG5jb25zdCBkYW8gPSBuZXcgQmFzZURBTzxUcmFjZT4oVHJhY2UsIHNxZGIpO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVwb3J0KGJhc2VkaXIsIGZwYXRoLCByZW5kZXJUbywgc3RhZ2UsIHN0YXJ0KSB7XG4gICAgY29uc3QgdHJhY2UgICAgPSBuZXcgVHJhY2UoKTtcbiAgICB0cmFjZS5iYXNlZGlyICA9IGJhc2VkaXI7XG4gICAgdHJhY2UuZnBhdGggICAgPSBmcGF0aDtcbiAgICB0cmFjZS5mdWxscGF0aCA9IHBhdGguam9pbihiYXNlZGlyLCBmcGF0aCk7XG4gICAgdHJhY2UucmVuZGVyVG8gPSByZW5kZXJUbztcbiAgICB0cmFjZS5zdGFnZSAgICA9IHN0YWdlO1xuICAgIHRyYWNlLnN0YXJ0ICAgID0gc3RhcnQ7XG4gICAgdHJhY2Uubm93ICAgICAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgYXdhaXQgZGFvLmluc2VydCh0cmFjZSk7XG59O1xuXG4vKipcbiAqIFN1cHBvcnQgcmVtb3ZpbmcgaXRlbXMgZnJvbSB0aGUgc2F2ZWQgZGF0YS4gIFRoaXMgaXMgdXNlZnVsXG4gKiB3aGVuIHdlJ3JlIHJlbmRlcmluZyB0aGUgc2FtZSBmaWxlIG11bHRpcGxlIHRpbWVzLlxuICpcbiAqIEBwYXJhbSB7Kn0gYmFzZWRpclxuICogQHBhcmFtIHsqfSBmcGF0aFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlKGJhc2VkaXIsIGZwYXRoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZGFvLmRlbGV0ZUFsbCh7IGJhc2VkaXIsIGZwYXRoIH0pO1xuICAgIH0gY2F0Y2ggKGVycikge31cbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZGFvLmRlbGV0ZUFsbCh7fSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7fVxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHByaW50KCkge1xuXG4gICAgY29uc3QgdHJhY2VzID0gYXdhaXQgZGFvLnNlbGVjdEFsbCh7XG4gICAgICAgIG9yZGVyOiB7IGZ1bGxwYXRoOiB0cnVlIH1cbiAgICB9KTtcblxuICAgIGZvciAobGV0IHRyYWNlIG9mIHRyYWNlcykge1xuICAgICAgICBjb25zb2xlLmxvZyhgJHt0cmFjZS5mdWxscGF0aH0gJHt0cmFjZS5yZW5kZXJUb30gJHt0cmFjZS5zdGFnZX0gJHsobmV3IERhdGUodHJhY2Uubm93KS52YWx1ZU9mKCkgLSBuZXcgRGF0ZSh0cmFjZS5zdGFydCkudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHNgKVxuICAgIH1cbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkYXRhNGZpbGUoYmFzZWRpciwgZnBhdGgpIHtcbiAgICBsZXQgcmV0ID0gXCJcIjtcbiAgICBjb25zdCB0cmFjZXMgPSBhd2FpdCBkYW8uc2VsZWN0QWxsKHtcbiAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgIGJhc2VkaXI6IHsgZXE6IGJhc2VkaXIgfSxcbiAgICAgICAgICAgIGZwYXRoOiAgIHsgZXE6IGZwYXRoIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGZvciAobGV0IHRyYWNlIG9mIHRyYWNlcykge1xuICAgICAgICBpZiAodHJhY2UuYmFzZWRpciA9PT0gYmFzZWRpciAmJiB0cmFjZS5mcGF0aCA9PT0gZnBhdGgpIHtcbiAgICAgICAgICAgIHJldCArPSBgJHt0cmFjZS5mdWxscGF0aH0gJHt0cmFjZS5yZW5kZXJUb30gJHt0cmFjZS5zdGFnZX0gJHsobmV3IERhdGUodHJhY2Uubm93KS52YWx1ZU9mKCkgLSBuZXcgRGF0ZSh0cmFjZS5zdGFydCkudmFsdWVPZigpKSAvIDEwMDB9IHNlY29uZHNcXG5gO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG59XG4iXX0=