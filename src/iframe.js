import random from 'lodash/random';

import { run } from 'lively/exec';
import { createRunner } from 'lively/runner';
import { createTracker, createRecorder } from 'lively/tracker';
import { createSendResponse } from 'lively/messages';

const DOMAIN = `${window.location.protocol}//${window.location.host}`;
const ORIGIN = `name:lively-iframe;id:${Math.random() + Math.random()}`;
const FUNCTION_ID = `LIVELY_INSPECT_${random(1000000, 1999999)}`;

window.process = process;

console.log('Iframe.js started');

function loadModule(name) {
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

  throw new Error(`Cannot find module ${name}`);
}

const _require = (moduleName) => {
  return loadModule(moduleName);
};

const actions = {

  'lively.exec'(action, sendResponse) {
    const recorder = createRecorder();
    const tracker  = createTracker(recorder);

    recorder.on('data', (expression) => {
      sendResponse({
        execId: action.payload.execId,
        expression: expression,
      });
    });

    const exports = {};
    const module = {
      require: _require,
      exports,
    };

    const result = run(action.payload.input, {
      tracker,
      functionId: FUNCTION_ID,
      initiator: action.payload.initiator,
      module,
    });

    recorder.removeAllListeners();

    return sendResponse({
      ...result,
      execId: action.payload.execId,
    }, { done: true });
  },

};

const runner = createRunner(actions);

const sender = {
  send(message) {
    // console.log('IframeResponse:', message);
    window.parent.postMessage(message, DOMAIN);
  },
};

window.addEventListener('message', ({ data: message }) => {
  // if (message.type) {
  //   console.log('IframeCommand:', JSON.stringify({
  //     type: message.name,
  //     message,
  //   }));
  // }

  if (message.type === 'action') {
    runner.run(message, createSendResponse(message, sender, ORIGIN));
  }
});
