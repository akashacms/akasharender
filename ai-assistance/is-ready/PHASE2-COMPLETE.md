# Phase 2 Complete: CLI check-ready Command

**Date**: 2026-03-14  
**Phase**: 2 of 4 from FEATURE-Verify-IsReady-Timing.md  
**Status**: ✅ COMPLETE

## Summary

Successfully implemented Phase 2 of the isReady timing verification feature. Added a CLI `check-ready` command that site authors can use to verify that all files are loaded before the `isReady` event triggers.

## Changes Made

### 1. Added CLI Command

**File**: `lib/cli.ts`

**Command**: `check-ready <configFN>`

**Implementation**: Added a new command before the final `program.parse()` call (lines 890-991):

```typescript
program
    .command('check-ready <configFN>')
    .description('Verify that all files are loaded before isReady triggers (diagnostic tool)')
    .option('--verbose', 'Show detailed file-by-file tracking')
    .option('--delay <ms>', 'Wait time in milliseconds to check for late additions (default: 2000)', '2000')
    .action(async (configFN, cmdObj) => {
        // Implementation
    });
```

**Features**:
- ✅ Loads site configuration
- ✅ Records file counts immediately after setup
- ✅ Waits configurable delay (default 2000ms)
- ✅ Compares counts to detect late additions
- ✅ Provides clear success/failure output
- ✅ Exits with code 1 if issues detected
- ✅ Supports --verbose flag for detailed output
- ✅ Supports --delay flag for custom wait time

### 2. Updated Documentation

**File**: `README.md`

**Changes**:
1. Added `check-ready` to the commands list
2. Added new "Diagnostic Commands" section with:
   - Purpose and usage
   - Options description
   - Step-by-step explanation
   - Example output
   - Use case recommendations

## Command Usage

### Basic Usage

```bash
npx akasharender check-ready config.js
```

### With Options

```bash
# Verbose output
npx akasharender check-ready config.js --verbose

# Custom delay (500ms instead of 2000ms)
npx akasharender check-ready config.js --delay 500

# Both options
npx akasharender check-ready config.js --verbose --delay 1000
```

### Help

```bash
npx akasharender check-ready --help
```

Output:
```
Usage: cli check-ready [options] <configFN>

Verify that all files are loaded before isReady triggers (diagnostic tool)

Options:
  --verbose     Show detailed file-by-file tracking
  --delay <ms>  Wait time in milliseconds to check for late additions (default:
                2000) (default: "2000")
  -h, --help    display help for command
```

## Example Outputs

### Success Case (Normal)

```
Running isReady timing check...

✓ Setup completed in 113ms
  Documents: 80
  Assets: 3
  Layouts: 11
  Partials: 20

Waiting 2000ms to check for late additions...

Results:

✅ SUCCESS: No files added after isReady. Timing is correct.

All caches are stable:
  ✓ Documents: 80 files
  ✓ Assets: 3 files
  ✓ Layouts: 11 files
  ✓ Partials: 20 files
```

**Exit code**: 0

### Success Case (Verbose)

```
Running isReady timing check...

✓ Setup completed in 593ms
  Documents: 80
  Assets: 3
  Layouts: 11
  Partials: 20

Waiting 2000ms to check for late additions...

Results:
✓ documents: 80 files (stable)
✓ assets: 3 files (stable)
✓ layouts: 11 files (stable)
✓ partials: 20 files (stable)

✅ SUCCESS: No files added after isReady. Timing is correct.

All caches are stable:
  ✓ Documents: 80 files
  ✓ Assets: 3 files
  ✓ Layouts: 11 files
  ✓ Partials: 20 files
```

**Exit code**: 0

### Failure Case (If Race Condition Detected)

```
Running isReady timing check...

✓ Setup completed in 113ms
  Documents: 78
  Assets: 3
  Layouts: 11
  Partials: 20

Waiting 2000ms to check for late additions...

Results:

❌ ISSUE DETECTED: documents count changed from 78 to 80
   This indicates files were added after isReady!

⚠️  FAILURE: Files were added after isReady triggered!
   This indicates a race condition that needs to be fixed.

   Please report this issue at:
   https://github.com/akashacms/akasharender/issues
```

**Exit code**: 1

## Testing

### Manual Testing

Tested with test configuration:
```bash
cd test
node ../dist/cli.js check-ready config-normal.mjs
```

✅ **Results**: 
- Command executes successfully
- Reports correct file counts
- Shows proper success message
- Exits with code 0

### With Options

```bash
# Verbose mode
node ../dist/cli.js check-ready config-normal.mjs --verbose
✅ Shows detailed per-cache output

# Custom delay
node ../dist/cli.js check-ready config-normal.mjs --delay 500
✅ Waits 500ms instead of 2000ms
```

### Build Status

```bash
npm run build
```
✅ **SUCCESS** - No TypeScript errors

### Test Suite

```bash
cd test && npm test
```
✅ **SUCCESS** - All test suites still pass:
- 102 passing (test-normal)
- 67 passing (test-rebased)
- 117 passing (test-cache)
- 5 passing (test-isready-timing)
- 24 passing (test-absolute)
- All rendering tests pass

**Total**: 315+ tests passing

## Use Cases

### 1. Development Verification

Site authors can run this command during development to ensure their configuration doesn't trigger race conditions:

```bash
npm run check-ready
```

Add to `package.json`:
```json
{
  "scripts": {
    "check-ready": "akasharender check-ready config.js"
  }
}
```

### 2. CI/CD Pipeline

Add as a test step to catch timing issues automatically:

```yaml
# .github/workflows/test.yml
- name: Verify cache timing
  run: npx akasharender check-ready config.js
```

### 3. Troubleshooting

If pages are mysteriously missing from rendered output:

```bash
# Run with verbose to see detailed cache status
npx akasharender check-ready config.js --verbose

# Try shorter delay for faster feedback
npx akasharender check-ready config.js --delay 500
```

### 4. Performance Testing

Test with different delays to understand cache loading behavior:

```bash
# Quick check
npx akasharender check-ready config.js --delay 100

# Thorough check  
npx akasharender check-ready config.js --delay 5000
```

## Implementation Details

### Algorithm

1. **Setup Phase**
   - Load configuration
   - Start timer
   - Call `akasha.setup(config)`
   - Record setup completion time

2. **Initial Count Phase**
   - Get file counts from all caches:
     - `documentsCache.paths().length`
     - `assetsCache.paths().length`
     - `layoutsCache.paths().length`
     - `partialsCache.paths().length`
   - Display counts to user

3. **Wait Phase**
   - Wait for specified delay (default 2000ms)
   - Display progress message

4. **Verification Phase**
   - Get file counts again from all caches
   - Compare before/after counts
   - Flag any differences as issues

5. **Reporting Phase**
   - Display per-cache results
   - Show overall success/failure
   - Provide guidance if issues found
   - Exit with appropriate code

### Design Decisions

**Count-Based Approach** (vs Event-Based):
- ✅ Works without requiring event listener setup before cache creation
- ✅ Simple and reliable
- ✅ Easy for users to understand
- ✅ No dependency on Phase 1 event emission (though it's available)

**Configurable Delay**:
- ✅ Fast defaults (2s) for quick checks
- ✅ Extensible for thorough verification
- ✅ Useful for different site sizes

**Clear Output**:
- ✅ Unicode checkmarks and symbols for visibility
- ✅ Color-coded (via console.error for failures)
- ✅ Actionable guidance on failure
- ✅ Summary at the end

**Exit Codes**:
- ✅ 0 = success (safe for CI/CD)
- ✅ 1 = failure or error (fails CI/CD appropriately)

## Benefits Delivered

1. ✅ **Site Author Tool**: Authors can verify their configuration
2. ✅ **CI/CD Integration**: Can be part of automated testing
3. ✅ **Troubleshooting Aid**: Helps diagnose missing pages
4. ✅ **No Dependencies**: Works independently of Phase 1 events
5. ✅ **Well-Documented**: Clear README section with examples
6. ✅ **User-Friendly**: Clear output with actionable messages

## Files Changed

1. `lib/cli.ts` - Added check-ready command (102 lines)
2. `README.md` - Added command documentation and diagnostic section

## Next Steps

Phase 2 is complete. Ready to proceed to:

**Phase 3**: Additional Test Enhancements (optional)
- Add test that simulates race condition
- Add performance benchmarks
- Test with very large file sets

**Phase 4**: Documentation and Issue Closure
- Update IS_READY TOO EARLY.md as resolved
- Add examples to documentation
- Close GitHub issue #127

---

**Implemented by**: Claude Code (AI Assistant)  
**Tested**: Manually verified with test configuration  
**Ready for**: Phase 3 implementation (optional) or Phase 4 (documentation)
