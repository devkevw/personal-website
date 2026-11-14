#!/usr/bin/env bash
set -euo pipefail
cd /workspace/personal-website
node -e 'if (Number(process.versions.node.split(".")[0]) < 22) throw new Error("Node.js >=22 required")'
test -x /usr/bin/chromium
/usr/bin/chromium --version
npm ci --cache /workspace/.npm-cache
npm run build
npm test
npm run test:browser
