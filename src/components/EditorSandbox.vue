<template>
  <div>
    <app-sandbox
      ref="sandbox"
      url="/sandbox.html"
      :origin="origin"
      @busy="onSandboxBusy"
      @reply="onSandboxReply"
      @done="onSandboxDone"
      @runtime-error="onSandboxRuntimeError"
    ></app-sandbox>
    <app-editor
      ref="editor"
      style="font-size: 14px"
      :code="code"
      :phantoms="phantoms"
      :coverage="coverage"
      @change="onEditorChange">
    </app-editor>
  </div>
</template>

<script>
import debounce from 'lodash/debounce';
import cuid from 'cuid';

import AppEditor from '@/components/Editor';
import AppSandbox from '@/components/Sandbox';

import logger from '@/logger';

export default {

  name: 'EditorSandbox',

  props: {
    code: {
      required: true,
      type: String,
    },
    execOnReady: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      coverage: Object.freeze([]),
      phantoms: Object.freeze([]),
      origin: `name:lively-editor;id:${cuid()}`,
      id: cuid(),
      activeExecId: 0,
      filename: '/lively.js',
      dirname: '/',
      logger,
    };
  },

  methods: {

    renderInitialCoverage(coverage) {
      // console.log(coverage);
      this.coverage = Object.freeze(coverage);
      this.$refs.editor.renderInitialCoverage(coverage.items, this.activeExecId);
    },

    eraseOutdatedPhantoms() {
      this.phantoms =
        Object.freeze(
            this.phantoms.filter(p => p.execId >= this.activeExecId)
          );
    },

    addPhantom(phantom) {
      const newPhantoms = this.phantoms
        .filter(p => {
          return (
              (p.execId < phantom.execId && p.line > phantom.line) ||
              (p.execId === phantom.execId)
            );
        })
        .concat([{
          ...phantom,
          editorId: this.id,
        }]);

      this.phantoms = Object.freeze(newPhantoms);
    },

    clearPhantoms() {
      this.phantoms = Object.freeze([]);
    },

    increaseActiveExecId() {
      return this.activeExecId += 1;
    },

    getInsertion(id) {
      return this.coverage.items[id];
    },

    isSkippable(insertion, meta) {
      const node = insertion.node;

      return (
          meta.isPromise                              ||
          this.instrument.isLiteral(node)             ||
          insertion.context === 'ReturnStatement'     ||
          insertion.context === 'VariableDeclaration'
        );
    },

    async runScript() {
      if (this.transform == null) {
        return;
      }

      const activeExecId = this.increaseActiveExecId();
      const { filename, dirname } = this;

      const data = await this.transform(this.$refs.editor.getValue(), { filename });
      const error = data.error;

      console.log(data.code);

      // console.log(data.badLoops);

      if (data.badLoops?.length) {
        return this.$emit('potential-freeze', data.badLoops);
      }

      if (error) {
        this.$emit('transform-error', { ...error, execId: activeExecId });

        if (error.loc) {
          this.addPhantom({
            execId: activeExecId,
            // Todo: Extract the error message from the stack trace
            content: error.name?.trim(),
            line: error.loc.line,
            column: error.loc.column,
            className: 'is-error',
            // layout: 'inline',
          });
        }

        return;
      }

      this.renderInitialCoverage({
        execId: this.activeExecId,
        items: data.insertions,
      });

      this.$refs.sandbox.injectCode({
        input: data.code,
        execId: activeExecId,
        dirname,
        filename,
        sourcemap: data.map,
      });
    },

    onEditorChange: debounce(function onEditorChange() {
      // this.runScript();
    }, 200, {
      trailing: true,
    }),

    onSandboxRuntimeError(payload) {
      const { execId, error } = payload;
      const loc = error.loc;
      const hasLocation = loc && Number.isFinite(loc.line) && Number.isFinite(loc.column);

      if (execId >= this.activeExecId) {
        if (hasLocation) {
          this.addPhantom({
            execId,
            content: error.message,
            line: loc.line,
            column: loc.column,
            className: 'is-error',
          });
        }

        const message = error.message.trim();

        this.$emit('runtime-error', {
          message,
          location,
          loc,
          hasLocation,
          execId,
        });
      }
    },

    onSandboxBusy(time) {
      this.$emit('busy', time);
    },

    onSandboxReply(payload) {
      // Don't render any phantoms for things still going on in previous scripts
      const execId = payload.execId;

      // console.log('Reply:', payload.execId, this.activeExecId)

      if (execId >= this.activeExecId) {

        // Avoid rendering phantoms for things that are redundant, link strings, numbers
        if (payload.expression) {
          const meta = payload.meta;
          const insertion = this.getInsertion(payload.insertion.id);

          if (!this.isSkippable(insertion, meta)) {
            const loc = insertion.node.loc;

            this.addPhantom({
              insertion,
              execId,
              content: payload.expression.value,
              line: loc.end.line,
            });
          }
        }

        this.$emit('reply', payload);
      }

      if (payload.insertion) {
        const item = this.coverage.items[payload.insertion.id];

        this.$refs.editor.renderCovered(item, execId);
      }
    },

    onSandboxDone(payload) {
      this.eraseOutdatedPhantoms();
      this.$refs.editor.updatePhantoms(true);
      this.$emit('done', payload);
    },

    onKeydown(cm, event) {
      if (event.ctrlKey && event.which === 13) {
        this.runScript();
      }
    },

  },

  async mounted() {
    const [{ default: transform }, instrument] = await this.imports;

    this.cm = this.$refs.editor.cm;
    this.cm.on('keydown', this.onKeydown);
    this.instrument = instrument;
    this.transform = transform;

    if (this.execOnReady) {
      this.runScript();
    }
  },

  created() {
    this.phantoms = [];
    this.transform = null;
    this.imports = Promise.all([
      import('lively-javascript/dist/transform'),
      import('lively-javascript/dist/instrument'),
    ]);
  },

  destroyed() {
    this.cm.off('keydown', this.onKeydown);
  },

  components: {
    AppSandbox,
    AppEditor,
  },

};
</script>

<style scoped lang="scss">

</style>
