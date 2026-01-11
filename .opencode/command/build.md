---
description: Build AkashaRender source
agent: build
---

Building AkashaRender is done using npm to run the TypeScript command.

To rebuild the package, the following command should be used

[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 24 && npm run build

