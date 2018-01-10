<template>
  <div>
    <iframe
      frameborder="0"
      style="display: none;"
      :src="url"
      :onload="onLoad"
      ref="iframe"></iframe>
  </div>
</template>

<script>
import { createAction } from 'lively/messages';

const DOMAIN = `${window.location.protocol}//${window.location.host}`;

export default {
  name: 'Sandbox',
  props: {
    url: {
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
      // console.log('Received:', response);

      const isAction = (
        response && response.type === 'response' &&
        response.to && response.to.origin === this.props.origin
      );

      if (isAction) {
        this.$emit('message', response);
      }
    },

    injectCode({ input, execId, initiator }) {
      const payload = {
        initiator,
        input,
        execId,
      };

      const action = createAction('lively.exec', payload, this.props.origin);

      this.pending[action.id] = action;
      this.send(action);
    },

    send(message) {
      this.iframe.contentWindow.postMessage(message, DOMAIN);
    },

    onLoad() {
      this.ready = true;
      this.$emit('loaded');
    },
  },

  created() {
    window.addEventListener('message', this.onActionCompleted);

    // this.onLoad = this.onLoad.bind(this);
    // this.onActionCompleted = this.onActionCompleted.bind(this);
  },
};
</script>

<style>

</style>
