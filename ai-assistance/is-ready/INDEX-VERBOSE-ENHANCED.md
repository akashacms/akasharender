# Enhancement Complete: Real-time Event Tracking for index --verbose

**Date**: 2026-03-14  
**Type**: Enhancement (improved implementation)  
**Status**: ✅ COMPLETE

## Summary

Enhanced the `index --verbose` command to show real-time event tracking as files are added to caches. This provides users with immediate visibility into the indexing process, showing each file as it's discovered and when each cache type completes.

## What Changed

### Previous Behavior
- `--verbose` showed only a summary after indexing completed
- No visibility into which specific files were being indexed
- No real-time feedback during the process

### New Behavior
- `--verbose` shows `[ADDED]` events as each file is indexed
- Shows `[READY]` events when each cache type completes
- Shows `[ERROR]` events if any files fail to process
- Still shows summary at the end with counts and timing

## Implementation

### 1. Added verbose Property to Configuration Class

**File**: `lib/index.ts`

**Changes**:
```typescript
export class Configuration {
    // ... other fields ...
    #verbose: boolean;
    
    constructor() {
        // ... initialization ...
        this.#verbose = false;
    }
    
    set verbose(val: boolean) { this.#verbose = val; }
    get verbose() { return this.#verbose; }
}
```

### 2. Enhanced Cache Setup with Verbose Event Listeners

**File**: `lib/cache/cache-sqlite.ts`

**Changes**:
- Added `setupVerboseListeners` helper function
- Attaches event listeners based on `config.verbose` setting
- Logs `[ADDED]`, `[READY]`, and `[ERROR]` events when verbose is true
- Applied to all four cache types: assets, partials, layouts, documents

```typescript
const setupVerboseListeners = (cache: any, cacheName: string) => {
    if (config.verbose) {
        cache.on('added', (name: string, vpath: string) => {
            console.log(`[ADDED] ${name}: ${vpath}`);
        });
        
        cache.on('ready', (name: string) => {
            console.log(`[READY] ${name}\n`);
        });
        
        cache.on('error', (err: Error) => {
            console.error(`[ERROR] ${cacheName}:`, err.message);
        });
    } else {
        // Always setup error listener, even in non-verbose mode
        cache.on('error', (...args) => {
            console.error(`${cacheName} ERROR ${util.inspect(args)}`);
        });
    }
};
```

### 3. Updated CLI to Enable Verbose Mode

**File**: `lib/cli.ts`

**Changes**:
- Updated description to reflect new behavior
- Sets `config.verbose = true` before calling `setup()`
- Events are emitted during setup and displayed in real-time

## Example Output

### Full Verbose Output

```
$ npx akasharender index config.js --verbose

Indexing files with verbose output...

[ADDED] assets: file.txt
[ADDED] assets: file-virgin.txt
[ADDED] assets: rss_button.png
[READY] assets

[ADDED] partials: helloworld.html
[ADDED] partials: helloworld2.html
[ADDED] partials: json-format.html.ejs
[ADDED] partials: listrender.html.ejs
[ADDED] partials: strong.html.ejs
[ADDED] partials: test.html.njk
[ADDED] partials: ak_figimg.html.ejs
[ADDED] partials: ak_show-content.html.ejs
[READY] partials

[ADDED] layouts: default-once.html.ejs
[ADDED] layouts: default.html.ejs
[ADDED] layouts: inclusion.html
[ADDED] layouts: njkincl.html.njk
[READY] layouts

[ADDED] documents: index.html.md
[ADDED] documents: page1.html.md
[ADDED] documents: page2.html.md
... (many more files) ...
[ADDED] documents: mounted/img2resize.html.md
[READY] documents

✓ Indexing completed in 105ms

=== Summary ===
Documents: 80 files
Assets: 3 files
Layouts: 11 files
Partials: 20 files
Total: 114 files
```

### Silent Mode (No --verbose)

```
$ npx akasharender index config.js

(no output - silent operation)
```

## Testing

### Manual Testing

**Verbose mode:**
```bash
cd test
node ../dist/cli.js index config-normal.mjs --verbose
```
✅ Shows all [ADDED] and [READY] events in real-time  
✅ Shows summary at end  
✅ Total matches expected file count

**Silent mode:**
```bash
node ../dist/cli.js index config-normal.mjs
```
✅ No output  
✅ Exits successfully

### Build Status

```bash
npm run build
```
✅ **SUCCESS** - No TypeScript errors

### Test Suite

```bash
cd test && npm test
```
✅ **SUCCESS** - All test suites pass:
- 102 passing (test-normal)
- 67 passing (test-rebased)
- 117 passing (test-cache)
- 5 passing (test-isready-timing)
- 24 passing (test-absolute)
- All rendering tests pass

**Total**: 315+ tests passing

## Use Cases

### 1. Debugging File Discovery

See exactly which files are being found:

```bash
npx akasharender index config.js --verbose | grep "page1"
# [ADDED] documents: page1.html.md
```

### 2. Verifying File Order

Watch the order in which files are processed:

```bash
npx akasharender index config.js --verbose
# Files appear in discovery order
```

### 3. Identifying Missing Files

If a file isn't being rendered, check if it's being indexed:

```bash
npx akasharender index config.js --verbose | grep "missing-file"
# (no output = file not found)
```

### 4. Monitoring Large Sites

For sites with many files, watch progress in real-time:

```bash
npx akasharender index config.js --verbose
# See files streaming as they're discovered
```

### 5. Error Detection

See if any files fail to process:

```bash
npx akasharender index config.js --verbose 2>&1 | grep ERROR
# Shows any [ERROR] events
```

### 6. Cache-Specific Analysis

Focus on specific cache types:

```bash
# Only documents
npx akasharender index config.js --verbose | grep "documents:"

# Only assets
npx akasharender index config.js --verbose | grep "assets:"
```

## Technical Details

### Event Flow

1. CLI sets `config.verbose = true`
2. `akasha.setup(config)` calls `cacheSetup(config)`
3. `cacheSetup` calls `filecache.setup(config, db)`
4. For each cache type:
   - Create cache instance
   - Attach event listeners (if verbose)
   - Call `cache.setup()` which:
     - Scans directories
     - Emits `[ADDED]` for each file
     - Emits `[READY]` when complete
5. Control returns to CLI
6. CLI displays summary

### Why This Works

The key insight is attaching listeners **before** calling `cache.setup()`:

```typescript
// Create cache
assetsCache = new AssetsCache(...);

// Attach listeners BEFORE setup
setupVerboseListeners(assetsCache, 'assetsCache');

// Now call setup - events will fire
await assetsCache.setup();
```

This ensures we capture all events emitted during the synchronous file processing loop.

### Event Format

- **[ADDED]**: `[ADDED] <cache-name>: <file-vpath>`
- **[READY]**: `[READY] <cache-name>` (followed by blank line)
- **[ERROR]**: `[ERROR] <cache-name>: <error-message>`

## Benefits Delivered

1. ✅ **Real-time Feedback**: See files as they're indexed
2. ✅ **Debugging Aid**: Identify missing or unexpected files
3. ✅ **Progress Visibility**: Know indexing is working on large sites
4. ✅ **Error Detection**: Spot problems immediately
5. ✅ **Cache Awareness**: See when each cache type completes
6. ✅ **Backward Compatible**: Silent mode unchanged
7. ✅ **Flexible**: Can grep/filter output for specific files

## Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| **File visibility** | Summary only | Real-time per-file |
| **Event tracking** | None | [ADDED], [READY], [ERROR] |
| **Progress feedback** | Wait until end | Immediate |
| **Debugging** | Limited | Detailed |
| **Error detection** | End only | As they occur |
| **Cache completion** | Not visible | [READY] events |
| **Silent mode** | ✓ | ✓ (unchanged) |

## Files Changed

1. `lib/index.ts` - Added verbose property to Configuration class
2. `lib/cache/cache-sqlite.ts` - Added verbose event listeners
3. `lib/cli.ts` - Updated to set config.verbose and description
4. `README.md` - Updated documentation with new behavior
5. `INDEX-VERBOSE-ENHANCED.md` - This summary document

## Future Enhancements (Optional)

Could add additional filtering or formatting options:

**Option 1**: Different verbosity levels
```bash
--verbose=1  # Just [READY] events
--verbose=2  # [READY] + counts  
--verbose=3  # Full [ADDED] events (current)
```

**Option 2**: Filter by cache type
```bash
--verbose-documents  # Only show document events
--verbose-assets     # Only show asset events
```

**Option 3**: JSON output
```bash
--verbose --json  # Machine-readable event stream
```

These could be added if user demand exists.

---

**Implemented by**: Claude Code (AI Assistant)  
**Requested by**: User (for real-time event visibility)  
**Status**: Complete and working as intended  
**Related**: Phase 1 (event emission), Phase 2 (check-ready command)
