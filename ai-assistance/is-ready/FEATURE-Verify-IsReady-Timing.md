# Feature: Verify isReady Timing is Correct

## Problem Statement

GitHub issue #127 described a race condition where the `isReady` event was triggered before all files were processed into the cache. This could cause rendering to begin with an incomplete file list, resulting in missing pages.

While the current implementation appears to have fixed this issue (by removing Chokidar and using synchronous processing), we need:

1. **Verification** that the issue is truly resolved
2. **Regression prevention** via automated tests
3. **Diagnostic tooling** for site authors to check their specific sites

## Background

### The Original Issue

When Chokidar and async event queues were used:
- `isReady` triggered when Chokidar finished scanning
- Files were still being processed asynchronously via `fastq`
- `paths()` could return incomplete results
- `render()` would miss files

### Current Implementation

In `lib/cache/cache-sqlite.ts`, the `BaseCache.setup()` method now:
- Awaits full VFStack scan
- Processes files sequentially with `for...of` and `await`
- Only sets `#is_ready = true` after all files are processed
- This should prevent the race condition

## Requested Functionality

### 1. Event Emission for File Addition

**Goal**: Emit an "added" event whenever a file is processed into the cache.

**Location**: `lib/cache/cache-sqlite.ts` - `BaseCache.setup()` method

**Implementation**:
```typescript
async setup() {
    this.#is_ready = false;

    this.#vfstack = new VFStack(this.name, this.dirs);
    await this.#vfstack.scan();

    for (const vpathData of this.#vfstack) {
        if (!this.ignoreFile(vpathData)) {
            try {
                this.gatherInfoData(vpathData as any as T);
                await this.insertDocToDB(vpathData as any as T);
                await this.config.hookFileAdded(this.name, vpathData);
                
                // NEW: Emit added event
                this.emit('added', this.name, vpathData.vpath);
            } catch (err) {
                console.error(`Error gathering info for ${vpathData.vpath}: ${err.message}`);
            }
        }
    }

    this.#is_ready = true;
    this.emit('ready', this.name);
}
```

**Rationale**: This allows external code to track when files are added relative to when "ready" is emitted, which is crucial for detecting the race condition.

### 2. CLI Command for Diagnostics

**Goal**: Add a `check-ready` command that site authors can run to verify isReady timing on their site.

**Location**: `lib/cli.ts`

**Implementation**:
```typescript
program
    .command('check-ready <configFN>')
    .description('Verify that all files are loaded before isReady triggers')
    .option('--verbose', 'Show detailed file-by-file tracking')
    .action(async (configFN, cmdObj) => {
        try {
            const config = (await import(
                path.join(process.cwd(), configFN)
            )).default;
            let akasha = config.akasha;
            
            // Track files added before and after ready
            const filesBeforeReady = {
                documents: new Set<string>(),
                assets: new Set<string>(),
                layouts: new Set<string>(),
                partials: new Set<string>()
            };
            
            const filesAfterReady = {
                documents: new Set<string>(),
                assets: new Set<string>(),
                layouts: new Set<string>(),
                partials: new Set<string>()
            };
            
            const readyFlags = {
                documents: false,
                assets: false,
                layouts: false,
                partials: false
            };
            
            // Setup event listeners BEFORE calling setup
            const setupListeners = (cache: any, cacheName: string) => {
                cache.on('added', (name: string, vpath: string) => {
                    if (cmdObj.verbose) {
                        console.log(`[ADDED] ${name}: ${vpath}`);
                    }
                    if (readyFlags[cacheName]) {
                        filesAfterReady[cacheName].add(vpath);
                        console.error(`⚠️  WARNING: File ${vpath} added to ${name} AFTER ready event!`);
                    } else {
                        filesBeforeReady[cacheName].add(vpath);
                    }
                });
                
                cache.on('ready', (name: string) => {
                    readyFlags[cacheName] = true;
                    if (cmdObj.verbose) {
                        console.log(`[READY] ${name}`);
                    }
                });
            };
            
            // We need to setup listeners before calling setup()
            // This requires refactoring to expose cache creation separately
            // OR we can check counts before/after with a delay
            
            console.log('Running isReady timing check...\n');
            
            // Capture initial state
            const startTime = Date.now();
            await akasha.setup(config);
            const setupTime = Date.now();
            
            // Get counts immediately after setup
            const filecache = akasha.filecache;
            const countsAfterSetup = {
                documents: (await filecache.documentsCache.paths()).length,
                assets: (await filecache.assetsCache.paths()).length,
                layouts: (await filecache.layoutsCache.paths()).length,
                partials: (await filecache.partialsCache.paths()).length
            };
            
            console.log(`✓ Setup completed in ${setupTime - startTime}ms`);
            console.log(`  Documents: ${countsAfterSetup.documents}`);
            console.log(`  Assets: ${countsAfterSetup.assets}`);
            console.log(`  Layouts: ${countsAfterSetup.layouts}`);
            console.log(`  Partials: ${countsAfterSetup.partials}`);
            
            // Wait 2 seconds to see if any additional files appear
            console.log('\nWaiting 2 seconds to check for late additions...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const countsAfterDelay = {
                documents: (await filecache.documentsCache.paths()).length,
                assets: (await filecache.assetsCache.paths()).length,
                layouts: (await filecache.layoutsCache.paths()).length,
                partials: (await filecache.partialsCache.paths()).length
            };
            
            // Compare counts
            let issueDetected = false;
            const checkCache = (name: string) => {
                const before = countsAfterSetup[name];
                const after = countsAfterDelay[name];
                if (before !== after) {
                    console.error(`\n❌ ISSUE DETECTED: ${name} count changed from ${before} to ${after}`);
                    console.error(`   This indicates files were added after isReady!`);
                    issueDetected = true;
                } else {
                    console.log(`✓ ${name}: ${before} files (stable)`);
                }
            };
            
            console.log('\nResults:');
            checkCache('documents');
            checkCache('assets');
            checkCache('layouts');
            checkCache('partials');
            
            if (!issueDetected) {
                console.log('\n✅ SUCCESS: No files added after isReady. Timing is correct.');
            } else {
                console.error('\n⚠️  FAILURE: Files were added after isReady triggered!');
                console.error('   This indicates a race condition that needs to be fixed.');
                process.exit(1);
            }
            
            await akasha.closeCaches();
        } catch (e) {
            console.error(`check-ready command ERRORED ${e.stack}`);
            process.exit(1);
        }
    });
```

**Rationale**: This provides a practical diagnostic tool that:
- Site authors can run on their specific configuration
- Works without requiring event listener setup (uses the count comparison approach)
- Provides clear success/failure indication
- Can be used in CI/CD pipelines

### 3. Automated Mocha Test

**Goal**: Add a test to prevent regression of the isReady timing issue.

**Location**: `test/test-cache.mjs`

**Implementation**:
```javascript
describe('isReady timing verification', function() {
    
    it('should not add files after ready event is emitted', async function() {
        this.timeout(10000);
        
        // Track events
        const addedBeforeReady = [];
        const addedAfterReady = [];
        let readyEmitted = false;
        
        // Listen to events on documentsCache
        const documents = filecache.documentsCache;
        
        documents.on('added', (name, vpath) => {
            if (readyEmitted) {
                addedAfterReady.push(vpath);
            } else {
                addedBeforeReady.push(vpath);
            }
        });
        
        documents.on('ready', (name) => {
            readyEmitted = true;
        });
        
        // Wait for ready (should already be ready from earlier tests)
        await documents.isReady();
        
        // Verify no files were added after ready
        assert.equal(addedAfterReady.length, 0, 
            `Files added after ready: ${addedAfterReady.join(', ')}`);
        
        // Verify some files were added before ready
        assert.isTrue(addedBeforeReady.length > 0,
            'Should have tracked some files being added');
    });
    
    it('should have stable file counts after isReady resolves', async function() {
        this.timeout(10000);
        
        const documents = filecache.documentsCache;
        await documents.isReady();
        
        // Get count immediately after isReady
        const countBefore = (await documents.paths()).length;
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Count should be the same
        const countAfter = (await documents.paths()).length;
        
        assert.equal(countBefore, countAfter,
            `File count changed from ${countBefore} to ${countAfter} after isReady`);
    });
});
```

**Note**: The first test requires the "added" event to be implemented. If we don't implement that event, we can rely solely on the second test (count stability).

**Rationale**: Automated tests prevent future regressions and document the expected behavior.

## Main Tasks

### Task 1: Add "added" Event Emission ✓

**Files**: `lib/cache/cache-sqlite.ts`

**Changes**:
1. In `BaseCache.setup()`, after successfully processing each file, emit an "added" event
2. Event signature: `this.emit('added', this.name, vpathData.vpath)`
3. This should happen for all four cache types (documents, assets, layouts, partials)

**Acceptance Criteria**:
- Event is emitted for each file successfully added to cache
- Event is emitted BEFORE the "ready" event
- Event includes cache name and vpath

### Task 2: Add CLI check-ready Command ✓

**Files**: `lib/cli.ts`

**Changes**:
1. Add new command `check-ready <configFN>`
2. Implement count-before-and-after-delay approach (as shown above)
3. Provide clear success/failure output
4. Exit with code 1 if issues detected

**Acceptance Criteria**:
- Command runs without errors on test configuration
- Detects when files are added after isReady (if artificially induced)
- Provides clear diagnostic output
- Can be run by site authors on their projects

### Task 3: Add Automated Tests ✓

**Files**: `test/test-cache.mjs`

**Changes**:
1. Add new describe block "isReady timing verification"
2. Add test for file count stability after isReady
3. Optionally add test for "added" event ordering (if event is implemented)

**Acceptance Criteria**:
- Tests pass on current implementation
- Tests would fail if race condition is reintroduced
- Tests run as part of normal test suite

### Task 4: Update Documentation ✓

**Files**: 
- `IS_READY TOO EARLY.md` - Mark as resolved
- `README.md` or CLI help - Document the check-ready command

**Changes**:
1. Update issue document with resolution status
2. Document the check-ready command for site authors
3. Note that the issue was resolved by architectural changes

**Acceptance Criteria**:
- Documentation clearly states issue is resolved
- check-ready command is documented
- Site authors know how to verify their site

## Testing Requirements

### Manual Testing

1. Run `npx akasharender check-ready config.mjs` on test configuration
2. Verify it reports success
3. Run on a larger project (like akashacms-website) to verify with real-world sites

### Automated Testing

1. New tests in `test/test-cache.mjs` must pass
2. Existing tests must continue to pass
3. Run full test suite: `cd test && npm test`

## Phased Plan

### Phase 1: Add Event Emission (Minimal Change)
- Add `this.emit('added', ...)` in BaseCache.setup()
- Verify events are emitted in correct order
- No breaking changes, just adds observable behavior

### Phase 2: Add CLI Command (Most Useful for Site Authors)
- Implement check-ready command
- Test on example sites
- Document the command

### Phase 3: Add Automated Tests (Regression Prevention)
- Add Mocha tests
- Verify they catch the race condition if reintroduced
- Add to CI/CD

### Phase 4: Documentation and Closure
- Update IS_READY TOO EARLY.md
- Update README
- Close GitHub issue #127

## Success Criteria

1. ✅ "added" events are emitted correctly
2. ✅ CLI check-ready command works and is documented
3. ✅ Automated tests prevent regression
4. ✅ Documentation is updated
5. ✅ GitHub issue #127 can be closed with confidence
