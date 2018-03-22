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

const CHUNK_TIMEOUT = 150;
const CHUNK_SIZE = 150;

class Receiver extends Talkie {

  constructor() {
    super();
    this.queue = [];
    this.start();
  }

  start() {
    const loop = () => {
      console.log('CHUNKY BOIS');
      postMessage(this.queue.slice(0, CHUNK_SIZE));
      this.queue = this.queue.slice(CHUNK_SIZE);
      this.timeoutId = setTimeout(loop, CHUNK_TIMEOUT);
    }

    loop();
  }

  stop() {
    clearTimeout(this.timeoutId);
  }

  get origin() {
    return { id: ORIGIN };
  }

  send(message) {
    // window.parent.postMessage(message, DOMAIN);
    this.queue.push(message);
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
    track(id, hasValue, value) {
      // console.log(id, hasValue, value)

      console.time('hey');
      if (hasValue) {
        // console.log('isexpression')
        reply({
          // filename: __filename,
          // insertion: { id },
          // meta: {
          //   isPromise: typeof value?.then === 'function',
          // },
          // expression: {
          //   value: 'undefined',
          //   // value: JSUtils.serialize(value),
          // },
        });
      } else {
        // console.log('replying ma dude')
        reply({
          // filename: __filename,
          // insertion: { id },
        });
      }
      console.timeEnd('hey');
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

  return result;
});

self.addEventListener('message', ({ data: message }) => {
  if (Messages.isPing(message)) {
    postMessage([Messages.pong()]);
  }

  if (Messages.isValid(message)) {
    logger.info('IframeIncoming', Date.now(), Messages.isValid(message), message);
    receiver.dispatch([message]);
  }
});

postMessage({ sandboxReady: true });
