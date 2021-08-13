const { readFileSync } = require('fs');
const { resolve } = require('path');
const cli = require('commander');
const { version } = require('../package.json');
const { createServer } = require('./server');

const optionNames = [
  'socks',
  'port',
  'level',
  'config',
  'host',
];

function getConfig(configValue) {

  let content = configValue;

  if(!configValue.startsWith('{')) {
    const absFile = resolve(process.cwd(), configValue);
    content = readFileSync(absFile).toString('utf8');
  }

  let fileConfig = null;

  try {
    fileConfig = JSON.parse(content);
  } catch(err) {
    const error = new Error(`invalid json content: ${err.message}`);
    error.code = err.code;
    throw error;
  }

  return fileConfig;
}

function getOptionsArgs(args) {
  const options = {};

  optionNames.forEach((name) => {
    if(Object.hasOwnProperty.apply(args, [name])) {
      if(typeof args[name] !== 'string') {
        throw new Error(`string "${name}" expected`);
      }

      if(name === 'socks') {
        options.proxies = [{ socks: args[name] }];
      }
      else {
        options[name] = args[name];
      }
    }
  });

  return options;
}

function main() {
  cli.version(version)
    .option('-s, --socks [socks]', 'specify your socks proxy hosts, default: 127.0.0.1:1080')
    .option('-p, --port [port]', 'specify the listening port of http proxy server, default: 8080')
    .option('-l, --host [host]', 'specify the listening host of http proxy server, default: 127.0.0.1')
    .option('-c, --config [config]', 'path to a json config file or the json config as string')
    .option('--level [level]', 'log level, vals: info, error')
    .parse(process.argv);

  const options = getOptionsArgs(cli.opts());

  let fileConfig = null;

  if(options.config) {
    fileConfig = getConfig(options.config);
  }

  Object.assign(options, fileConfig);

  createServer(options);
}

module.exports = {
  getOptionsArgs,
  main,
};
