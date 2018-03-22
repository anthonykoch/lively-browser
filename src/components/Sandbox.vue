<template>
  <div>
    <!-- <iframe
      frameborder="0"
      style="display: none;"
      :src="url"
      @load="onLoad"
      ref="iframe"></iframe> -->
  </div>
</template>

<script>
import Talkie from 'editorconnect-node/dist/talkie';
import * as Messages from 'editorconnect-node/dist/messages';
import cuid from 'cuid';

import logger from '@/logger';
import Worker from 'worker-loader!@/sandbox';

class SandboxTalkie extends Talkie {

  constructor(sender, options) {
    super(options);
    this.sender = sender;
  }

  get origin() {
    return { id: cuid() };
  }

  send(message) {
    this.sender.postMessage(message);
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

    onMessage({ data: messages }) {
      if (Array.isArray(messages)) {
        const isValid = messages.every(message => Messages.isValid(message));

        if (isValid) {
          this.talkie.dispatch(messages);
        } else {
          throw new Error('Invalid Talkie message ' + JSON.stringify(message));
        }
      } else if (messages.sandboxReady) {
        this.onWorkerReady()
      }
    },

    async injectCode(options) {
      this.token?.destroy?.();

      const { input, execId, filename, dirname, sourcemap } = options;

      const outgoingPayload = {
        __filename: filename,
        __dirname: dirname,
        input,
        execId,
        sourcemap,
      };

      if (this.talkie) {
        // console.time('exec');
        const start = Date.now();

        const token = this.talkie.call('lively-javascript:exec', outgoingPayload, {
          keepAlive: true,

          doneTimeout: 10000,

          replyTimeout: 10000,

          onReply: (payload, part) => {
            // const elapsed = Date.now() - start;
            // const replysRate = part / elapsed;
            // console.log(part, replysRate)

            if (part > 3000) {
              token.destroy();
              this.restart();
              this.$emit('force-restart');
            }

            this.$emit('reply', {
              ...payload,
              execId,
            });
          },

          onDone: (payload, parts) => {
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

        // console.timeEnd('exec');
        this.lastToken = token;

        return token.promise;
      }

      return null;
    },

    onWorkerReady() {
      this.talkie.startPings();
    },

    async onLoad() {
      this.$emit('load');
      this.loaded = true;
      this.queue.slice(0, 1).forEach(options => this.injectCode(options));
    },

    restart() {
      this.stop();
      this.start();
    },

    stop() {
      logger.info('Stopping sandbox');

      if (this.worker) {
        this.worker.terminate();
        this.worker.removeEventListener('message', this.onMessage);
      }

      if (this.talkie) {
        this.talkie.stopPings();
        this.talkie.removeAllListeners();
      }

      logger.info('Sandbox stopped');
    },

    start() {
      this.stop();

      this.worker = new Worker();
      this.worker.addEventListener('message', this.onMessage);
      this.talkie = new SandboxTalkie(this.worker, { pingFrequency: 100 });

      let lastTime = Date.now();

      this.talkie.on('this:failed-ping', () => {
        this.$emit('busy', Date.now() - lastTime);
      });

      logger.info('Sandbox started');
    },

  },

  mounted() {
    this.start();
  },

  destroyed() {
    this.stop();
  },

};
</script>
