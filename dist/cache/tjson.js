var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { field, id, index, table, schema, BaseDAO } from 'sqlite3orm';
import { sqdb } from "../sqdb.js";
let TestDB = class TestDB {
};
__decorate([
    id({
        name: 'vpath', dbtype: 'TEXT'
    }),
    index('asset_vpath'),
    __metadata("design:type", String)
], TestDB.prototype, "vpath", void 0);
__decorate([
    field({
        name: 'info', dbtype: 'JSON', isJson: true
    }),
    __metadata("design:type", Object)
], TestDB.prototype, "info", void 0);
TestDB = __decorate([
    table({
        name: 'TEST',
        withoutRowId: true
    })
], TestDB);
await schema().createTable(sqdb, 'TEST');
const assetsDAO = new BaseDAO(TestDB, sqdb);
const fullobj = await assetsDAO.insert({
    vpath: '/path/to/paradise',
    info: {
        fspath: '/path/to/docs/path/to/paradise',
        tags: [
            'Linux',
            'Cell Phone',
            'Pine'
        ]
    }
});
const noinfo = await assetsDAO.insert({
    vpath: 'no info'
});
const notags = await assetsDAO.insert({
    vpath: 'no tags',
    info: {
        fspath: '/path/to/no tags'
    }
});
console.log(await assetsDAO.selectAll({
    info: { isNotNull: true }
}));
// Does not work
//
// Error: select 'TEST' failed: unknown comparison operation: 'tags'
// at QueryModel.selectAll (/home/david/Projects/akasharender/akasharender/node_modules/sqlite3orm/src/lib/query/QueryModel.js:95:35)
// at async file:///home/david/Projects/akasharender/akasharender/dist/cache/tjson.js:58:13
//
// console.log(await assetsDAO.selectAll({
//     info: {
//         tags: {
//             isNotNull: true 
//         }
//     }
// }));
console.log(await assetsDAO.selectAll({}));
console.log(await assetsDAO.select(fullobj));
console.log(await assetsDAO.select(noinfo));
console.log(await assetsDAO.select(notags));
// console.log(await sqdb.run('.schema'));
console.log(await sqdb.all('SELECT * FROM TEST, json_each(TEST.info)'));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGpzb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvY2FjaGUvdGpzb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUEsT0FBTyxFQUNILEtBQUssRUFHTCxFQUFFLEVBQ0YsS0FBSyxFQUNMLEtBQUssRUFHTCxNQUFNLEVBQ04sT0FBTyxFQUdWLE1BQU0sWUFBWSxDQUFDO0FBR3BCLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFNbEMsSUFBTSxNQUFNLEdBQVosTUFBTSxNQUFNO0NBYVgsQ0FBQTtBQU5HO0lBSkMsRUFBRSxDQUFDO1FBQ0EsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTTtLQUNoQyxDQUFDO0lBQ0QsS0FBSyxDQUFDLGFBQWEsQ0FBQzs7cUNBQ1A7QUFLZDtJQUhDLEtBQUssQ0FBQztRQUNILElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSTtLQUM3QyxDQUFDOztvQ0FDUztBQVpULE1BQU07SUFKWCxLQUFLLENBQUM7UUFDSCxJQUFJLEVBQUUsTUFBTTtRQUNaLFlBQVksRUFBRSxJQUFJO0tBQ3JCLENBQUM7R0FDSSxNQUFNLENBYVg7QUFHRCxNQUFNLE1BQU0sRUFBRSxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFekMsTUFBTSxTQUFTLEdBQ1QsSUFBSSxPQUFPLENBQVMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBRXhDLE1BQU0sT0FBTyxHQUFHLE1BQU0sU0FBUyxDQUFDLE1BQU0sQ0FBQztJQUNuQyxLQUFLLEVBQUUsbUJBQW1CO0lBQzFCLElBQUksRUFBRTtRQUNGLE1BQU0sRUFBRSxnQ0FBZ0M7UUFDeEMsSUFBSSxFQUFFO1lBQ0YsT0FBTztZQUNQLFlBQVk7WUFDWixNQUFNO1NBQ1Q7S0FDSjtDQUNKLENBQUMsQ0FBQztBQUVILE1BQU0sTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLE1BQU0sQ0FBQztJQUNsQyxLQUFLLEVBQUUsU0FBUztDQUNuQixDQUFDLENBQUM7QUFFSCxNQUFNLE1BQU0sR0FBRyxNQUFNLFNBQVMsQ0FBQyxNQUFNLENBQUM7SUFDbEMsS0FBSyxFQUFFLFNBQVM7SUFDaEIsSUFBSSxFQUFFO1FBQ0YsTUFBTSxFQUFFLGtCQUFrQjtLQUM3QjtDQUNKLENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxTQUFTLENBQUMsU0FBUyxDQUFDO0lBQ2xDLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUU7Q0FDNUIsQ0FBQyxDQUFDLENBQUM7QUFFSixnQkFBZ0I7QUFDaEIsRUFBRTtBQUNGLG9FQUFvRTtBQUNwRSxxSUFBcUk7QUFDckksMkZBQTJGO0FBQzNGLEVBQUU7QUFDRiwwQ0FBMEM7QUFDMUMsY0FBYztBQUNkLGtCQUFrQjtBQUNsQiwrQkFBK0I7QUFDL0IsWUFBWTtBQUNaLFFBQVE7QUFDUixPQUFPO0FBRVAsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUczQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUU1QywwQ0FBMEM7QUFFMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsMENBQTBDLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmltcG9ydCB7XG4gICAgZmllbGQsXG4gICAgRmllbGRPcHRzLFxuICAgIGZrLFxuICAgIGlkLFxuICAgIGluZGV4LFxuICAgIHRhYmxlLFxuICAgIFRhYmxlT3B0cyxcbiAgICBTcWxEYXRhYmFzZSxcbiAgICBzY2hlbWEsXG4gICAgQmFzZURBTyxcbiAgICBGaWx0ZXIsXG4gICAgV2hlcmVcbn0gZnJvbSAnc3FsaXRlM29ybSc7XG5cblxuaW1wb3J0IHsgc3FkYiB9IGZyb20gXCIuLi9zcWRiLmpzXCI7XG5cbkB0YWJsZSh7XG4gICAgbmFtZTogJ1RFU1QnLFxuICAgIHdpdGhvdXRSb3dJZDogdHJ1ZVxufSlcbmNsYXNzIFRlc3REQiB7XG5cbiAgICAvLyBQcmltYXJ5IGtleVxuICAgIEBpZCh7XG4gICAgICAgIG5hbWU6ICd2cGF0aCcsIGRidHlwZTogJ1RFWFQnXG4gICAgfSlcbiAgICBAaW5kZXgoJ2Fzc2V0X3ZwYXRoJylcbiAgICB2cGF0aDogc3RyaW5nO1xuXG4gICAgQGZpZWxkKHtcbiAgICAgICAgbmFtZTogJ2luZm8nLCBkYnR5cGU6ICdKU09OJywgaXNKc29uOiB0cnVlXG4gICAgfSlcbiAgICBpbmZvPzogYW55O1xufVxuXG5cbmF3YWl0IHNjaGVtYSgpLmNyZWF0ZVRhYmxlKHNxZGIsICdURVNUJyk7XG50eXBlIFRhc3NldHNEQU8gPSBCYXNlREFPPFRlc3REQj47XG5jb25zdCBhc3NldHNEQU86IFRhc3NldHNEQU9cbiAgICA9IG5ldyBCYXNlREFPPFRlc3REQj4oVGVzdERCLCBzcWRiKTtcblxuY29uc3QgZnVsbG9iaiA9IGF3YWl0IGFzc2V0c0RBTy5pbnNlcnQoe1xuICAgIHZwYXRoOiAnL3BhdGgvdG8vcGFyYWRpc2UnLFxuICAgIGluZm86IHtcbiAgICAgICAgZnNwYXRoOiAnL3BhdGgvdG8vZG9jcy9wYXRoL3RvL3BhcmFkaXNlJyxcbiAgICAgICAgdGFnczogW1xuICAgICAgICAgICAgJ0xpbnV4JyxcbiAgICAgICAgICAgICdDZWxsIFBob25lJyxcbiAgICAgICAgICAgICdQaW5lJ1xuICAgICAgICBdXG4gICAgfVxufSk7XG5cbmNvbnN0IG5vaW5mbyA9IGF3YWl0IGFzc2V0c0RBTy5pbnNlcnQoe1xuICAgIHZwYXRoOiAnbm8gaW5mbydcbn0pO1xuXG5jb25zdCBub3RhZ3MgPSBhd2FpdCBhc3NldHNEQU8uaW5zZXJ0KHtcbiAgICB2cGF0aDogJ25vIHRhZ3MnLFxuICAgIGluZm86IHtcbiAgICAgICAgZnNwYXRoOiAnL3BhdGgvdG8vbm8gdGFncydcbiAgICB9XG59KTtcblxuY29uc29sZS5sb2coYXdhaXQgYXNzZXRzREFPLnNlbGVjdEFsbCh7XG4gICAgaW5mbzogeyBpc05vdE51bGw6IHRydWUgfVxufSkpO1xuXG4vLyBEb2VzIG5vdCB3b3JrXG4vL1xuLy8gRXJyb3I6IHNlbGVjdCAnVEVTVCcgZmFpbGVkOiB1bmtub3duIGNvbXBhcmlzb24gb3BlcmF0aW9uOiAndGFncydcbi8vIGF0IFF1ZXJ5TW9kZWwuc2VsZWN0QWxsICgvaG9tZS9kYXZpZC9Qcm9qZWN0cy9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL25vZGVfbW9kdWxlcy9zcWxpdGUzb3JtL3NyYy9saWIvcXVlcnkvUXVlcnlNb2RlbC5qczo5NTozNSlcbi8vIGF0IGFzeW5jIGZpbGU6Ly8vaG9tZS9kYXZpZC9Qcm9qZWN0cy9ha2FzaGFyZW5kZXIvYWthc2hhcmVuZGVyL2Rpc3QvY2FjaGUvdGpzb24uanM6NTg6MTNcbi8vXG4vLyBjb25zb2xlLmxvZyhhd2FpdCBhc3NldHNEQU8uc2VsZWN0QWxsKHtcbi8vICAgICBpbmZvOiB7XG4vLyAgICAgICAgIHRhZ3M6IHtcbi8vICAgICAgICAgICAgIGlzTm90TnVsbDogdHJ1ZSBcbi8vICAgICAgICAgfVxuLy8gICAgIH1cbi8vIH0pKTtcblxuY29uc29sZS5sb2coYXdhaXQgYXNzZXRzREFPLnNlbGVjdEFsbCh7fSkpO1xuXG5cbmNvbnNvbGUubG9nKGF3YWl0IGFzc2V0c0RBTy5zZWxlY3QoZnVsbG9iaikpO1xuY29uc29sZS5sb2coYXdhaXQgYXNzZXRzREFPLnNlbGVjdChub2luZm8pKTtcbmNvbnNvbGUubG9nKGF3YWl0IGFzc2V0c0RBTy5zZWxlY3Qobm90YWdzKSk7XG5cbi8vIGNvbnNvbGUubG9nKGF3YWl0IHNxZGIucnVuKCcuc2NoZW1hJykpO1xuXG5jb25zb2xlLmxvZyhhd2FpdCBzcWRiLmFsbCgnU0VMRUNUICogRlJPTSBURVNULCBqc29uX2VhY2goVEVTVC5pbmZvKScpKSJdfQ==