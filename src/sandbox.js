import sourcemap from 'source-map';

import * as JSUtils from 'scuffka-javascript/dist/utils';
import { run } from 'scuffka-javascript/dist/exec';
import Talkie from 'editorconnect-node/dist/talkie';
import * as Messages from 'editorconnect-node/dist/messages';
import cuid from 'cuid';

import logger from '@/logger';

import thewasms from 'file-loader!source-map/lib/mappings.wasm';

// Initialize the wasms
sourcemap.SourceMapConsumer.initialize({
  'lib/mappings.wasm': thewasms,
});

// const DOMAIN = `${window.location.protocol}//${window.location.host}`;
const ORIGIN = cuid();

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

class Receiver extends Talkie {
  get origin() {
    return { id: ORIGIN };
  }

  send(message) {
    queue.push(message);
  }
}

let queue = [];
let timeoutId = null;

const receiver = new Receiver();

const start = () => {
  if (queue.length) {
    postMessage(queue.slice(0, CHUNK_SIZE));
    queue = queue.slice(CHUNK_SIZE);
  }

  timeoutId = setTimeout(start, CHUNK_TIMEOUT);
}

start();

// eslint-disable-next-line no-unused-vars
function stop() {
  clearTimeout(timeoutId);
}

const exec = async (payload, reply) => {
  const { execId, __dirname, __filename } = payload;

  const module = {
    require: $require,
    exports: {},
  };

  const coveredInsertions = {};

  /**
   * Resets variables to default state to release memory
   */
  const reset = () => {
    coverage = { ids: [], values: [], };
  };

  let lastSent = false;
  let coverage = null;

  reset();

  const result = await run(payload.input, {
    track(id, hasValue, value) {

      if (id > 40000) {
        if (lastSent) {
          reply({ maxCoverageReached: true });
          lastSent = true
        }

        return;
      }

      if (!coveredInsertions.hasOwnProperty(id)) {
        coveredInsertions[id] = 0;
      }

      // Only serialize the first 11 values
      if (hasValue) {
      // if (hasValue && coveredInsertions[id] < 11) {
        coverage.ids.push(id);
        coverage.values.push(value);
      }

      // Only send the insertion point once
      if (coveredInsertions[id] === 0) {
        reply({
          execId,
          insertionId: id,
        });
      }

      coveredInsertions[id] += 1;
    },
    env: 'browser',
    sourcemap: payload.sourcemap,
    module,
    __dirname,
    __filename,
  });

  // console.log(result?.error?.stack)

  // TODO: If there are more values to serialize then do them later
  // setTimeout(() => {

  //   while (chunkSize !== 0) {
  //     const serialized = serialize(values, lastChunkSize);

  //     reply(serialized);
  //   }
  // }, 0);

  reply({
    execId,
    coverage: toJson(coverage),
  });

  reset();

  return {
    execId,
    coveredInsertions,
    result,
  };
};

const toJson = (coverage) => {
  return {
    ids: coverage.ids.map(id => id),
    values: coverage.values.map(value => JSUtils.serialize(value)),
  };
};

receiver.on('exec', exec);

self.addEventListener('message', async ({ data: message }) => {
  if (Messages.isPing(message)) {
    // We need to send pong right away, so we just postMessage an array.
    postMessage([Messages.pong()]);
  } else {
    receiver.dispatch([message]);
  }
});

self.addEventListener('error', () => {
  // console.log('apwokdawpd');
});

postMessage({ sandboxReady: true });
