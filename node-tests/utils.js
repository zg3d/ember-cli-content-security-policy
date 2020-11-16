const { merge } = require('lodash');

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

async function getInstalledVersionOfDependency(testProject, dependency) {
  const { stdout: yarnWhyOutput } = await testProject.runCommand('yarn', 'why', dependency);
  const matches = yarnWhyOutput.match(
    new RegExp(
      `=> Found "${dependency}@(\\d+.\\d+.\\d+)"`
    )
  );
  const [, version] = matches;
  return version;
}

async function patchPackageJson(testProject, patch) {
  const packageJson = JSON.parse(
    await testProject.readFile('package.json')
  );
  merge(packageJson, patch);
  await testProject.writeFile('package.json', JSON.stringify(packageJson));
}

module.exports = {
  CSP_META_TAG_REG_EXP,
  extractRunTimeConfig,
  getInstalledVersionOfDependency,
  patchPackageJson,
  removeConfig,
  setConfig,
};
