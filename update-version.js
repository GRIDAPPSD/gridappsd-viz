const childProcess = require('child_process');
const fs = require('fs');

childProcess.exec('git rev-parse --abbrev-ref HEAD', {}, (error, stdout) => {
  if (error)
    console.error(`An error occured trying to "git rev-parse --abbrev-ref HEAD"`);
  else {
    const lastLine = stdout.trim().split('\n').slice(-1)[0];
    const lastIndexOfForwardSlash = lastLine.lastIndexOf('/');
    const versionNumber = lastLine.substr(lastIndexOfForwardSlash + 1);
    const runConfig = 'export const RUN_CONFIG = ' + JSON.stringify({
      "version": versionNumber,
      "gossServerUrl": "ws://127.0.0.1:61614"
    }, null, 2) + ';\n';

    fs.writeFileSync('./runConfig.ts', runConfig);
  }
});