# Enhancement Complete: index --verbose Option

**Date**: 2026-03-14  
**Type**: Enhancement to Phase 2  
**Status**: ✅ COMPLETE

## Summary

Enhanced the `index` command with a `--verbose` option that displays a summary of indexed files and timing information. This provides site authors with visibility into the indexing process without requiring real-time event tracking.

## Changes Made

### 1. Added --verbose Option to index Command

**File**: `lib/cli.ts`

**Changes**:
- Added `--verbose` option to the index command
- When enabled, displays:
  - Indexing progress message
  - Time taken to complete indexing
  - File counts for each cache type (documents, assets, layouts, partials)
  - Total file count
- Without verbose, runs silently (unchanged behavior)

**Implementation**:
```typescript
program
    .command('index <configFN>')
    .description('Loads configuration, indexes content, then exits')
    .option('--verbose', 'Show summary of indexed files and timing information')
    .action(async (configFN, cmdObj) => {
        if (cmdObj.verbose) {
            // Show progress, timing, and summary
        } else {
            // Silent mode (existing behavior)
        }
    });
```

### 2. Updated Documentation

**File**: `README.md`

**Changes**:
1. Added `index [options] <configFN>` to the commands list
2. Added new section "index - Load and Index Files" in Diagnostic Commands
3. Documented the --verbose option
4. Provided example output
5. Listed use cases

## Command Usage

### Basic Usage (Silent)

```bash
npx akasharender index config.js
```

No output - useful for scripts and CI/CD where you just want to verify configuration loads.

### With Verbose Output

```bash
npx akasharender index config.js --verbose
```

Shows detailed summary:
```
Indexing files...

✓ Indexing completed in 119ms

=== Summary ===
Documents: 80 files
Assets: 3 files
Layouts: 11 files
Partials: 20 files
Total: 114 files
```

### Help

```bash
npx akasharender index --help
```

Output:
```
Usage: cli index [options] <configFN>

Loads configuration, indexes content, then exits

Options:
  --verbose   Show summary of indexed files and timing information
  -h, --help  display help for command
```

## Testing

### Manual Testing

**Silent mode:**
```bash
cd test
node ../dist/cli.js index config-normal.mjs
```
✅ No output, exits cleanly

**Verbose mode:**
```bash
node ../dist/cli.js index config-normal.mjs --verbose
```
✅ Shows summary with correct counts and timing

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

### 1. Configuration Verification

Quickly verify that configuration loads and all directories are found:

```bash
npm run index:check
```

Add to `package.json`:
```json
{
  "scripts": {
    "index:check": "akasharender index config.js --verbose"
  }
}
```

### 2. File Count Monitoring

Track how many files are in your project over time:

```bash
# In CI/CD or monitoring script
akasharender index config.js --verbose | grep "Total:"
# Output: Total: 114 files
```

### 3. Performance Benchmarking

Measure how long indexing takes:

```bash
akasharender index config.js --verbose | grep "completed"
# Output: ✓ Indexing completed in 119ms
```

### 4. Debugging Configuration

When files seem to be missing, check if they're being found:

```bash
akasharender index config.js --verbose
# Check if document/asset/layout/partial counts match expectations
```

### 5. CI/CD Health Checks

Add to CI pipeline to verify configuration before building:

```yaml
# .github/workflows/build.yml
- name: Verify configuration
  run: |
    npm run build
    npx akasharender index config.js --verbose
    npx akasharender check-ready config.js
```

## Design Decisions

### Simple Summary vs Real-time Events

**Decision**: Show summary after indexing completes, not real-time events

**Rationale**:
- ✅ **Simpler implementation**: No need to modify cache setup process
- ✅ **Cleaner output**: Summary is more useful than event stream for most users
- ✅ **Faster**: No overhead from event emission and logging
- ✅ **Backward compatible**: Doesn't change existing behavior
- ✅ **Meets user need**: Provides visibility into what was indexed

**Alternative considered**: Real-time event tracking
- ❌ Would require attaching listeners before cache creation
- ❌ Would produce very verbose output (one line per file)
- ❌ More complex implementation
- ✅ Could be added later if needed with a different flag (e.g., `--trace`)

### Timing Information

**Decision**: Show milliseconds elapsed for indexing

**Rationale**:
- ✅ Useful for performance monitoring
- ✅ Helps identify slow configurations
- ✅ Minimal overhead to collect

### File Count Details

**Decision**: Show counts per cache type plus total

**Rationale**:
- ✅ Helps verify each directory type is configured
- ✅ Useful for debugging missing files
- ✅ Total gives quick overview

## Benefits Delivered

1. ✅ **Configuration Verification**: Easy way to check config loads
2. ✅ **File Discovery Visibility**: See what files are found
3. ✅ **Performance Insight**: Measure indexing speed
4. ✅ **Debugging Aid**: Helps diagnose configuration issues
5. ✅ **CI/CD Integration**: Useful in automated pipelines
6. ✅ **Backward Compatible**: Doesn't change existing behavior
7. ✅ **Well-Documented**: Clear README section with examples

## Comparison with check-ready Command

Both commands are diagnostic tools but serve different purposes:

| Feature | index --verbose | check-ready |
|---------|----------------|-------------|
| **Purpose** | Verify config and see what's indexed | Verify timing correctness |
| **Shows** | File counts and timing | Cache stability over time |
| **Use Case** | Quick config check | Detect race conditions |
| **Exit Code** | Always 0 (unless error) | 0 on success, 1 if unstable |
| **Speed** | Fast (just indexes) | Slower (waits 2s by default) |
| **CI/CD** | Health check | Timing verification |

**Recommended workflow**:
1. Use `index --verbose` to verify configuration
2. Use `check-ready` to verify cache timing
3. Use `render` to build the site

## Files Changed

1. `lib/cli.ts` - Added --verbose option to index command
2. `README.md` - Added command documentation and use cases
3. `INDEX-VERBOSE-COMPLETE.md` - This summary document

## Future Enhancements (Optional)

If real-time event tracking is desired later, could add:

**Option 1**: Add `--trace` flag for detailed event logging:
```bash
akasharender index config.js --trace
# Shows every 'added' event as it happens
```

**Option 2**: Add `--watch` flag to show files as they're found:
```bash
akasharender index config.js --watch
# Shows files being indexed in real-time
```

**Option 3**: Add JSON output for programmatic use:
```bash
akasharender index config.js --json
# Outputs structured data for parsing
```

These could be added in future if user demand exists.

---

**Implemented by**: Claude Code (AI Assistant)  
**Tested**: Manually verified with test configuration  
**Related**: Phase 2 (check-ready command)  
**Status**: Complete and ready for use
