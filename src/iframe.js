import sourcemap from 'source-map';

import * as JSUtils from 'lively-javascript/dist/utils';
import { run } from 'lively-javascript/dist/exec';
import Talkie from 'editorconnect-node/dist/talkie';
import * as Messages from 'editorconnect-node/dist/messages';

import logger from '@/logger';

import thewasms from 'file-loader!source-map/lib/mappings.wasm';

// Initialize the wasms
sourcemap.SourceMapConsumer.initialize({
  'lib/mappings.wasm': thewasms,
});

const DOMAIN = `${window.location.protocol}//${window.location.host}`;
const ORIGIN = `name:lively-iframe;id:${Math.random() + Math.random()}`;

window.process = process;

// eslint-disable-next-line
logger.info('Iframe.js started');

function loadModule(name) {
  /* eslint-disable global-require */
  if (name === 'util') {
    return require('util');
  } else if (name === 'buffer') {
    return require('buffer');
  } else if (name === 'assert') {
    return require('assert');
  } else if (name === 'path') {
    return require('path');
  } else if (name === 'events') {
    return require('events');
  }
  /* eslint-enable */

  throw new Error(`Cannot find module ${name}`);
}

const $require = moduleName => loadModule(moduleName);


class Receiver extends Talkie {

  get origin() {
    return { id: ORIGIN };
  }

  send(message) {
    window.parent.postMessage(message, DOMAIN);
  }

};

const receiver = new Receiver();

receiver.on('lively-javascript:exec', async (payload, reply) => {
  // eslint-disable-next-line
  const __dirname = payload.__dirname;
  // eslint-disable-next-line
  const __filename = payload.__filename;
  const exports = {};
  const module = {
    require: $require,
    exports,
  };

  const result = await run(payload.input, {
    notifiers: {
      expression: [
        (id, value) => {
          reply({
            filename: __filename,
            expression: {
              insertion: { id },
              value: JSUtils.serialize(value),
            },
          });
        },
      ],
    },
    env: 'browser',
    sourcemap: payload.sourcemap,
    module,
    __dirname,
    __filename,
  });

  if (Number.isFinite(result?.error?.loc?.line)) {
    // Normalize lines to start at 1 since node errors start at 1.
    // No need to mess with the column since they start at 0.
    // result.error.loc.line -= 1;
  }

  return result;
});

window.addEventListener('message', ({ data: message }) => {
  if (Messages.isValid(message)) logger.info('IframeIncoming', Date.now(), Messages.isValid(message), message);

  if (Messages.isValid(message)) {
    receiver.dispatch([message]);
  }
});
