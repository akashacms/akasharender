import { VFStack } from '../dist/cache/vfstack.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testIterator() {
    console.log('Testing VFStack iterator protocol...\n');

    const stack = new VFStack('test-iterator', [
        {
            mounted: path.join(__dirname, 'documents'),
            mountPoint: '/',
        }
    ]);

    await stack.scan();
    console.log('Total files scanned:', stack.size);

    console.log('\nTesting for...of iteration:');
    let count = 0;
    for (const file of stack) {
        count++;
        if (count <= 3) {
            console.log(`  ${count}. ${file.vpath}`);
        }
    }
    console.log(`  ... (${count} total files)`);

    console.log('\nTesting entries() iteration:');
    let entryCount = 0;
    for (const [vpath, data] of stack.entries()) {
        entryCount++;
        if (entryCount <= 3) {
            console.log(`  ${vpath} => ${data.fspath.split('/').pop()}`);
        }
    }
    console.log(`  ... (${entryCount} total entries)`);

    console.log('\nTesting keys() iteration:');
    const keys = Array.from(stack.keys());
    console.log(`  First 3 keys: ${keys.slice(0, 3).join(', ')}`);
    console.log(`  Total keys: ${keys.length}`);

    console.log('\nTesting values() iteration:');
    const values = Array.from(stack.values());
    console.log(`  First 3 values: ${values.slice(0, 3).map(v => v.vpath).join(', ')}`);
    console.log(`  Total values: ${values.length}`);

    if (count === stack.size && entryCount === stack.size && keys.length === stack.size) {
        console.log('\n✓ Iterator protocol working correctly');
    } else {
        console.log('\n✗ Iterator protocol NOT working correctly');
        console.log(`  Expected ${stack.size}, got count=${count}, entries=${entryCount}, keys=${keys.length}`);
        process.exit(1);
    }
}

testIterator().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
