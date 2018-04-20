import sourcemap from 'source-map';

import * as JSUtils from 'scuffka-javascript/dist/utils';
import { run } from 'scuffka-javascript/dist/exec';
// import Talkie from 'editorconnect-node/dist/talkie';
import * as Messages from 'editorconnect-node/dist/messages';

import logger from '@/logger';

import thewasms from 'file-loader!source-map/lib/mappings.wasm';

// Initialize the wasms
sourcemap.SourceMapConsumer.initialize({
  'lib/mappings.wasm': thewasms,
});

// const DOMAIN = `${window.location.protocol}//${window.location.host}`;
const ORIGIN = `name:lively-iframe;id:${Math.random() + Math.random()}`;

// window.process = process;

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

const CHUNK_TIMEOUT = 32;
const CHUNK_SIZE = 5000;

let queue = [];
let timeoutId = null;
let values = {};

const start = () => {
  if (queue.length) {
    postMessage(queue.slice(0, CHUNK_SIZE));
    queue = queue.slice(CHUNK_SIZE);
  }

  timeoutId = setTimeout(start, CHUNK_TIMEOUT);
}

start();

function stop() {
  clearTimeout(timeoutId);
}

function enqueue(item) {
  queue.push(item);
}

const exec = async (payload, meta) => {
  const { execId } = meta;
  // eslint-disable-next-line
  const __dirname = payload.__dirname;
  // eslint-disable-next-line
  const __filename = payload.__filename;
  const exports = {};

  const module = {
    require: $require,
    exports,
  };

  let part = 0;

  const idsByLine = {};

  const result = await run(payload.input, {
    track(id, hasValue, value) {
      // console.log(id, hasValue, value)

      if (!idsByLine.hasOwnProperty(id)) {
        idsByLine[id] = 0;
      }

      // Don't do anything because we only want to show 10 at a time
      // and returning after 10 improves performance tremendously
      if (idsByLine[id] === 10) {
        return;
      }

      idsByLine[id] += 1;

      if (hasValue) {
        part += 1;
        values[id] = value;

        enqueue({
          execId,
          part,
          done: false,
          payload: {
            insertion: { id },
            meta: {
              isPromise: value && typeof value.then === 'function',
            },
            // expression: {
            //   // value: 'undefined',
            //   value: JSUtils.serialize(value),
            // },
          }
        });
      } else {
        // console.log('replying ma dude')
        part += 1;

        enqueue({
          execId,
          part,
          done: false,
          payload: {
            insertion: { id },
          },
        });
      }
      // console.timeEnd('hey');
    },
    env: 'browser',
    sourcemap: payload.sourcemap,
    module,
    __dirname,
    __filename,
  });

  // console.log(result?.error?.stack)

  if (Number.isFinite(result?.error?.loc?.line)) {
    // Normalize lines to start at 1 since node errors start at 1.
    // No need to mess with the column since they start at 0.
    // result.error.loc.line -= 1;
  }

  part += 1;

  const last = { payload: result, execId, done: true, part };

  enqueue(last);

  return last;
};

self.addEventListener('message', async ({ data: message }) => {
  if (Messages.isPing(message)) {
    postMessage([Messages.pong()]);
  } else if (message.action === 'exec') {
    logger.info('SandboxIncoming', Date.now(), Messages.isValid(message), message);

    exec(message.payload, message.meta);
  }
});

self.addEventListener('error', () => {
  console.log('apwokdawpd')
});

postMessage({ sandboxReady: true });
