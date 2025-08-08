import { Database } from 'sqlite3';
export declare class TagGlue {
    #private;
    get db(): Database;
    init(db: Database): Promise<void>;
    addTagGlue(vpath: string, tags: string[]): Promise<void>;
    deleteTagGlue(vpath: string): Promise<void>;
    tags(): Promise<string[]>;
    pathsForTag(tagName: string | string[]): Promise<string[]>;
}
export declare class TagDescriptions {
    #private;
    get db(): Database;
    init(db: Database): Promise<void>;
    addDesc(tag: string, description: string): Promise<void>;
    deleteDesc(tag: string): Promise<void>;
    getDesc(tag: string): Promise<string>;
}
//# sourceMappingURL=tag-glue.d.ts.map