import { VFStack } from '../dist/cache/vfstack.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testIgnorePatterns() {
    console.log('Testing VFStack ignore patterns...\n');

    const stack = new VFStack('test-ignore', [
        {
            mounted: path.join(__dirname, 'documents'),
            mountPoint: '/',
            ignore: ['**/*.liquid', '**/hier-broke/**']
        }
    ]);

    await stack.scan();
    
    console.log('Total files found:', stack.size);

    const allFiles = stack.findAll();
    
    const liquidFiles = allFiles.filter(f => f.vpath.includes('.liquid'));
    const hierBrokeFiles = allFiles.filter(f => f.vpath.includes('hier-broke'));
    
    console.log('\nLiquid files found (should be 0):', liquidFiles.length);
    if (liquidFiles.length > 0) {
        console.log('ERROR: Found liquid files that should be ignored:');
        liquidFiles.forEach(f => console.log('  -', f.vpath));
    }
    
    console.log('hier-broke files found (should be 0):', hierBrokeFiles.length);
    if (hierBrokeFiles.length > 0) {
        console.log('ERROR: Found hier-broke files that should be ignored:');
        hierBrokeFiles.forEach(f => console.log('  -', f.vpath));
    }

    const handlebarsFiles = allFiles.filter(f => f.vpath.includes('.handlebars'));
    console.log('\nHandlebars files found (should be > 0):', handlebarsFiles.length);
    
    if (liquidFiles.length === 0 && hierBrokeFiles.length === 0 && handlebarsFiles.length > 0) {
        console.log('\n✓ Ignore patterns working correctly');
    } else {
        console.log('\n✗ Ignore patterns NOT working correctly');
        process.exit(1);
    }
}

testIgnorePatterns().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
