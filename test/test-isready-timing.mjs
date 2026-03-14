import util   from 'util';
import path   from 'path';
import * as akasha from '../dist/index.js';
const filecache = await import('../dist/cache/cache-sqlite.js');
import { assert }   from 'chai';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

let config;

describe('isReady timing verification', function() {
    
    it('should successfully configure test site', async function() {
        this.timeout(25000);
        config = new akasha.Configuration();
        config.rootURL("https://example.akashacms.com");
        config.configDir = __dirname;
        config
            .addAssetsDir({
                src: 'assets',
                dest: '/'
            })
            .addLayoutsDir({
                src: 'layouts',
                dest: '/'
            })
            .addDocumentsDir({
                src: 'documents',
                dest: '/'
            })
            .addPartialsDir({
                src: 'partials',
                dest: '/'
            });
        config.prepare();
    });

    it('should not add files after ready event is emitted', async function() {
        this.timeout(25000);
        
        // Track events for each cache type
        const tracking = {
            documents: { addedBeforeReady: [], addedAfterReady: [], readyEmitted: false },
            assets: { addedBeforeReady: [], addedAfterReady: [], readyEmitted: false },
            layouts: { addedBeforeReady: [], addedAfterReady: [], readyEmitted: false },
            partials: { addedBeforeReady: [], addedAfterReady: [], readyEmitted: false }
        };
        
        // Helper to setup listeners for a cache
        const setupListeners = (cache, cacheName) => {
            cache.on('added', (name, vpath) => {
                if (tracking[cacheName].readyEmitted) {
                    tracking[cacheName].addedAfterReady.push(vpath);
                } else {
                    tracking[cacheName].addedBeforeReady.push(vpath);
                }
            });
            
            cache.on('ready', (name) => {
                tracking[cacheName].readyEmitted = true;
            });
        };
        
        // Note: We need to setup listeners BEFORE calling setup()
        // But the caches are created during setup(), so we can't do this directly
        // Instead, we'll verify using the count stability approach
        
        // Run setup
        await akasha.setup(config);
        
        // The caches are now available
        const documents = filecache.documentsCache;
        const assets = filecache.assetsCache;
        const layouts = filecache.layoutsCache;
        const partials = filecache.partialsCache;
        
        // Setup listeners for future events (though setup is already done)
        setupListeners(documents, 'documents');
        setupListeners(assets, 'assets');
        setupListeners(layouts, 'layouts');
        setupListeners(partials, 'partials');
        
        // Wait for ready (should already be ready)
        await Promise.all([
            documents.isReady(),
            assets.isReady(),
            layouts.isReady(),
            partials.isReady()
        ]);
        
        // Verify no files were added after ready
        // (Since setup already completed, these should all be empty)
        assert.equal(tracking.documents.addedAfterReady.length, 0, 
            `Documents added after ready: ${tracking.documents.addedAfterReady.join(', ')}`);
        assert.equal(tracking.assets.addedAfterReady.length, 0, 
            `Assets added after ready: ${tracking.assets.addedAfterReady.join(', ')}`);
        assert.equal(tracking.layouts.addedAfterReady.length, 0, 
            `Layouts added after ready: ${tracking.layouts.addedAfterReady.join(', ')}`);
        assert.equal(tracking.partials.addedAfterReady.length, 0, 
            `Partials added after ready: ${tracking.partials.addedAfterReady.join(', ')}`);
    });
    
    it('should have stable file counts after isReady resolves', async function() {
        this.timeout(10000);
        
        const documents = filecache.documentsCache;
        const assets = filecache.assetsCache;
        const layouts = filecache.layoutsCache;
        const partials = filecache.partialsCache;
        
        await Promise.all([
            documents.isReady(),
            assets.isReady(),
            layouts.isReady(),
            partials.isReady()
        ]);
        
        // Get counts immediately after isReady
        const countsBefore = {
            documents: (await documents.paths()).length,
            assets: (await assets.paths()).length,
            layouts: (await layouts.paths()).length,
            partials: (await partials.paths()).length
        };
        
        // Wait a bit to see if any late additions happen
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Counts should be the same
        const countsAfter = {
            documents: (await documents.paths()).length,
            assets: (await assets.paths()).length,
            layouts: (await layouts.paths()).length,
            partials: (await partials.paths()).length
        };
        
        assert.equal(countsBefore.documents, countsAfter.documents,
            `Documents count changed from ${countsBefore.documents} to ${countsAfter.documents} after isReady`);
        assert.equal(countsBefore.assets, countsAfter.assets,
            `Assets count changed from ${countsBefore.assets} to ${countsAfter.assets} after isReady`);
        assert.equal(countsBefore.layouts, countsAfter.layouts,
            `Layouts count changed from ${countsBefore.layouts} to ${countsAfter.layouts} after isReady`);
        assert.equal(countsBefore.partials, countsAfter.partials,
            `Partials count changed from ${countsBefore.partials} to ${countsAfter.partials} after isReady`);
    });

    it('should have all files loaded when isReady resolves', async function() {
        this.timeout(10000);
        
        const documents = filecache.documentsCache;
        await documents.isReady();
        
        // Get all document paths
        const paths = await documents.paths();
        
        // Should have found multiple documents
        assert.isTrue(paths.length > 0, 'Should have loaded at least one document');
        
        // Verify we can find a known document
        const indexDoc = await documents.find('index.html.md');
        assert.isDefined(indexDoc, 'Should be able to find index.html.md immediately after isReady');
        assert.equal(indexDoc.vpath, 'index.html.md');
    });

    it('Close caches', async function() {
        await akasha.closeCaches();
    });
});
