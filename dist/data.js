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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL2xpYi9kYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7OztHQWlCRztBQVNILDZCQUE2QjtBQUM3QixnQkFBZ0I7QUFDaEIsa0RBQWtEO0FBQ2xELHVCQUF1QjtBQUV2QixnREFBZ0Q7QUFDaEQscUJBQXFCO0FBRXJCLGVBQWU7QUFDZiw0QkFBNEI7QUFDNUIsa0NBQWtDO0FBQ2xDLDhEQUE4RDtBQUM5RCxtRUFBbUU7QUFDbkUsMEJBQTBCO0FBQzFCLFNBQVM7QUFDVCx5QkFBeUI7QUFFekIsbURBQW1EO0FBQ25ELHdCQUF3QjtBQUV4QixlQUFlO0FBQ2YseUJBQXlCO0FBQ3pCLHlEQUF5RDtBQUN6RCxTQUFTO0FBQ1QscUJBQXFCO0FBRXJCLGVBQWU7QUFDZix5QkFBeUI7QUFDekIseURBQXlEO0FBQ3pELFNBQVM7QUFDVCxxQkFBcUI7QUFFckIsZUFBZTtBQUNmLHVCQUF1QjtBQUN2Qix5REFBeUQ7QUFDekQsU0FBUztBQUNULG1CQUFtQjtBQUVuQixJQUFJO0FBRUosOENBQThDO0FBQzlDLCtDQUErQztBQUUvQyxNQUFNLENBQUMsS0FBSyxVQUFVLE1BQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsS0FBSztJQUMvRCxnQ0FBZ0M7SUFDaEMsNEJBQTRCO0lBQzVCLDBCQUEwQjtJQUMxQiw4Q0FBOEM7SUFDOUMsNkJBQTZCO0lBQzdCLDBCQUEwQjtJQUMxQiwwQkFBMEI7SUFDMUIsNkNBQTZDO0lBQzdDLDJCQUEyQjtBQUMvQixDQUFDO0FBQUEsQ0FBQztBQUVGOzs7Ozs7R0FNRztBQUNILE1BQU0sQ0FBQyxLQUFLLFVBQVUsTUFBTSxDQUFDLE9BQU8sRUFBRSxLQUFLO0lBQ3ZDLFFBQVE7SUFDUiwrQ0FBK0M7SUFDL0MsbUJBQW1CO0FBQ3ZCLENBQUM7QUFBQSxDQUFDO0FBRUYsTUFBTSxDQUFDLEtBQUssVUFBVSxTQUFTO0lBQzNCLFFBQVE7SUFDUiwrQkFBK0I7SUFDL0IsbUJBQW1CO0FBQ3ZCLENBQUM7QUFBQSxDQUFDO0FBRUYsTUFBTSxDQUFDLEtBQUssVUFBVSxLQUFLO0lBRXZCLHVDQUF1QztJQUN2QyxnQ0FBZ0M7SUFDaEMsTUFBTTtJQUVOLDhCQUE4QjtJQUM5Qiw0SkFBNEo7SUFDNUosSUFBSTtBQUNSLENBQUM7QUFBQSxDQUFDO0FBRUYsTUFBTSxDQUFDLEtBQUssVUFBVSxTQUFTLENBQUMsT0FBTyxFQUFFLEtBQUs7SUFDMUMsZ0JBQWdCO0lBQ2hCLHVDQUF1QztJQUN2QyxlQUFlO0lBQ2Ysb0NBQW9DO0lBQ3BDLGlDQUFpQztJQUNqQyxRQUFRO0lBQ1IsTUFBTTtJQUNOLDhCQUE4QjtJQUM5QixnRUFBZ0U7SUFDaEUsNkpBQTZKO0lBQzdKLFFBQVE7SUFDUixJQUFJO0lBQ0osY0FBYztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKlxuICogQ29weXJpZ2h0IDIwMTQtMjAyNCBEYXZpZCBIZXJyb25cbiAqXG4gKiBUaGlzIGZpbGUgaXMgcGFydCBvZiBBa2FzaGFDTVMgKGh0dHA6Ly9ha2FzaGFjbXMuY29tLykuXG4gKlxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiAgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqICBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiAgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiAgU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5cbmltcG9ydCB7XG4gICAgQmFzZURBTywgZmllbGQsIHNjaGVtYSwgdGFibGVcbn0gZnJvbSAnc3FsaXRlM29ybSc7XG5pbXBvcnQgeyBzcWRiIH0gZnJvbSAnLi9zcWRiLmpzJztcblxuLy8gQHRhYmxlKHsgbmFtZTogJ1RSQUNFUycgfSlcbi8vIGNsYXNzIFRyYWNlIHtcbi8vICAgICBAZmllbGQoeyBuYW1lOiAnYmFzZWRpcicsIGRidHlwZTogJ1RFWFQnIH0pXG4vLyAgICAgYmFzZWRpcjogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHsgbmFtZTogJ2ZwYXRoJywgZGJ0eXBlOiAnVEVYVCcgfSlcbi8vICAgICBmcGF0aDogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ2Z1bGxwYXRoJyxcbi8vICAgICAgICAgLy8gVGhpcyBjYXVzZWQgYW4gZXJyb3Jcbi8vICAgICAgICAgLy8gZGJ0eXBlOiAnVEVYVCBBUyAoY29uY2F0KGJhc2VkaXIsIFwiL1wiLCBmcGF0aCkpJyxcbi8vICAgICAgICAgLy8gRVJST1I6IGNhbm5vdCBJTlNFUlQgaW50byBnZW5lcmF0ZWQgY29sdW1uIFwiZnVsbHBhdGhcIlxuLy8gICAgICAgICBkYnR5cGU6ICdURVhUJyxcbi8vICAgICB9KVxuLy8gICAgIGZ1bGxwYXRoPzogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHsgbmFtZTogJ3JlbmRlclRvJywgZGJ0eXBlOiAnVEVYVCcgfSlcbi8vICAgICByZW5kZXJUbzogc3RyaW5nO1xuXG4vLyAgICAgQGZpZWxkKHtcbi8vICAgICAgICAgbmFtZTogJ3N0YWdlJyxcbi8vICAgICAgICAgZGJ0eXBlOiBcIlRFWFQgREVGQVVMVChkYXRldGltZSgnbm93JykgfHwgJ1onKVwiXG4vLyAgICAgfSlcbi8vICAgICBzdGFnZTogc3RyaW5nO1xuICAgIFxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdzdGFydCcsXG4vLyAgICAgICAgIGRidHlwZTogXCJURVhUIERFRkFVTFQoZGF0ZXRpbWUoJ25vdycpIHx8ICdaJylcIlxuLy8gICAgIH0pXG4vLyAgICAgc3RhcnQ6IHN0cmluZztcblxuLy8gICAgIEBmaWVsZCh7XG4vLyAgICAgICAgIG5hbWU6ICdub3cnLFxuLy8gICAgICAgICBkYnR5cGU6IFwiVEVYVCBERUZBVUxUKGRhdGV0aW1lKCdub3cnKSB8fCAnWicpXCJcbi8vICAgICB9KVxuLy8gICAgIG5vdzogc3RyaW5nO1xuXG4vLyB9XG5cbi8vIGF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdUUkFDRVMnKTtcbi8vIGNvbnN0IGRhbyA9IG5ldyBCYXNlREFPPFRyYWNlPihUcmFjZSwgc3FkYik7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXBvcnQoYmFzZWRpciwgZnBhdGgsIHJlbmRlclRvLCBzdGFnZSwgc3RhcnQpIHtcbiAgICAvLyBjb25zdCB0cmFjZSAgICA9IG5ldyBUcmFjZSgpO1xuICAgIC8vIHRyYWNlLmJhc2VkaXIgID0gYmFzZWRpcjtcbiAgICAvLyB0cmFjZS5mcGF0aCAgICA9IGZwYXRoO1xuICAgIC8vIHRyYWNlLmZ1bGxwYXRoID0gcGF0aC5qb2luKGJhc2VkaXIsIGZwYXRoKTtcbiAgICAvLyB0cmFjZS5yZW5kZXJUbyA9IHJlbmRlclRvO1xuICAgIC8vIHRyYWNlLnN0YWdlICAgID0gc3RhZ2U7XG4gICAgLy8gdHJhY2Uuc3RhcnQgICAgPSBzdGFydDtcbiAgICAvLyB0cmFjZS5ub3cgICAgICA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAvLyBhd2FpdCBkYW8uaW5zZXJ0KHRyYWNlKTtcbn07XG5cbi8qKlxuICogU3VwcG9ydCByZW1vdmluZyBpdGVtcyBmcm9tIHRoZSBzYXZlZCBkYXRhLiAgVGhpcyBpcyB1c2VmdWxcbiAqIHdoZW4gd2UncmUgcmVuZGVyaW5nIHRoZSBzYW1lIGZpbGUgbXVsdGlwbGUgdGltZXMuXG4gKlxuICogQHBhcmFtIHsqfSBiYXNlZGlyXG4gKiBAcGFyYW0geyp9IGZwYXRoXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmUoYmFzZWRpciwgZnBhdGgpIHtcbiAgICAvLyB0cnkge1xuICAgIC8vICAgICBhd2FpdCBkYW8uZGVsZXRlQWxsKHsgYmFzZWRpciwgZnBhdGggfSk7XG4gICAgLy8gfSBjYXRjaCAoZXJyKSB7fVxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbW92ZUFsbCgpIHtcbiAgICAvLyB0cnkge1xuICAgIC8vICAgICBhd2FpdCBkYW8uZGVsZXRlQWxsKHt9KTtcbiAgICAvLyB9IGNhdGNoIChlcnIpIHt9XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJpbnQoKSB7XG5cbiAgICAvLyBjb25zdCB0cmFjZXMgPSBhd2FpdCBkYW8uc2VsZWN0QWxsKHtcbiAgICAvLyAgICAgb3JkZXI6IHsgZnVsbHBhdGg6IHRydWUgfVxuICAgIC8vIH0pO1xuXG4gICAgLy8gZm9yIChsZXQgdHJhY2Ugb2YgdHJhY2VzKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKGAke3RyYWNlLmZ1bGxwYXRofSAke3RyYWNlLnJlbmRlclRvfSAke3RyYWNlLnN0YWdlfSAkeyhuZXcgRGF0ZSh0cmFjZS5ub3cpLnZhbHVlT2YoKSAtIG5ldyBEYXRlKHRyYWNlLnN0YXJ0KS52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kc2ApXG4gICAgLy8gfVxufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRhdGE0ZmlsZShiYXNlZGlyLCBmcGF0aCkge1xuICAgIC8vIGxldCByZXQgPSBcIlwiO1xuICAgIC8vIGNvbnN0IHRyYWNlcyA9IGF3YWl0IGRhby5zZWxlY3RBbGwoe1xuICAgIC8vICAgICB3aGVyZToge1xuICAgIC8vICAgICAgICAgYmFzZWRpcjogeyBlcTogYmFzZWRpciB9LFxuICAgIC8vICAgICAgICAgZnBhdGg6ICAgeyBlcTogZnBhdGggfVxuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG4gICAgLy8gZm9yIChsZXQgdHJhY2Ugb2YgdHJhY2VzKSB7XG4gICAgLy8gICAgIGlmICh0cmFjZS5iYXNlZGlyID09PSBiYXNlZGlyICYmIHRyYWNlLmZwYXRoID09PSBmcGF0aCkge1xuICAgIC8vICAgICAgICAgcmV0ICs9IGAke3RyYWNlLmZ1bGxwYXRofSAke3RyYWNlLnJlbmRlclRvfSAke3RyYWNlLnN0YWdlfSAkeyhuZXcgRGF0ZSh0cmFjZS5ub3cpLnZhbHVlT2YoKSAtIG5ldyBEYXRlKHRyYWNlLnN0YXJ0KS52YWx1ZU9mKCkpIC8gMTAwMH0gc2Vjb25kc1xcbmA7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG4gICAgLy8gcmV0dXJuIHJldDtcbn1cbiJdfQ==