import { VFStack } from '../dist/cache/vfstack.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testStringMount() {
    console.log('Testing VFStack with string mounts...\n');

    const stack = new VFStack('test-string', [
        path.join(__dirname, 'documents')
    ]);

    await stack.scan();
    
    console.log('Total files found:', stack.size);

    const file = stack.find('index.html.md');
    if (file) {
        console.log('\nFound index.html.md:');
        console.log('  vpath:', file.vpath);
        console.log('  mountPoint:', file.mountPoint);
        
        if (file.mountPoint === '/' && file.vpath === 'index.html.md') {
            console.log('\n✓ String mount working correctly (mounted at /)');
        } else {
            console.log('\n✗ String mount NOT working correctly');
            console.log('  Expected mountPoint: /, got:', file.mountPoint);
            process.exit(1);
        }
    } else {
        console.log('\n✗ File not found');
        process.exit(1);
    }
}

testStringMount().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
