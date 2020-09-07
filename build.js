const { readFileSync, writeFileSync, unlinkSync } = require('fs');
const { join } = require('path');
const workerPath = join(__dirname, 'build', 'worker', 'web-worker.js');
const workerIndexPath = join(__dirname, 'build', 'worker', 'index.js');
const workerData = readFileSync(workerPath).toString();
const workerIndexData = readFileSync(workerIndexPath).toString();
writeFileSync(workerIndexPath,workerIndexData.replace('\'REPLACE_JS_DATA\'',JSON.stringify(workerData)));
unlinkSync(workerPath);