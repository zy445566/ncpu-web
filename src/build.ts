// @ts-nocheck
const { readFileSync, writeFileSync, unlinkSync } = require('fs');
const { join } = require('path');
const workerPath = join(__dirname, 'worker', 'web-worker.js');
const workerIndexPath = join(__dirname, 'worker', 'index.js');
const workerData = readFileSync(workerPath).toString();
const workerIndexData = readFileSync(workerIndexPath).toString();
writeFileSync(workerIndexPath,workerIndexData.replace(/['"`]{1}REPLACE_JS_DATA['"`]{1}/,JSON.stringify(workerData)));
unlinkSync(workerPath);
unlinkSync(__filename);