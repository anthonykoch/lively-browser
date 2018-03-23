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
      // console.log(messages)

      if (Messages.isPong(messages[0])) {
        this.talkie.dispatch(messages);
      } else if (Array.isArray(messages)) {
        messages.forEach(message => {
          // TODO: Would be really nice if we could batch these emits as well, turn reply into replies
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
              return this.$emit('force-restart');
            }

            this.$emit('reply', {
              ...message.payload,
              execId,
            });
            this.$emit('reply', message.payload);
          }
        });
      } else if (messages.sandboxReady) {
        this.onWorkerReady()
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

      const lastTime = Date.now();

      this.talkie.on('this:failed-ping', () => {
        if (this.isBusy === false) {
          this.isBusy = true;
          this.$emit('busy', Date.now() - lastTime);
        }
      });

      this.talkie.on('this:pong', () => {
        if (this.isBusy) {
          this.isBusy = false;
          this.$emit('free');
        }
      });

      logger.info('Sandbox started');
    },

  },

  mounted() {
    this.isBusy = false;
    this.start();
  },

  destroyed() {
    this.stop();
  },

};
</script>
