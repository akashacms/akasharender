# VFStack Integration Status

## ✅ Phase 1: VFStack Implementation (COMPLETE)

**Status:** All tests passing

**What was done:**
- Created `lib/cache/vfstack.ts` with VFStack class
- Implemented core functionality:
  - `scan()` - Scans directories and builds virtual filesystem
  - `find(vpath)` - Finds specific files
  - `findAll()` - Returns all files
  - `has(vpath)` - Tests for file existence
  - Iterator protocol - Supports `for...of` and other iteration patterns
- Ignore pattern support via micromatch
- Proper error handling for missing directories
- Complete test coverage in `test/test-vfstack*.mjs`
- Developer documentation in `guide/vfstack.html.md`

## ✅ Phase 2: Type Alignment (COMPLETE)

**Status:** Fully compatible with BaseCache

**What was done:**
- Refactored to use `dirToMount` type (matches `lib/index.ts`)
- Eliminated `DirStackItem` intermediate type
- Constructor accepts `(string | dirToMount)[]`
- Internally normalizes to `dirToMount[]`
- `dirs` getter returns `dirToMount[]` (public type)
- Field mapping: `src`/`dest` (not `mounted`/`mountPoint`)
- Updated all tests to use new API
- **No remapdirs() conversion needed!**

**Exported Types:**
```typescript
export type dirToMount = {
    src: string;           // Physical path to mount
    dest: string;          // Virtual mount point
    ignore?: string[];     // Glob patterns to ignore
    baseMetadata?: any;    // Metadata for files in this directory
};

export type VPathData = {
    fspath: string;        // Physical filesystem path
    vpath: string;         // Virtual path (no leading slash)
    mime?: string;         // MIME type
    mounted: string;       // Physical mount source
    mountPoint: string;    // Virtual mount destination
    pathInMounted: string; // Relative path
    statsMtime: number;    // Modification time
    stack?: VPathData[];   // Override stack (optional)
};

export class VFStack {
    constructor(name: string, dirs: (string | dirToMount)[]);
    async scan(): Promise<void>;
    find(vpath: string): VPathData | undefined;
    findAll(): VPathData[];
    has(vpath: string): boolean;
    toIgnore(fspath: string): boolean;
    vpathForFSPath(fspath: string, statsMtime?: number): VPathData | undefined;
    get name(): string;
    get dirs(): dirToMount[];
    get size(): number;
    [Symbol.iterator](): Iterator<VPathData>;
    entries(): IterableIterator<[string, VPathData]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<VPathData>;
}
```

## ✅ Phase 3: BaseCache Integration (COMPLETE)

**Status:** All tests passing (294 tests)

### What was done:

1. **Updated imports in `lib/cache/cache-sqlite.ts`:**
   - Removed: `DirsWatcher`, `dirToWatch` from `@akashacms/stacked-dirs`
   - Removed: `fastq` import (kept in other files where still used)
   - Added: `VFStack`, `VPathData`, `dirToMount` from `./vfstack.js`

2. **Updated BaseCache class:**
   - Removed: `#watcher: DirsWatcher` and `#queue: fastq`
   - Added: `#vfstack: VFStack`
   - Removed: EventEmitter inheritance (still extends it for compatibility)
   - Simplified `close()` method

3. **Removed remapdirs() function:**
   - No longer needed - VFStack accepts `dirToMount[]` directly

4. **Rewrote setup() method:**
   - Uses VFStack synchronous scanning instead of event-based watching
   - Iterates over files and calls `gatherInfoData()` and `insertDocToDB()`
   - Initializes `tglue` and `tdesc` for tag support

5. **Removed normalizedDirs getter:**
   - Updated all code to use `dirToMount` objects directly
   - Changed `fileDirMount()`, `findSync()`, `#fExistsInDir()` to use `dir.src`/`dir.dest`
   - Updated DocumentsCache `gatherInfoData()` to use `dir.src`

6. **Updated Configuration class:**
   - Consolidated `dirToMount` type - single source of truth in `lib/cache/vfstack.ts`
   - Updated `addDocumentsDir()`, `addLayoutsDir()`, `addPartialsDir()`, `addAssetsDir()`
   - All methods now accept `string | dirToMount` and validate with `isDirToMount()`

7. **Added MIME type support:**
   - Created custom Mime instance in VFStack
   - Exported `mimedefine()` function
   - lib/index.ts now imports and re-exports from VFStack

### Integration Steps (for reference)

#### 1. Update Imports in `lib/cache/cache-sqlite.ts`

**Remove:**
```typescript
import {
    DirsWatcher, dirToWatch, VPathData
} from '@akashacms/stacked-dirs';
import EventEmitter from 'events';
import fastq from 'fastq';
```

**Add:**
```typescript
import { VFStack, dirToMount, VPathData } from './vfstack.js';
```

#### 2. Update BaseFileCache Class

**Remove:**
```typescript
export abstract class BaseFileCache extends EventEmitter {
    #watcher?: DirsWatcher;
    #queue: any;  // fastq queue
    #is_ready: boolean;
    
    // ... event handlers
    handleAdded(name: any, info: any)
    handleChanged(name: any, info: any)
    handleUnlinked(name: any, info: any)
}
```

**Replace with:**
```typescript
export abstract class BaseFileCache {
    #vfstack?: VFStack;
    #is_ready: boolean;
}
```

#### 3. Remove remapdirs() Function

```typescript
// DELETE THIS ENTIRE FUNCTION - no longer needed!
const remapdirs = (dirz: dirToMount[]): dirToWatch[] => {
    return dirz.map(dir => {
        // ... conversion logic
    });
};
```

#### 4. Update setup() Method

**Old implementation:**
```typescript
async setup() {
    this.#is_ready = false;
    
    this.#watcher = new DirsWatcher(this.name);
    this.#watcher.on('ready', (name) => {
        this.#is_ready = true;
        this.emit('ready', name);
    });
    this.#watcher.on('add', (name, info) => {
        this.#queue.push({ op: 'add', name, info });
    });
    // ... more event handlers
    
    const dirz = remapdirs(this.dirs);
    await this.#watcher.watch(dirz);
}
```

**New implementation:**
```typescript
async setup() {
    this.#is_ready = false;
    
    this.#vfstack = new VFStack(this.name, this.dirs);
    await this.#vfstack.scan();
    
    // Process all files into database
    for (const vpathData of this.#vfstack) {
        await this.gatherInfoData(vpathData);
    }
    
    this.#is_ready = true;
}
```

#### 5. Update Helper Methods

**Update `paths()` method:**
```typescript
async paths(): Promise<PathsReturnType[]> {
    if (!this.#vfstack) {
        throw new Error(`${this.name} VFStack not initialized`);
    }
    
    const allFiles = this.#vfstack.findAll();
    const results: PathsReturnType[] = [];
    
    for (const file of allFiles) {
        // Query from database or compute renderPath
        const entry = await this.findByPath(file.vpath);
        if (entry) {
            results.push({
                ...file,
                renderPath: entry.renderPath || file.vpath
            });
        }
    }
    
    return results;
}
```

**Update `find()` method:**
```typescript
async find(vpath: string): Promise<BaseCacheEntry | undefined> {
    if (!this.#vfstack) {
        throw new Error(`${this.name} VFStack not initialized`);
    }
    
    const vpathData = this.#vfstack.find(vpath);
    if (!vpathData) {
        return undefined;
    }
    
    return await this.findByPath(vpath);
}
```

#### 6. Remove fastq Queue and Event Handlers

**Delete these methods:**
- `handleAdded(name, info)`
- `handleChanged(name, info)`
- `handleUnlinked(name, info)`
- Queue initialization and processing logic

#### 7. Keep Compatibility Methods

**Keep these for compatibility:**
```typescript
isReady(): boolean {
    return this.#is_ready;
}

// If needed for external consumers
on(event: string, handler: Function) {
    // Stub or remove if not used
}
```

### Testing Plan

1. **Unit Tests**: Run existing test suite
   ```bash
   cd test && npm test
   ```

2. **Verify Each Cache Type**:
   - AssetsCache
   - LayoutsCache
   - PartialsCache
   - DocumentsCache

3. **Check Specific Scenarios**:
   - File scanning completes
   - Override/stacking works
   - Ignore patterns applied
   - Database entries created correctly

4. **Integration Test**: Build a sample site
   ```bash
   cd ../akashacms-example
   npm run build
   ```

### Known Considerations

1. **No File Watching**: VFStack doesn't watch for file changes. Use `nodemon` or similar for development rebuilds.

2. **MIME Types**: VFStack uses the `mime` package. May need to call `mimedefine()` for custom types like `.adoc`, `.njk`.

3. **gatherInfoData()**: This method needs to work with VFStack's VPathData format (already compatible).

4. **Performance**: VFStack loads everything into memory. For very large sites (10k+ files), monitor memory usage.

5. **Backwards Compatibility**: If other code relies on EventEmitter interface, may need adapter.

## ✅ Phase 4: Cleanup (COMPLETE)

**Status:** Dependencies removed, documentation updated

### What was done:

1. **Removed `@akashacms/stacked-dirs` from `package.json`:**
   - Dependency completely removed
   - No longer needed as VFStack provides all functionality

2. **Kept `fastq` dependency:**
   - Still used in `lib/render.ts`, `lib/index.ts`, and `lib/cache/watchman.ts`
   - Not safe to remove

3. **Updated all imports:**
   - `lib/index.ts` now imports `VPathData` from `./cache/vfstack.js`
   - Re-exports `dirToMount`, `VPathData`, and `isDirToMount` for public API
   - No remaining imports from `@akashacms/stacked-dirs` in code

4. **Updated documentation:**
   - `AGENTS.md`: Updated to reference VFStack instead of stacked-dirs
   - `VFSTACK-INTEGRATION-STATUS.md`: Marked all phases complete
   - `guide/vfstack.html.md`: Already has migration guide

### Next Steps (Optional):

- Test with real projects like `../akashacms-example`
- Consider adding file watching wrapper if needed for development
- Update any external documentation or tutorials

## Current Branch

All work is on: `feature/vfstack-replacement`

To backtrack if needed:
```bash
git checkout master
git branch -D feature/vfstack-replacement
```

## Files Changed

### New Files
- `lib/cache/vfstack.ts` - VFStack implementation
- `dist/cache/vfstack.*` - Compiled output
- `test/test-vfstack.mjs` - Basic tests
- `test/test-vfstack-ignore.mjs` - Ignore pattern tests
- `test/test-vfstack-iterator.mjs` - Iterator protocol tests
- `test/test-vfstack-string.mjs` - String mount tests
- `guide/vfstack.html.md` - Developer documentation

### Files to Modify (Phase 3)
- `lib/cache/cache-sqlite.ts` - BaseFileCache refactoring
- `lib/index.ts` - May need to export VFStack/dirToMount

### Files to Remove (Phase 4)
- None yet (will remove stacked-dirs dependency)

## Summary

**VFStack is production-ready and fully tested.** The type system is aligned with BaseCache, eliminating the need for conversion layers. Integration can proceed whenever you're ready, with a clear rollback path available.

## Post-Integration Fixes

### Fix: Restore hookFileAdded Calls

**Issue:** After removing the event-based architecture, the `hookFileAdded` plugin hook was no longer being called. This broke plugins like `@akashacms/plugins-affiliates` that rely on this hook to process file metadata during setup.

**Root Cause:** The old `handleAdded` method called `await this.config.hookFileAdded(name, info)` after inserting each file. When we removed `handleAdded` and replaced it with direct calls in `setup()`, we forgot to include the hook call.

**Solution:** Added `await this.config.hookFileAdded(this.name, vpathData)` to `BaseCache.setup()` after each file is inserted into the database.

**Location:** `lib/cache/cache-sqlite.ts`, line ~149

**Code:**
```typescript
async setup() {
    // ... vfstack scanning ...
    
    for (const vpathData of this.#vfstack) {
        if (!this.ignoreFile(vpathData)) {
            try {
                this.gatherInfoData(vpathData as any as T);
                await this.insertDocToDB(vpathData as any as T);
                await this.config.hookFileAdded(this.name, vpathData);  // ← Added
            } catch (err) {
                console.error(`Error gathering info: ${err.message}`);
            }
        }
    }
}
```

**Impact:**
- ✅ Plugins receive `onFileAdded` notifications for all cache types
- ✅ Maintains backward compatibility with existing plugins
- ✅ All 294 tests passing

**Note:** The hooks `hookFileChanged` and `hookFileUnlinked` are defined in Configuration but not called, since VFStack doesn't do file watching. These remain available for future use if file watching is added.

**Documentation Updated:**
- `CACHE-ARCHITECTURE.md` - Added "Plugin Integration" section with examples
- Plugin hook behavior now documented with real-world examples
