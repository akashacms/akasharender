---
description: Run tests with coverage
agent: build
---

Run the full test suite, showing errors.  The test suite is located in the test subdirectory, and is several Mocha+Chai test suites.  An additional test is to use AkashaRender to render a test site.

To run the test suite, the following command should be used

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 24 && cd test && npm run test

