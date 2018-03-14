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
import Talkie from 'editorconnect-node/dist/talkie';
import * as Messages from 'editorconnect-node/dist/messages';
import cuid from 'cuid';

const DOMAIN = `${window.location.protocol}//${window.location.host}`;

class IframeTalkie extends Talkie {

  constructor(iframe) {
    super();
    this.iframe = iframe;
  }

  get origin() {
    return { id: cuid() };
  }

  send(message) {
    this.iframe.contentWindow.postMessage(message, DOMAIN);
  }

}

export default {

  name: 'Sandbox',

  props: {
    url: { type: String, required: true },
    origin: { type: String, required: true },
  },

  data() {
    return {
      ready: false,
    };
  },

  methods: {

    onIframeMessage({ data }) {
      if (Messages.isValid(data)) {
        this.talkie.dispatch([data]);
      }
    },

    async injectCode(options) {
      if (!this.loaded) {
        this.queue.push(options);
        return null;
      }

      const { input, execId, filename, dirname, sourcemap } = options;

      const outgoingPayload = {
        __filename: filename,
        __dirname: dirname,
        input,
        execId,
        sourcemap,
      };

      if (this.talkie) {
        console.time('exec');
        const call = await this.talkie.call('lively-javascript:exec', outgoingPayload, {
          onReply: (payload) => {
            this.$emit('reply', {
              ...payload,
              execId,
            });
          },
          onDone: (payload) => {
            let event = 'done';

            if (payload.error) {
              event = 'runtime-error';
            }

            this.$emit(event, {
              ...payload,
              execId,
            });
          },
        });

        console.timeEnd('exec');

        return call;
      }

      return null;
    },

    async onLoad() {
      this.$emit('load');
      this.loaded = true;
      this.queue.slice(0, 1).forEach(options => this.injectCode(options));
    },
  },

  mounted() {
    this.talkie = new IframeTalkie(this.$refs.iframe);
  },

  destroyed() {
    window.removeEventListener('message', this.onIframeMessage);
    this.queue = [];
  },

  created() {
    this.queue = [];
    this.loaded = false;

    window.addEventListener('message', this.onIframeMessage);
  },

};
</script>
