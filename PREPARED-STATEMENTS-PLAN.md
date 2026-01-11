# Plan: Migrate to Prepared SQL Statements

## Overview

This document outlines a plan to migrate from executing SQL as text strings to using prepared statements via the `promised-sqlite3` library's `AsyncStatement` API. This change will improve performance by allowing SQLite to parse and optimize SQL queries only once, rather than on every execution.

## Current Architecture

### How SQL is Currently Used

1. **SQL Storage**: SQL text is loaded from `.sql` files and stored in private class fields:
   ```typescript
   #insertDocAssets;  // Stores SQL text as string
   ```

2. **Lazy Loading**: SQL is loaded from disk the first time it's needed:
   ```typescript
   if (!this.#insertDocAssets) {
       this.#insertDocAssets = await fsp.readFile(
           path.join(import.meta.dirname, 'sql', 'insert-doc-assets.sql'),
           'utf-8'
       );
   }
   ```

3. **Execution**: SQL text is passed to database methods with parameters:
   ```typescript
   await this.db.run(this.#insertDocAssets, {
       $vpath: info.vpath,
       $mime: info.mime,
       // ... more parameters
   });
   ```

### Database Methods Used

The code uses these `AsyncDatabase` methods:
- `db.run(sql, params)` - Execute SQL that modifies data (INSERT, UPDATE, DELETE)
- `db.get(sql, params)` - Fetch single row
- `db.all(sql, params)` - Fetch all matching rows
- `db.each(sql, params, callback)` - Iterate over rows (rarely used)

### Files Affected

**Main file:**
- `lib/cache/cache-sqlite.ts` - Contains BaseCache and all cache subclasses

**SQL files directory:**
- `lib/cache/sql/*.sql` - 36 SQL files

**Supporting files:**
- `lib/cache/tag-glue.ts` - Uses AsyncDatabase
- `lib/cache/schema.ts` - Type definitions

## Proposed Architecture

### AsyncStatement API

The `promised-sqlite3` library provides `AsyncStatement` with these methods:

```typescript
class AsyncStatement {
    // Preparation (done once)
    constructor(statement: sqlite3.Statement);
    
    // Execution (done many times)
    run(...params: unknown[]): Promise<sqlite3.RunResult>;
    get<T>(...params: unknown[]): Promise<T | undefined>;
    all<T>(...params: unknown[]): Promise<T[]>;
    
    // Parameter binding
    bind(...params: unknown[]): Promise<void>;
    
    // Lifecycle
    reset(): Promise<void>;
    finalize(): Promise<void>;
}

// Database method to create statements
db.prepare(sql: string, ...params: unknown[]): Promise<AsyncStatement>;
```

### New Pattern

1. **Statement Storage**: Store prepared statements instead of SQL text:
   ```typescript
   #insertDocAssetsStmt?: AsyncStatement;
   ```

2. **Lazy Preparation**: Prepare statement the first time it's needed:
   ```typescript
   if (!this.#insertDocAssetsStmt) {
       const sql = await fsp.readFile(
           path.join(import.meta.dirname, 'sql', 'insert-doc-assets.sql'),
           'utf-8'
       );
       this.#insertDocAssetsStmt = await this.db.prepare(sql);
   }
   ```

3. **Execution**: Use prepared statement methods:
   ```typescript
   await this.#insertDocAssetsStmt.run({
       $vpath: info.vpath,
       $mime: info.mime,
       // ... more parameters
   });
   ```

4. **Cleanup**: Finalize statements when closing:
   ```typescript
   async close() {
       if (this.#insertDocAssetsStmt) {
           await this.#insertDocAssetsStmt.finalize();
           this.#insertDocAssetsStmt = undefined;
       }
       // ... finalize other statements
       await this.#db.close();
   }
   ```

## Implementation Plan

### Phase 1: Infrastructure Setup

#### 1.1 Add AsyncStatement Import

**File:** `lib/cache/cache-sqlite.ts`

```typescript
import { Database } from 'sqlite3';
import { AsyncDatabase, AsyncStatement } from 'promised-sqlite3';
```

#### 1.2 Create Helper Method for Statement Preparation

Add to `BaseCache` class:

```typescript
/**
 * Helper to prepare a SQL statement from a file.
 * Loads the SQL file and prepares it for execution.
 * 
 * @param filename - SQL filename (without path)
 * @returns Prepared statement
 */
protected async prepareSQL(filename: string): Promise<AsyncStatement> {
    const sql = await fsp.readFile(
        path.join(import.meta.dirname, 'sql', filename),
        'utf-8'
    );
    return await this.db.prepare(sql);
}
```

This reduces boilerplate in each method.

#### 1.3 Update BaseCache.close()

Add statement cleanup:

```typescript
async close() {
    // Subclasses should override and finalize their statements
    // before calling super.close()
    
    this.removeAllListeners('changed');
    this.removeAllListeners('added');
    this.removeAllListeners('unlinked');
    this.removeAllListeners('ready');

    try {
        await this.#db.close();
    } catch (err) {
        // console.warn(`${this.name} error on close ${err.message}`);
    }
}
```

### Phase 2: Migrate BaseCache Methods

#### 2.1 Convert findPathMounted

**Current:**
```typescript
protected findPathMountedSQL = new Map<string,string>();

async findPathMounted(vpath: string, mounted: string) {
    let sql = this.findPathMountedSQL.get(this.dbname);
    if (!sql) {
        sql = SqlString.format(
            await fsp.readFile(..., 'utf-8'),
            [ this.dbname ]
        );
        this.findPathMountedSQL.set(this.dbname, sql);
    }
    const found = <any[]>await this.db.all(sql, {
        $vpath: vpath,
        $mounted: mounted
    });
    return this.validateRows(found);
}
```

**New:**
```typescript
#findPathMountedStmt?: AsyncStatement;

async findPathMounted(vpath: string, mounted: string) {
    if (!this.#findPathMountedStmt) {
        const sqlTemplate = await fsp.readFile(
            path.join(import.meta.dirname, 'sql', 'find-path-mounted.sql'),
            'utf-8'
        );
        const sql = SqlString.format(sqlTemplate, [ this.dbname ]);
        this.#findPathMountedStmt = await this.db.prepare(sql);
    }
    
    const found = <any[]>await this.#findPathMountedStmt.all({
        $vpath: vpath,
        $mounted: mounted
    });
    return this.validateRows(found);
}
```

**Note:** This uses `SqlString.format()` for table name substitution, which must happen before preparation.

#### 2.2 Convert paths() Method

**Current:**
```typescript
async paths(rootPath?: string): Promise<PathsReturnType[]> {
    // ... setup code ...
    
    const found = rootPath
        ? <any[]>await this.db.all(sqlRootP, { $rootPath: rootPath })
        : <any[]>await this.db.all(sqlNoRoot);
    
    return this.validateRows(found).map(row => this.cvtRowToObj(row));
}
```

**New:**
```typescript
#pathsRootStmt?: AsyncStatement;
#pathsNoRootStmt?: AsyncStatement;

async paths(rootPath?: string): Promise<PathsReturnType[]> {
    if (rootPath) {
        if (!this.#pathsRootStmt) {
            const sql = SqlString.format(
                await fsp.readFile(..., 'utf-8'),
                [ this.dbname ]
            );
            this.#pathsRootStmt = await this.db.prepare(sql);
        }
        const found = <any[]>await this.#pathsRootStmt.all({ $rootPath: rootPath });
        return this.validateRows(found).map(row => this.cvtRowToObj(row));
    } else {
        if (!this.#pathsNoRootStmt) {
            const sql = SqlString.format(
                await fsp.readFile(..., 'utf-8'),
                [ this.dbname ]
            );
            this.#pathsNoRootStmt = await this.db.prepare(sql);
        }
        const found = <any[]>await this.#pathsNoRootStmt.all();
        return this.validateRows(found).map(row => this.cvtRowToObj(row));
    }
}
```

### Phase 3: Migrate Cache Subclasses

#### 3.1 AssetsCache

**Statements to convert:**
- `#insertDocAssets` → `#insertDocAssetsStmt`
- `#updateDocAssets` → `#updateDocAssetsStmt`

**New close() method:**
```typescript
async close() {
    if (this.#insertDocAssetsStmt) {
        await this.#insertDocAssetsStmt.finalize();
    }
    if (this.#updateDocAssetsStmt) {
        await this.#updateDocAssetsStmt.finalize();
    }
    await super.close();
}
```

**Pattern for insertDocToDB:**
```typescript
#insertDocAssetsStmt?: AsyncStatement;

protected async insertDocToDB(info: Asset) {
    if (!this.#insertDocAssetsStmt) {
        this.#insertDocAssetsStmt = await this.prepareSQL('insert-doc-assets.sql');
    }
    
    await this.#insertDocAssetsStmt.run({
        $vpath: info.vpath,
        $mime: info.mime,
        $mounted: info.mounted,
        $mountPoint: info.mountPoint,
        $pathInMounted: info.pathInMounted,
        $fspath: path.join(info.mounted, info.pathInMounted),
        $dirname: path.dirname(info.vpath),
        $mtimeMs: info.mtimeMs,
        $info: JSON.stringify(info)
    });
}
```

#### 3.2 PartialsCache

**Statements to convert:**
- `#insertDocPartials` → `#insertDocPartialsStmt`
- `#updateDocPartials` → `#updateDocPartialsStmt`

Same pattern as AssetsCache.

#### 3.3 LayoutsCache

**Statements to convert:**
- `#insertDocLayouts` → `#insertDocLayoutsStmt`
- `#updateDocLayouts` → `#updateDocLayoutsStmt`

Same pattern as AssetsCache.

#### 3.4 DocumentsCache

**Statements to convert:**
- `#insertDocDocuments` → `#insertDocDocumentsStmt`
- `#insertLembedDocuments` → `#insertLembedDocumentsStmt`
- `#updateDocDocuments` → `#updateDocDocumentsStmt`
- `#updateLembedDocuments` → `#updateLembedDocumentsStmt`
- `#searchSemantic` → `#searchSemanticStmt`
- `#siblingsSQL` → `#siblingsStmt`
- `#docsForDirname` → `#docsForDirnameStmt`
- `#dirsForParentdir` → `#dirsForParentdirStmt`
- `#indexFilesSQL` → `#indexFilesStmt`
- `#indexFilesSQLrenderPath` → `#indexFilesRenderPathStmt`
- `#filesForSetTimes` → `#filesForSetTimesStmt`
- `#docLinkData` → `#docLinkDataStmt`

**New close() method:**
```typescript
async close() {
    // Finalize all prepared statements
    const statements = [
        this.#insertDocDocumentsStmt,
        this.#insertLembedDocumentsStmt,
        this.#updateDocDocumentsStmt,
        this.#updateLembedDocumentsStmt,
        this.#searchSemanticStmt,
        this.#siblingsStmt,
        this.#docsForDirnameStmt,
        this.#dirsForParentdirStmt,
        this.#indexFilesStmt,
        this.#indexFilesRenderPathStmt,
        this.#filesForSetTimesStmt,
        this.#docLinkDataStmt
    ];
    
    for (const stmt of statements) {
        if (stmt) {
            await stmt.finalize();
        }
    }
    
    await super.close();
}
```

### Phase 4: Migrate TagGlue and TagDescriptions

#### 4.1 TagGlue (lib/cache/tag-glue.ts)

**Current statements:**
- SQL loaded inline in methods

**Convert to:**
```typescript
#insertStmt?: AsyncStatement;
#deleteStmt?: AsyncStatement;
#selectVpathStmt?: AsyncStatement;
#selectAllStmt?: AsyncStatement;

async init(db: AsyncDatabase) {
    this.#db = db;
    await this.db.run(await createTableTagglue);
    
    // Prepare statements
    this.#insertStmt = await this.db.prepare(
        await fsp.readFile(..., 'insert-tagglue.sql', 'utf-8')
    );
    this.#deleteStmt = await this.db.prepare(
        await fsp.readFile(..., 'delete-tagglue.sql', 'utf-8')
    );
    // ... prepare others
}

async close() {
    if (this.#insertStmt) await this.#insertStmt.finalize();
    if (this.#deleteStmt) await this.#deleteStmt.finalize();
    // ... finalize others
}
```

#### 4.2 TagDescriptions (lib/cache/tag-glue.ts)

Similar pattern to TagGlue.

### Phase 5: Handle Special Cases

#### 5.1 Dynamic SQL with SqlString.format()

Some queries use `SqlString.format()` to substitute table names:

```typescript
const sql = SqlString.format(
    await fsp.readFile(..., 'utf-8'),
    [ this.dbname ]  // Substitutes table name
);
```

**Solution:** Format BEFORE preparing:
```typescript
if (!this.#someStmt) {
    const template = await fsp.readFile(..., 'utf-8');
    const sql = SqlString.format(template, [ this.dbname ]);
    this.#someStmt = await this.db.prepare(sql);
}
```

#### 5.2 Map-based Statement Storage

Current code uses Maps for some statements:

```typescript
protected findPathMountedSQL = new Map<string,string>();
```

**New approach:**
```typescript
#stmtCache = new Map<string, AsyncStatement>();

async close() {
    for (const stmt of this.#stmtCache.values()) {
        await stmt.finalize();
    }
    this.#stmtCache.clear();
    await super.close();
}
```

#### 5.3 Conditional Statement Execution

Some methods have conditional logic:

```typescript
const found = rootPath
    ? await this.db.all(sqlRootP, { $rootPath: rootPath })
    : await this.db.all(sqlNoRoot);
```

**Solution:** Prepare both statements, use conditionally:
```typescript
const found = rootPath
    ? await this.#pathsRootStmt.all({ $rootPath: rootPath })
    : await this.#pathsNoRootStmt.all();
```

### Phase 6: Search and Replace Methodology

#### 6.1 Inventory All SQL Variables

Create a complete list of all SQL-storing variables:

```bash
cd /home/david/Projects/akasharender/akasharender
rg "^    #\w+;" lib/cache/cache-sqlite.ts | grep -v "Stmt"
```

Expected to find ~25-30 variables across all cache classes.

#### 6.2 Conversion Checklist

For each SQL variable:

- [ ] Rename: `#varName` → `#varNameStmt?: AsyncStatement`
- [ ] Update initialization: Load SQL → Prepare statement
- [ ] Update execution: `this.db.method(sql, ...)` → `this.#varNameStmt.method(...)`
- [ ] Add to `close()`: Finalize statement
- [ ] Update TypeScript types if needed
- [ ] Test the specific functionality

#### 6.3 Systematic Approach

Work through files in this order:
1. `BaseCache` methods (affects all subclasses)
2. `AssetsCache` (simplest subclass)
3. `PartialsCache` (similar to Assets)
4. `LayoutsCache` (similar to Assets)
5. `DocumentsCache` (most complex - has many statements)
6. `TagGlue` class
7. `TagDescriptions` class

### Phase 7: Testing Strategy

#### 7.1 Unit Testing

Run existing test suite after each cache class conversion:

```bash
cd test && npm test
```

Expected: All 294 tests should pass after each phase.

#### 7.2 Integration Testing

Test with real projects:
```bash
cd ../akashacms-example
npm run build
```

#### 7.3 Performance Testing

Before and after benchmarks:

```bash
# Add timing to setup
console.time('Cache Setup');
await filecache.setup(config, db);
console.timeEnd('Cache Setup');

# Add timing to render
console.time('Render All');
await akasha.render(config);
console.timeEnd('Render All');
```

Expected improvement: 5-15% faster for large sites (1000+ files).

#### 7.4 Memory Testing

Monitor memory usage during build:

```bash
node --expose-gc --trace-gc your-build-script.js
```

Expected: Slightly lower memory usage due to more efficient SQLite internals.

## Benefits Analysis

### Performance Improvements

1. **SQL Parsing**: Parse each query once instead of hundreds/thousands of times
2. **Query Plan Optimization**: SQLite optimizes prepared statements better
3. **Parameter Binding**: More efficient than string interpolation

**Estimated Impact:**
- Small sites (< 100 files): Negligible (< 1% improvement)
- Medium sites (100-1000 files): 5-10% improvement
- Large sites (1000+ files): 10-15% improvement

### Code Quality

1. **Type Safety**: AsyncStatement is properly typed
2. **Error Handling**: Separation of prepare-time vs execute-time errors
3. **Resource Management**: Explicit cleanup via finalize()

### Security

Prepared statements offer slightly better protection against SQL injection, though the current parameterized queries are already safe.

## Risks and Mitigation

### Risk 1: Statement Lifecycle Management

**Risk:** Forgetting to finalize statements leads to resource leaks.

**Mitigation:**
- Add comprehensive cleanup in `close()` methods
- Use a helper method to track statements
- Add tests that verify `close()` is called

### Risk 2: Breaking Changes During Migration

**Risk:** Introducing bugs while converting SQL execution.

**Mitigation:**
- Convert one cache class at a time
- Run tests after each conversion
- Keep git commits small and focused
- Easy rollback if issues found

### Risk 3: Compatibility Issues

**Risk:** `promised-sqlite3` might have quirks with prepared statements.

**Mitigation:**
- Test thoroughly with existing test suite
- Check library documentation and issues
- Have rollback plan ready

### Risk 4: Increased Complexity

**Risk:** More code to manage (statements + cleanup).

**Mitigation:**
- Create helper methods to reduce boilerplate
- Document the pattern clearly
- Keep naming consistent

## Migration Checklist

### Pre-Migration
- [ ] Create feature branch: `feature/prepared-statements`
- [ ] Verify all tests pass on current code
- [ ] Document current performance baseline
- [ ] Review `promised-sqlite3` documentation

### Migration Steps
- [ ] Phase 1: Infrastructure setup
- [ ] Phase 2: Migrate BaseCache
  - [ ] Test after each method conversion
- [ ] Phase 3: Migrate cache subclasses
  - [ ] AssetsCache + tests
  - [ ] PartialsCache + tests
  - [ ] LayoutsCache + tests
  - [ ] DocumentsCache + tests
- [ ] Phase 4: Migrate TagGlue/TagDescriptions
- [ ] Phase 5: Handle special cases
- [ ] Full test suite passes
- [ ] Performance testing
- [ ] Integration testing with real projects

### Post-Migration
- [ ] Update documentation
- [ ] Commit with detailed message
- [ ] Performance comparison report
- [ ] Merge to main branch

## Rollback Plan

If issues are encountered:

```bash
# Rollback to previous state
git checkout main
git branch -D feature/prepared-statements

# Or rollback specific file
git checkout main -- lib/cache/cache-sqlite.ts
```

## Code Pattern Reference

### Before (Current Pattern)
```typescript
#insertDocAssets;

protected async insertDocToDB(info: Asset) {
    if (!this.#insertDocAssets) {
        this.#insertDocAssets = await fsp.readFile(
            path.join(import.meta.dirname, 'sql', 'insert-doc-assets.sql'),
            'utf-8'
        );
    }
    await this.db.run(this.#insertDocAssets, {
        $vpath: info.vpath,
        $mime: info.mime
    });
}
```

### After (Prepared Statement Pattern)
```typescript
#insertDocAssetsStmt?: AsyncStatement;

protected async insertDocToDB(info: Asset) {
    if (!this.#insertDocAssetsStmt) {
        this.#insertDocAssetsStmt = await this.prepareSQL('insert-doc-assets.sql');
    }
    await this.#insertDocAssetsStmt.run({
        $vpath: info.vpath,
        $mime: info.mime
    });
}

async close() {
    if (this.#insertDocAssetsStmt) {
        await this.#insertDocAssetsStmt.finalize();
    }
    await super.close();
}
```

## Estimated Effort

- **Phase 1-2 (Infrastructure + BaseCache):** 2-4 hours
- **Phase 3 (Cache subclasses):** 4-6 hours
- **Phase 4 (TagGlue/TagDescriptions):** 1-2 hours
- **Phase 5 (Special cases):** 1-2 hours
- **Testing and verification:** 2-3 hours

**Total:** 10-17 hours of development work

## Conclusion

Migrating to prepared statements is a worthwhile optimization that:
- Improves performance, especially for large sites
- Maintains backward compatibility (no API changes)
- Follows SQLite best practices
- Has manageable implementation complexity

The migration can be done incrementally, with testing at each step, making it a low-risk improvement.
