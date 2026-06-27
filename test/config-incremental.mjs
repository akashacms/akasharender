
// Configuration for the incremental-rendering tests.
//
// It reuses the exact directory/plugin setup from config-normal.mjs
// (the same configuration used by the "build" npm script) but renders
// into a dedicated output directory so the incremental-rendering tests
// do not interfere with the other test suites that use `out/`.

const config = (await import('./config-normal.mjs')).default;

config.setRenderDestination('out-incremental');

export default config;
