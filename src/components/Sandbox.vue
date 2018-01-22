<template>
  <div>
    <iframe
      frameborder="0"
      style="display: none;"
      :src="url"
      @load="onLoad"
      ref="iframe"></iframe>
  </div>
</template>

<script>
import path from 'path';

import { createAction } from 'lively/messages';
import { normalizeError } from 'lively/utils';

const DOMAIN = `${window.location.protocol}//${window.location.host}`;

let transform = null;

export default {
  name: 'Sandbox',
  props: {
    url: {
      type: String,
      required: true,
    },
    origin: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      ready: false,
      pending: {},
    };
  },
  methods: {
    onActionCompleted({ data: response }) {
      console.log('SandboxReceived:', response);

      const isAction = (
        response && response.type === 'response' &&
        response.to && response.to.origin === this.$props.origin
      );

      if (isAction && response.payload.error) {
        this.$emit('error', {
          execId: response.payload.execId,
          error: response.payload.error,
        });
      } else if (isAction) {
        this.$emit('response', response);
      }
    },

    injectCode({ input, execId, initiator }) {
      if (transform === null) {
        return;
      }

      const filename = path.basename(initiator);
      const data = transform(input, { filename });

      if (data.error) {
        this.$emit('error', {
          error: normalizeError(data.error, data.map, null, null),
          execId,
        });

        return;
      }

      const payload = {
        __filename: filename,
        __dirname: path.dirname(initiator),
        input: data.code,
        execId,
        map: data.map,
      };

      const action = createAction('lively.exec', payload, this.$props.origin);


      this.pending[action.id] = action;
      this.send(action);
      // console.log(Date.now());
    },

    send(message) {
      this.$refs.iframe.contentWindow.postMessage(message, DOMAIN);
    },

    onLoad() {
      this.importPromise.then(() => this.$emit('load'));
    },
  },

  created() {
    this.importPromise =
      import('lively/code')
        .then(({ transform: _transform }) => {
          transform = _transform;
        });

    window.addEventListener('message', this.onActionCompleted);
  },
};
</script>

<style>

</style>
