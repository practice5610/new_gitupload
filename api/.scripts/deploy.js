const fs = require('fs');

const { execSync, execFileSync } = require('child_process');

const regExpVersion = /(?:\.(\d+))$/;
const originalVersion = regExpVersion.exec(process.env.npm_package_version)[1];

const currentDate = new Date();
const date = ('0' + currentDate.getDate()).slice(-2);
const month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
const year = currentDate.getFullYear();
const hours = currentDate.getHours();
const minutes = currentDate.getMinutes();
const seconds = currentDate.getSeconds();

/**
 *
 * This script is in charge of :
 * - Installing
 * - Fix package-lock.json errors
 * - Review code (We need to do this before going further)
 * - Update version
 * - Build
 * - Deploy to AWS
 * - Update Bitbucket (This one also checks the code, but there’s no way to run that thing conditionally)
 * If any of these steps fails it restores the old version, since the update to Bitbucket is the last operation we don’t need to rollback that operation
 */

const log = (message, level = 'log') => {
  switch (level) {
    case 'error':
      console.log('\x1b[31m%s\x1b[0m', message);
      break;
    default:
      console.log('\x1b[32m%s\x1b[0m', message);
  }
};
try {
  //execSync('npm install', { stdio: [0, 1, 2] });
  //execFileSync(process.execPath, ['./.scripts/fixPackageLock.js']);
  //execSync('npx prettier --config .prettierrc --write .', { stdio: [0, 1, 2] }); // Keep this
  execSync('npm run type_check', { stdio: [0, 1, 2] });
  execSync('npm run lint -- --quiet', { stdio: [0, 1, 2] });
  log('No errors found in code');
  if (!process.env.npm_config_no_update_version) {
    execSync('npm version patch', { stdio: [0, 1, 2] });
    log('Version Updated');
  }
  execSync('npm run clean', { stdio: [0, 1, 2] });
  log('Loopback Clean');
  execSync('npm run build', { stdio: [0, 1, 2] });
  log('Loopback Built');
  execSync('npm run parcel_build', { stdio: [0, 1, 2] });
  log('Public files created');
  if (process.env.npm_config_eb_staged) {
    execSync(
      `eb deploy -l api_${process.env.npm_package_version}_${year}-${month}-${date}_h${hours}_m${minutes}_s${seconds} --staged`,
      { stdio: [0, 1, 2] }
    );
  } else {
    execSync(
      `eb deploy -l api_${process.env.npm_package_version}_${year}-${month}-${date}_h${hours}_m${minutes}_s${seconds}`,
      {
        stdio: [0, 1, 2],
      }
    );
  }
  log('Deployed to AWS');
  if (!process.env.npm_config_no_update_version) {
    execSync(
      `git add . && git commit -m "Automatic version update to 0.0.${
        +originalVersion + 1
      }" && git push`,
      { stdio: [0, 1, 2] }
    );
    log('Bitbucket updated');
  }
} catch (e) {
  if (!process.env.npm_config_no_update_version) {
    try {
      let rawdata = fs.readFileSync('package.json');
      let data = JSON.parse(rawdata);
      data.version = `0.0.${originalVersion}`;
      fs.writeFileSync('package.json', JSON.stringify(data, null, 2));
      log('Version restored');
    } catch (e) {
      log('Error updating Version', 'error');
    }
  }
  log('Failed Deployment', 'error');
  process.exit(1);
}
process.exit(0);
