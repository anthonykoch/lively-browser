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

  // eslint-disable-next-line class-methods-use-this
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

  mounted() {
    this.isBusy = false;
    this.start();
  },

  destroyed() {
    this.stop();
  },

  methods: {

    onMessage({ data: messages }) {
      // console.log(messages)
      if (Messages.isPong(messages[0])) {
        this.talkie.dispatch(messages);
      } else if (Array.isArray(messages)) {
        messages.forEach((message) => {
          // TODO: Would be really nice if we could batch these emits as well,
          //       turn reply into replies
          const execId = message.execId;

          if (message.done) {
            let event = 'done';

            if (message.payload.error) {
              event = 'runtime-error';
            }

            this.$emit(event, {
              ...message.payload,
              execId,
            });
          } else {
            if (message.part > 4000) {
              this.restart();
              this.$emit('force-restart');
              return;
            }

            this.$emit('reply', {
              ...message.payload,
              execId,
            });
            this.$emit('reply', message.payload);
          }
        });
      } else if (messages.sandboxReady) {
        this.onWorkerReady();
      }
    },

    async injectCode(options) {
      const { input, execId, filename, dirname, sourcemap } = options;

      const outgoingPayload = {
        __filename: filename,
        __dirname: dirname,
        input,
        execId,
        sourcemap,
      };

      if (this.talkie) {
        this.worker.postMessage({
          action: 'exec',
          meta: { execId },
          payload: outgoingPayload,
        });
      }

      return null;
    },

    requestValue(insertions) {
      this.worker.postMessage({
        action: 'request-value',
        meta: {},
        payload: {
          insertions,
        },
      });
    },

    onWorkerReady() {
      this.talkie.startPings();
      console.timeEnd('start');
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

      console.time('start');
      this.worker = new Worker();
      this.worker.addEventListener('message', this.onMessage);
      this.talkie = new SandboxTalkie(this.worker, { pingFrequency: 100 });

      let lastTime = Date.now();

      this.talkie.on('this:failed-ping', () => {
        if (this.isBusy === false) {
          this.isBusy = true;
          this.$emit('busy', Date.now() - lastTime);
        }
      });

      this.talkie.on('this:pong', () => {
        if (this.isBusy) {
          lastTime = 0;
          this.isBusy = false;
          this.$emit('free');
        }
      });

      logger.info('Sandbox started');
    },

  },

};
</script>
