import { AsyncDatabase } from 'promised-sqlite3';
export declare class TagGlue {
    #private;
    get db(): AsyncDatabase;
    init(db: AsyncDatabase): Promise<void>;
    addTagGlue(vpath: string, tags: string[]): Promise<void>;
    deleteTagGlue(vpath: string): Promise<void>;
    tags(): Promise<string[]>;
    pathsForTag(tagName: string | string[]): Promise<string[]>;
}
export declare class TagDescriptions {
    #private;
    get db(): AsyncDatabase;
    init(db: AsyncDatabase): Promise<void>;
    addDesc(tag: string, description: string): Promise<void>;
    deleteDesc(tag: string): Promise<void>;
    getDesc(tag: string): Promise<string | undefined>;
}
//# sourceMappingURL=tag-glue-new.d.ts.map