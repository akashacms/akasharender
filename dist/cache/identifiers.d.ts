export declare function quoteSimpleIdentifier(name: string): string;
export declare function backtickQuoteSimpleIdentifier(name: string): string;
export declare function quoteIdentifiers(name: string): string[];
export declare function quoteIdentifier(name: string): string;
export declare function unqualifyIdentifier(name: string): string;
export declare function quoteAndUnqualifyIdentifier(name: string): string;
export declare function qualifiySchemaIdentifier(name: string, schema?: string): string;
export declare function splitSchemaIdentifier(name: string): {
    identName: string;
    identSchema?: string;
};
//# sourceMappingURL=identifiers.d.ts.map