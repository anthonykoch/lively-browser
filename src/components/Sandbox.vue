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

const ORIGIN = cuid();

class SandboxTalkie extends Talkie {
  constructor(sender, options) {
    super(options);
    this.sender = sender;
  }

  // eslint-disable-next-line class-methods-use-this
  get origin() {
    return { id: ORIGIN };
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

      if (messages.sandboxReady) {
        this.onWorkerReady();
      } else {
        this.talkie.dispatch(messages);

        const chunkedMessages =
          messages.reduce((chunks, message) => {
            const last = chunks[chunks.length - 1];

            // This if statement is here to filter out pongs from being console logged
            if (message.type === 'pong') {
              return chunks;
            }

            if (message.type === 'reply') {
              if (message.done && message.to.event === 'exec') {
                chunks.push([message], []);
              } else {
                last.push(message);
              }
            }

            return chunks;
          }, [[]]);


        for (const chunk of chunkedMessages) {
          if (chunk.length === 0) {
            continue;
          }

          const firstMessage = chunk[0];

          if (firstMessage.done) {
            let event = 'done';

            if (firstMessage.payload?.result.error != null) {
              event = 'runtime-error';
            }

            this.$emit(event, firstMessage.payload);
          } else {
            // if (message.part > 8000) {
            //   // Once we reach this, we're just gonna stop because that's going to be very
            //   // cpu and memory intensive
            //   this.restart();
            //   this.$emit('force-restart');
            //   break;
            // }

            // console.log('Replies:', chunk.length);
            this.$emit('replies', chunk.map(({ payload }) => payload));
          }
        }

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

      if (this.talkie != null) {
        this.talkie.call('exec', outgoingPayload);
      }

      return null;
    },

    requestValue(insertions) {
      return this.talkie.call('request-value', {
        insertions,
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
