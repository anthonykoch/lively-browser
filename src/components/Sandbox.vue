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

import { createAction, createResponse, isResponseFromOrigin } from 'lively/messages';

const DOMAIN = `${window.location.protocol}//${window.location.host}`;

export default {

  name: 'Sandbox',

  props: {
    url: { type: String, required: true },
    origin: { type: String, required: true },
  },

  data() {
    return {
      ready: false,
      pending: {},
    };
  },

  methods: {

    onActionCompleted({ data: response }) {
      // console.log('SandboxReceived:', response);

      const isValid = isResponseFromOrigin(response, this.$props.origin);

      if (isValid && response.payload.error) {
        this.$emit('response-error', response);
      } else if (isValid) {
        this.$emit('response', response);
      }
    },

    injectCode(options) {
      const { input, execId, filename, dirname, sourcemap } = options;

      const payload = {
        __filename: filename,
        __dirname: dirname,
        input,
        execId,
        sourcemap,
      };

      const action = createAction('lively.exec', payload, this.$props.origin);

      this.pending[action.id] = action;
      this.send(action);
    },

    send(message) {
      this.$refs.iframe.contentWindow.postMessage(message, DOMAIN);
    },

    async onLoad() {
      this.$emit('load');
      this.queue.forEach(options => this.injectCode(options));
    },
  },

  created() {
    this.queue = [];

    window.addEventListener('message', this.onActionCompleted);
  },

};
</script>

<style>

</style>
