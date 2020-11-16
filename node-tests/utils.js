const path = require('path');
const fs = require('fs');

const CONFIG_PATH = 'config/content-security-policy.js';
const CSP_META_TAG_REG_EXP = /<meta http-equiv="Content-Security-Policy" content="(.*)">/i;

async function setConfig(testProject, config) {
  let content = `module.exports = function() { return ${JSON.stringify(config)}; }`;

  await testProject.writeFile(CONFIG_PATH, content);
}

async function removeConfig(testProject) {
  try {
    await testProject.deleteFile(CONFIG_PATH);
  } catch (error) {
    // should silently ignore if config file does not exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function extractRunTimeConfig(html) {
  let encodedConfig = html.match(/<meta name="\S*\/config\/environment" content="(.*)" \/>/)[1];
  return JSON.parse(decodeURIComponent(encodedConfig));
}

async function setResolutionForDependency(testProject, resolutions) {
  // resolutions must be defined in package.json at workspace root
  const workspaceRoot = path.join(testProject.path, '..', '..');
  const packageJsonFile = path.join(workspaceRoot, 'package.json');
  const packageJsonContent = JSON.parse(
    fs.readFileSync(packageJsonFile, { encoding: 'utf-8' })
  );

  if (!packageJsonContent.resolutions) {
    packageJsonContent.resolutions = {};
  }
  Object.assign(packageJsonContent.resolutions, resolutions);

  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJsonContent));
}

module.exports = {
  CSP_META_TAG_REG_EXP,
  extractRunTimeConfig,
  removeConfig,
  setConfig,
  setResolutionForDependency,
};
