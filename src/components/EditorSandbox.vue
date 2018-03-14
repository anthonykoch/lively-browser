<template>
  <div>
    <app-sandbox
      ref="sandbox"
      url="/sandbox.html"
      :origin="origin"
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
      filename: 'lively.js',
      dirname: '/',
      logger,
    };
  },

  methods: {

    renderInitialCoverage(coverage) {
      this.coverage = Object.freeze(coverage);
      this.$refs.editor.renderInitialCoverage(coverage);
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
        }])
        .filter(p => !this.instrument.isLiteral({ type: p.type }));

      this.phantoms = Object.freeze(newPhantoms);
    },

    clearPhantoms() {
      this.phantoms = Object.freeze([]);
    },

    increaseActiveExecId() {
      return this.activeExecId += 1;
    },

    getInsertion(id) {
      return this.coverage[id];
    },

    async runScript() {
      if (this.transform == null) {
        return;
      }

      const activeExecId = this.increaseActiveExecId();
      const { filename, dirname } = this;

      const data = await this.transform(this.$refs.editor.getValue(), { filename });
      const error = data.error;

      if (error) {
        this.$emit('transform-error', { ...error, execId: activeExecId });

        if (error.loc) {
          this.addPhantom({
            execId: activeExecId,
            // Todo: Extract the error message from the stack trace
            content: error.name,
            line: error.loc.line,
            className: 'is-error',
            // layout: 'inline',
          });
        }

        return;
      }

      this.renderInitialCoverage(data.insertions);

      this.$refs.sandbox.injectCode({
        input: data.code,
        execId: activeExecId,
        dirname,
        filename,
        sourcemap: data.map,
      });
    },

    onEditorChange: debounce(function onEditorChange() {
      this.runScript();
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
            className: 'is-error',
            // layout: 'inline',
          });
        }

        const message = error.message;

        this.$emit('runtime-error', {
          message,
          location,
          loc,
          hasLocation,
          execId,
        });
      }
    },

    onSandboxReply(payload) {
      // Don't render any phantoms for things still going on in previous scripts
      if (payload.execId >= this.activeExecId) {
        const execId = payload.execId;

        // Avoid rendering phantoms for things that are redundant, link strings, numbers
        if (payload.expression && !this.instrument.isLiteral(payload.expression)) {
          const insertion = this.getInsertion(payload.expression.insertion.id);
          const loc = insertion.loc;

          this.$refs.editor.renderCovered(loc);

          this.addPhantom({
            type: insertion.type,
            execId,
            content: payload.expression.value,
            line: loc.end.line,
            // layout: 'inline',
          });
        }

        this.$emit('reply', payload);
      }
    },

    onSandboxDone(payload) {
      this.eraseOutdatedPhantoms();
      this.$refs.editor.updatePhantoms(true);
      this.$emit('done', payload);
    },

  },

  async mounted() {
    const [{ default: transform }, instrument] = await this.imports;

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

  components: {
    AppSandbox,
    AppEditor,
  },

};
</script>

<style scoped lang="scss">

</style>