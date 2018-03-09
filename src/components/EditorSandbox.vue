<template>
  <div>
    <app-sandbox
      ref="sandbox"
      url="/sandbox.html"
      :origin="origin"
      @reply="onSandboxReply"
      @done="onSandboxDone"
      @runtime-error="onSandboxRuntimeError"
      @load="onSandboxLoaded"
    ></app-sandbox>
    <app-editor
      ref="editor"
      style="font-size: 14px"
      :code="code"
      :phantoms="phantoms"
      @change="onEditorChange">
    </app-editor>
  </div>
</template>

<script>
import debounce from 'lodash/debounce';
import cuid from 'cuid';

import AppEditor from '@/components/Editor';
import AppSandbox from '@/components/Sandbox';

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
      origin: `name:lively-editor;id:${cuid()}`,
      isSandboxLoaded: false,
      id: cuid(),
      activeExecId: 0,
      filename: 'lively.js',
      dirname: '/',
      console,
    };
  },

  methods: {

    renderCoverage(insertions) {
      this.insertions = insertions;
      // this.$refs.editor.render
    },

    addPhantom(phantom) {
      this.$refs.editor.addPhantom({
        ...phantom,
        isExpired: this.isPhantomExpired,
        editorId: this.id,
      });
    },

    clearPhantoms() {
      this.$refs.editor.clearPhantoms();
    },

    isPhantomExpired(phantom) {
      // console.log('expired', this.activeExecId > phantom.execId,
      // phantom.execId, this.activeExecId,);

      return this.activeExecId > phantom.execId;
    },

    increaseActiveExecId() {
      return this.activeExecId += 1;
    },

    getInsertionLocation(id) {
      return this.insertions[id].loc;
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
            content: `\u{1f608} ${error.name}`,
            line: error.loc.line,
            className: 'is-error',
            // layout: 'inline',
          });
        }

        return;
      }

      this.renderCoverage(data.insertions);

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

    onSandboxLoaded() {
      this.runScript();
    },

    onSandboxRuntimeError(payload) {
      const { execId, error } = payload;
      const loc = error.loc;
      const hasLocation = loc && Number.isFinite(loc.line) && Number.isFinite(loc.column);

      if (execId >= this.activeExecId) {
        if (hasLocation) {
          this.addPhantom({
            execId,
            content: `\u{1f608} ${error.message}`,
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

    onSandboxDone(payload) {
      console.log('SandboxDone:', payload)

      this.$refs.editor.updatePhantoms(true);
      this.$emit('done', payload);
    },

    onSandboxReply(payload) {
      console.log('SandboxReplied:', payload);

      // Don't render any phantoms for things still going on in previous scripts
      // console.log('ExecIds:', result.execId, this.activeExecId);

      if (payload.execId >= this.activeExecId) {
        const execId = payload.execId;

        if (payload.expression) {
          const expr = payload.expression;
          const loc = this.getInsertionLocation(expr.insertion.id);

          this.addPhantom({
            isExpired: this.isPhantomExpired,
            execId,
            content: expr.value,
            line: loc.end.line,
            // layout: 'inline',
          });
        }

        this.$emit('reply', payload);
      }
    },

  },

  async mounted() {
    const [{ default: transform }] = await this.imports;

    this.transform = transform;

    if (this.execOnReady) {
      this.runScript();
    }
  },

  created() {
    this.phantoms = [];
    this.transform = null;
    this.imports = Promise.all([import('lively-javascript/dist/transform')]);
  },

  components: {
    AppSandbox,
    AppEditor,
  },

};
</script>

<style scoped lang="scss">

</style>
