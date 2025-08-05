import { Database } from 'sqlite3';
export declare class TagGlue {
    #private;
    get db(): Database;
    init(db: Database): Promise<void>;
    addTagGlue(vpath: string, tags: string[]): Promise<void>;
    deleteTagGlue(vpath: any): Promise<void>;
    tags(): Promise<string[]>;
    pathsForTag(tagName: string | string[]): Promise<string[]>;
}
//# sourceMappingURL=tag-glue.d.ts.map