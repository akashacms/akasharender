This project is about replacing the `@akashacms/stacked-dirs` package with a simpler, easier-to-maintain, lighterweight equivalent.  While stacked-dirs is an interesting piece of software, with unique capabilities, its implementation is complex, using it is complex, it has a bug that will be difficult to resolve, and perhaps adds overhead.

The primary purposes for `@akashacms/stacked-dirs` is:

* Implementing the "Stacked Directories" concept (explained later)
* Interactively watching the filesystem for changes, so that AkashaCMS can auto-rebuild changed files.  This resulted in a `watch` mode where a writer could run `akasharender watch` and have a near WYSIWYG experience.

The plan is to replace the `watch` mode with the `nodemon` application, while simplifying the AkashaRender implementation.

# AkashaCMS User Documentation: _Stacked Directories_

## What Are Stacked Directories?

In **AkashaCMS**, a **stacked directory** is a collection of directories combined into a single _virtual filesystem_.  

Each directory in the stack contributes files that can override or extend the files of other directories.

This mechanism allows themes, plugins, and your local project to work together cleanly:

- Plugins provide **default files** (templates, documentation, assets).    
- Themes (like `@akashacms/theme-bootstrap`) **override** those defaults to change presentation.    
- Your project’s local directories can **override everything else**.

## The Overridability Principle

When AkashaCMS looks for a file in a stacked directory, it follows the **Overridability Principle**:

> **The first directory in the stack that contains a given file path is the one that defines it.**

This means:

- Higher-priority directories (earlier in the list) **override** lower ones.    
- Lower-priority directories still contribute any files not defined earlier.

### Example

| Directory | Files Present |
| --------- | ------------- |
| A         | A, C, D       |
| B         | B, E, F       |
| C         | A, E, G       |

The list of all virtual path names is therefore `[ A, B, C, D, E, F, G ]`.

Notice that in some cases, the same path name is repeated in multiple directories. The instance of a given pathname that is used from the directory stack is the first directory with that pathname. In this case, the pathname A is satisfied by directory A, and the pathname E is satisfied by directory B.

# The Directory Stack

The directory is an array of objects that is defined something like this:

```typescript
type DirStackItem = {

	// The full pathname for the filesystem location
	// of a directory in the stack
	src: string,
	
	// A virtual pathname within a virtual filespace
	dest: string,
	
	// Metadata object for files within this group of files.
	baseMetaData?: any
};

type DirStack = Array<DirStackItem>;
```

The following are two examples.  These are taken from the actual configuration for the `akashacms.com` website.  For the first example, all directories in the stack are mounted on the root of the virtual file space.  On the second, the directories are mounted in different locations.  In this case, the document files for the website are brought together from multiple repositories.

For example, the file `../akashacms-footnotes/guide/index.html.md` is in the `../akashacms-tagged-content/guide` source directory, and is mounted in the virtual filesystem directory `plugins/tagged-content` as `plugins/tagged-content/index.html.md`.

Example 1 - a directory stack for Partial templates

```js
[
  { src: '.../partials', dest: '/' },
  {
    src: '.../node_modules/@akashacms/theme-bootstrap/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-authors/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-breadcrumbs/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-booknav/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-document-viewers/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-embeddables/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-footnotes/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-blog-podcast/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-affiliates/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-tagged-content/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/epub-website/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/@akashacms/plugins-base/partials',
    dest: '/'
  },
  {
    src: '.../node_modules/akasharender/partials',
    dest: '/'
  }
]
```

Example 2 - directory stack for documents

```js
[
  { src: 'documents', dest: '/' },
  {
    src: '../akasharender/guide',
    dest: 'akasharender',
    baseMetadata: { bookHomeURL: '/akasharender/toc.html' }
  },
  {
    src: '../mahabhuta/guide',
    dest: 'mahabhuta',
    baseMetadata: { bookHomeURL: '/mahabhuta/toc.html' }
  },
  {
    src: '../epub-guide/documents',
    dest: 'epubtools',
    baseMetadata: { bookHomeURL: '/epubtools/toc.html' }
  },
  { src: '../akashacms-base/guide', dest: 'plugins/base' },
  { src: '../akasharender/built-in-guide', dest: 'plugins/built-in' },
  { src: '../akashacms-plugin-authors/guide', dest: 'plugins/authors' },
  { src: '../akashacms-booknav/guide', dest: 'plugins/booknav' },
  {
    src: '../akashacms-blog-podcast/guide',
    dest: 'plugins/blog-podcast'
  },
  {
    src: '../akashacms-breadcrumbs/guide',
    dest: 'plugins/breadcrumbs'
  },
  {
    src: '../akashacms-document-viewers/guide',
    dest: 'plugins/document-viewers'
  },
  {
    src: '../akashacms-embeddables/guide',
    dest: 'plugins/embeddables'
  },
  {
    src: '../akashacms-external-links/guide',
    dest: 'plugins/external-links'
  },
  { src: '../akashacms-footnotes/guide', dest: 'plugins/footnotes' },
  {
    src: '../akashacms-tagged-content/guide',
    dest: 'plugins/tagged-content'
  },
  {
    src: '../akashacms-theme-bootstrap/guide',
    dest: 'plugins/theme-bootstrap'
  },
  { src: '../akashacms-affiliates/guide', dest: 'plugins/affiliates' },
  {
    src: '../akasharender-epub/guide',
    dest: 'plugins/akasharender-epub'
  },
  {
    src: '../akashacms-adblock-checker/guide',
    dest: 'plugins/adblock-checker'
  }
]
```

## Developer Notes

- **Analogy:** The system is conceptually similar to mounting directories in a UNIX filesystem.    
- **Testing:** Unit tests should include overlapping filenames and cross-platform path scenarios.    
- **Error Handling:** If a `src` directory does not exist, log a warning but continue.    

## References

These web pages give different overviews of the current implementation.  This existing documentation is incomplete, however.

- [AkashaCMS Quick Start: Directories](https://akashacms.com/quick-start/directories.html)
- [AkashaRender Configuration](https://akashacms.com/akasharender/configuration.html)
- [Stacked Directories Overview](https://akashacms.github.io/stacked-directories/introduction.html)

# Implementation

First, we should be able to implement this using the [`unionfs`](https://www.npmjs.com/package/unionfs) package.  
- A Node.js library implementing a **union filesystem in memory**.
- Lets you mount multiple directories virtually and perform reads transparently.
- Supports overrides and even write delegation.

While that package discusses `memfs` and `fs-monkey`, I do not want to use the latter because it changes the native `node:fs` package.

There should be a class named VFStack for creating a virtual stacked filesystem.  It will contain the directory stack functionality as already discussed, methods for managing each directory stack, and methods mimicking some of the methods of the `node:fs` package.

These are some API elements from the existing implementation which should be used.

```typescript

/**
 * This describes one entry in a directory stack.
 */
export type dirStackItem = {
    /**
     * The filesystem path to "mount".
     */
    mounted: string;

    /**
     * The path within the virtual filesystem where this will appear.
     */
    mountPoint: string;

    /**
     * Metadata object to use within the
     * sub-hierarchy.
     */
    baseMetadata?: any;

    /**
     * Optional array of strings containing globs for matching
     * files to ignore.
     */
    ignore?: string[];
}

/**
 * Describes one file in the physical filesystem, and
 * how it appears within the virtual stacked filesystem.
 */
export type VPathData = {

    /**
     * The full file-system path for the file.
     * e.g. /home/path/to/article-name.html.md
     */
    fspath: string;

    /**
     * The virtual path, rooted at the top
     * directory of the filesystem, with no
     * leading slash.
     */
    vpath: string;

    /**
     * The mime type of the file.  The mime types
     * are determined from the file extension
     * using the 'mime' package.
     */
    mime ?: string;

	/**
	 * Describes how the directory containing this
	 * file is mounted into the virtual stacked filespace.
	 */
	dir: dirStackItem;

    /**
     * The relative path underneath the mountPoint.
     */
    pathInMounted: string;

    /**
     * The mTime value from Stats
     */
    statsMtime: number;

}

public class VFStack extends EventEmitter {

	// A name for this stack
	#name: string;
	
	// The directory stack
	#dirs: dirStackItem[];
	
	// List of files in this stack
	#files: VPathData[];
	
	#basedir: string;
	
	constructor(
		name: string,
		dirs: dirStackItem[]
	) {
		this.#name = name;
		this.#dirs = dirs;
        this.#basedir = undefined;
	}
	
	/**
	 * Use unionfs to scan the directories.
	 * and read all the files.
	 */
	async scan(): Promise<void> {
		// ... 
	}
	
    /**
     * Retrieves the directory stack for
     * this Watcher.
     */
    get dirs(): dirToWatch[] | undefined { return this.#dirs; }
    
    /**
     * Retrieves the name for this Watcher
     */
    get name() { return this.#name; }

    /**
     * Changes the use of absolute pathnames, to paths relatve to the given directory.
     * This must be called before the <em>watch</em> method is called.  The paths
     * you specify to watch must be relative to the given directory.
     */
    set basedir(cwd: string) { this.#basedir = cwd; }

    /**
     * Determine if the fspath is to be ignored
     * @param fspath 
     * @param stats 
     * @returns 
     */
    toIgnore(fspath: string, stats?: Stats): boolean {

        for (const dir of this.dirs) {

            // Check if this dirs entry corresponds
            // to the fspath

            // This will strip off a leading slash,
            // and ensure that it ends with a slash.

            const m = dir.mounted.startsWith('/')
                    ? dir.mounted.substring(1)
                    : dir.mounted;
            const m2 = m.endsWith('/')
                     ? m
                     : (m+'/');
            if (!fspath.startsWith(m2)) {
                continue;
            }

            // Check to see if we're supposed to ignore the file
            if (dir.ignore) {
                let ignores;
                if (typeof dir.ignore === 'string') {
                    ignores = [ dir.ignore ];
                } else {
                    ignores = dir.ignore;
                }
                let ignore = false;
                for (const i of ignores) {
                    if (micromatch.isMatch(fspath, i)) ignore = true;
                    // console.log(`dir.ignore ${fspath} ${i} => ${ignore}`);
                }
                if (ignore) {
                    // console.log(`toIgnore ignoring ${fspath} ${util.inspect(this.dirs)}`);
                    return true;
                }
            }
        }
    }

    vpathForFSPath(fspath: string, stats?: Stats): VPathData {
        for (const dir of this.dirs) {

            // Check to see if we're supposed to ignore the file
            if (dir.ignore) {
                let ignores;
                if (typeof dir.ignore === 'string') {
                    ignores = [ dir.ignore ];
                } else {
                    ignores = dir.ignore;
                }
                let ignore = false;
                for (const i of ignores) {
                    if (micromatch.isMatch(fspath, i)) ignore = true;
                    // console.log(`dir.ignore ${fspath} ${i} => ${ignore}`);
                }
                if (ignore) continue;
            }

            // This ensures we are matching on directory boundaries
            // Otherwise fspath "/path/to/layouts-extra/layout.njk" might
            // match dir.mounted "/path/to/layouts".
            //
            // console.log(`vpathForFSPath ${dir.mounted} ${typeof dir.mounted}`, dir);
            const dirmounted =
                (dir && dir.mounted)
                    ? (dir.mounted.charAt(dir.mounted.length - 1) == '/')
                        ? dir.mounted
                        : (dir.mounted + '/')
                    : undefined;
            if (dirmounted && fspath.indexOf(dirmounted) === 0) {
                const pathInMounted = fspath.substring(dir.mounted.length).substring(1);
                const vpath = dir.mountPoint === '/'
                        ? pathInMounted
                        : path.join(dir.mountPoint, pathInMounted);
                // console.log(`vpathForFSPath fspath ${fspath} dir.mountPoint ${dir.mountPoint} pathInMounted ${pathInMounted} vpath ${vpath}`);
                const ret = <VPathData>{
                    fspath: fspath,
                    vpath: vpath,
                    mime: mime.getType(fspath),
                    mounted: dir.mounted,
                    mountPoint: dir.mountPoint,
                    pathInMounted
                };
                if (stats) {
                    ret.statsMtime = stats.mtimeMs;
                } else {
                    // Use the sync version to
                    // maintain this function
                    // as non-async
                    try {
                        let stats = fsStatSync(ret.fspath);
                        ret.statsMtime = stats.mtimeMs;
                    } catch (err: any) {
                        // console.log(`VPathData ignoring STATS error ${ret.fspath} - ${err.message}`);
                        ret.statsMtime = undefined;
                    }
                }
                if (!isVPathData(ret)) {
                    throw new Error(`Invalid VPathData ${util.inspect(ret)}`);
                }
                return ret;
            }
        }
        // No directory found for this file
        return undefined;
    }
    
	// ...
	
	// Add some of the methods from the node:fs package.
	// This should focus on the methods that read data from
	// the file system, rather than write data.
}
```


The above describes a class, VFStack, where the name combines both the VFS and Stack concept.  The class defined here is incomplete, and may have some details which are incorrect.  The code is derived from the existing stacked dirs package.

Initializing a VFStack means walking the filesystem of each stacked directory.  It records data about each file.

The existing stacked dirs package notifies AkashaRender using EventEmitter events.  The events are handled in this chain of method calls:
- `this.#watcher = new DirsWatcher(this.name);` The `#watcher` object is the DirsWatcher, which is an EventEmitter.  Thus `.on('event-name'...` handlers are declared on this object.
- `this.#watcher.on('change', async (name: string, info: VPathData) => {` These handlers push an event object into a _fastq_ processor.
- `this.#queue = fastq.promise(async function (event) {` This is the _fastq_ event processor.  
- `handleAdded`, `handleChanged`, `handleUnlinked` -- These handler methods are invoked.  For _Added_ and _Changed_, the method looks for additional data, and then stores it in the in-memory database.  For _Unlinked_ the method removes data from the database.

The new implementation is free to remove this complexity.  The result must be that:

- CRITICAL POINT:
	- The function of VFStack is to scan the directories and put together a list of files. 
	- The function of the Cache classes is to take that data, format it for database storage, and provide useful functions for searching the data.
- The _BaseCache_ subclasses are in charge of storing data about files in the in-memory database.  That data must be useful to the rest of AkashaCMS, and be structured as it is now.
- In AkashaCMS there are four Cache classes, _AssetsCache_, _PartialsCache_, _LayoutsCache_, and _DocumentsCache_ corresponding to the four types of files AkashaCMS deals with.
- Maybe instead of the BaseCache class, these four Cache classes should extend the VFStack class.  In that case, (some of) the other BaseCache methods should be added to VFStack.
- KEY QUESTION: Should the VFStack and BaseCache be separate classes, or the same class? 
	- As separate classes, data gathered by VFStack must be restructured by BaseCache subclasses for storing in the database.
- Ideally, BaseCache and its subclasses should preserve the API as it is.
- It might not be useful for VFStack to implement any of the methods of the `node:fs` package.


