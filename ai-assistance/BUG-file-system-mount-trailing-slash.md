
The goal is to fix the bug described in https://github.com/akashacms/akasharender/issues/175

To repeat the issue, in the `test` directory add this to the `package.json` dependencies section

```json
    "@fortawesome/fontawesome-free": "^5.7.2",
```

This brings in the named package.

Then, in `config-normal.mjs` add this to the section where file-system mounts are defined.

```js
    .addAssetsDir({
        src: 'node_modules/@fortawesome/fontawesome-free/',
        dest: 'vendor/fontawesome-free'
    })
```

The bug is the trailing slash.  If the bug exists, the trailing slash causes this problem:

```shell
> open-source-site@0.9.0 build:copy
> akasharender copy-assets config.mjs

copy-assets command ERRORED Error: copyAssets FAIL to copy /home/david/Projects/akasharender/open-source-site/node_modules/@fortawesome/fontawesome-free/ss/all.css vendor/fontawesome-free/ss/all.css vendor/fontawesome-free/ss/all.css out because Error: ENOENT: no such file or directory, lstat '/home/david/Projects/akasharender/open-source-site/node_modules/@fortawesome/fontawesome-free/ss/all.css'
    at async lstat (node:internal/fs/promises:1031:18)
    at async Promise.all (index 0)
    at async checkPaths (node:internal/fs/cp/cp:77:39)
    at async cpFn (node:internal/fs/cp/cp:66:17)
    at async file:///home/david/Projects/akasharender/open-source-site/node_modules/akasharender/dist/index.js:1044:17
    at file:///home/david/Projects/akasharender/open-source-site/node_modules/akasharender/dist/index.js:1051:23

```

That is, when running `akasharender copy-assets config.mjs` it tries to copy the named file, `/home/david/Projects/akasharender/open-source-site/node_modules/@fortawesome/fontawesome-free/ss/all.css vendor/fontawesome-free/ss/all.css`

But, that file doesn't exist because the file name is formed incorrectly.  It should end with `css/all.css` instead.

Handling of `akasharender copy-assets` starts in the `lib/cli.ts` file.  That function calls `config.copyAssets()` and the problem will be in the functions called by that function.

The same problem should exist with `akasharender render config.mjs --copy-assets`

