import { VFStack } from '../dist/cache/vfstack.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testVFStack() {
    console.log('Testing VFStack...\n');

    const stack = new VFStack('test-documents', [
        {
            mounted: path.join(__dirname, 'documents'),
            mountPoint: '/',
        },
        {
            mounted: path.join(__dirname, 'mounted'),
            mountPoint: '/mounted-content',
        }
    ]);

    console.log('Stack name:', stack.name);
    console.log('Dirs:', stack.dirs.length);

    console.log('\nScanning directories...');
    await stack.scan();
    
    console.log('Total files found:', stack.size);

    const allFiles = stack.findAll();
    console.log('\nFirst 10 files:');
    allFiles.slice(0, 10).forEach(file => {
        console.log(`  ${file.vpath} -> ${file.fspath}`);
    });

    console.log('\n\nTesting find():');
    const testFile = 'index.html.md';
    const found = stack.find(testFile);
    if (found) {
        console.log(`  Found ${testFile}:`, {
            vpath: found.vpath,
            fspath: found.fspath,
            mounted: found.mounted,
            mountPoint: found.mountPoint
        });
    } else {
        console.log(`  ${testFile} not found`);
    }

    console.log('\n\nTesting override (stacked directories):');
    const mountedFile = stack.find('mounted-content/img2resize.html.md');
    if (mountedFile) {
        console.log('  Found mounted file:', {
            vpath: mountedFile.vpath,
            fspath: mountedFile.fspath,
            mountPoint: mountedFile.mountPoint
        });
    }

    console.log('\n✓ VFStack test completed');
}

testVFStack().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
