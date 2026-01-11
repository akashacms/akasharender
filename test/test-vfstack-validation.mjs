import { VFStack, isDirToMount } from '../dist/cache/vfstack.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testValidation() {
    console.log('Testing VFStack validation...\n');

    // Test isDirToMount type guard
    console.log('Testing isDirToMount type guard:');
    
    const validDir = {
        src: '/path/to/src',
        dest: '/dest'
    };
    console.log('  Valid dirToMount:', isDirToMount(validDir) ? '✓' : '✗');
    
    const validDirWithIgnore = {
        src: '/path/to/src',
        dest: '/dest',
        ignore: ['**/*.tmp', '**/node_modules/**']
    };
    console.log('  Valid dirToMount with ignore:', isDirToMount(validDirWithIgnore) ? '✓' : '✗');
    
    const validDirWithMetadata = {
        src: '/path/to/src',
        dest: '/dest',
        baseMetadata: { layout: 'default.html' }
    };
    console.log('  Valid dirToMount with baseMetadata:', isDirToMount(validDirWithMetadata) ? '✓' : '✗');
    
    // Invalid cases
    const invalidNoSrc = { dest: '/dest' };
    console.log('  Invalid (no src):', !isDirToMount(invalidNoSrc) ? '✓' : '✗');
    
    const invalidNoDest = { src: '/path' };
    console.log('  Invalid (no dest):', !isDirToMount(invalidNoDest) ? '✓' : '✗');
    
    const invalidSrcType = { src: 123, dest: '/dest' };
    console.log('  Invalid (src not string):', !isDirToMount(invalidSrcType) ? '✓' : '✗');
    
    const invalidIgnoreType = { src: '/path', dest: '/dest', ignore: 'not-an-array' };
    console.log('  Invalid (ignore not array):', !isDirToMount(invalidIgnoreType) ? '✓' : '✗');
    
    const invalidIgnoreItems = { src: '/path', dest: '/dest', ignore: ['valid', 123] };
    console.log('  Invalid (ignore contains non-string):', !isDirToMount(invalidIgnoreItems) ? '✓' : '✗');

    // Test VFStack constructor validation
    console.log('\nTesting VFStack constructor validation:');
    
    try {
        new VFStack('test-valid', [
            path.join(__dirname, 'documents'),
            {
                src: path.join(__dirname, 'mounted'),
                dest: '/mounted'
            }
        ]);
        console.log('  Valid dirs accepted: ✓');
    } catch (err) {
        console.log('  Valid dirs accepted: ✗');
        console.error('    Error:', err.message);
    }
    
    try {
        new VFStack('test-invalid', [
            { dest: '/dest' }  // Missing src
        ]);
        console.log('  Invalid dir rejected: ✗ (should have thrown)');
    } catch (err) {
        console.log('  Invalid dir rejected: ✓');
        console.log('    Error:', err.message);
    }
    
    try {
        new VFStack('test-invalid-ignore', [
            { 
                src: path.join(__dirname, 'documents'),
                dest: '/',
                ignore: 'not-an-array'
            }
        ]);
        console.log('  Invalid ignore rejected: ✗ (should have thrown)');
    } catch (err) {
        console.log('  Invalid ignore rejected: ✓');
        console.log('    Error:', err.message);
    }

    console.log('\n✓ VFStack validation test completed');
}

testValidation().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
