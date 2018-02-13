<template>
  <div>
    <app-sandbox
      ref="sandbox"
      url="/sandbox.html"
      :origin="origin"
      @response="onSandboxResponse"
      @response-error="onSandboxError"
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
      return phantom.execId < this.activeExecId;
    },

    onEditorChange: debounce(function () {
      this.runScript();
    }, 200, {
      trailing: true,
    }),

    increaseActiveExecId() {
      return this.activeExecId += 1;
    },

    runScript() {
      if (this.transform == null) {
        return;
      }

      const activeExecId = this.increaseActiveExecId();
      const { filename, dirname } = this;

      const data = this.transform(this.$refs.editor.getValue(), { filename });
      const error = data.error;

      if (error) {
        this.$emit('transform-error', error, activeExecId);

        if (error.loc) {
          this.addPhantom({
            execId: activeExecId,
            content: `\u{1f608} ${error.message}`,
            line: error.loc.line,
            className: 'Phantom--is-error',
          });
        }

        return;
      }

      this.$refs.sandbox.injectCode({
        input: data.code,
        execId: activeExecId,
        dirname,
        filename,
        sourcemap: data.map,
      });
    },

    onSandboxLoaded() {
      this.runScript();
    },

    onSandboxError(response) {
      const { payload: { execId, error } } = response;
      const loc = error.loc;
      const hasLocation = loc && Number.isFinite(loc.line) && Number.isFinite(loc.column);

      if (execId >= this.activeExecId) {
        if (hasLocation) {
          this.addPhantom({
            execId,
            content: `\u{1f608} ${error.message}`,
            line: loc.line,
            className: 'Phantom--is-error',
          });
        } else {
          // Todo: Figure out smarter way of updating phantoms
          this.clearPhantoms();
          // console.log('lol cleared');
        }

        const message = error.message;
        // const message = Error.prototype.toString.call(error);

        this.$emit('response-error', {
          message,
          location,
          loc,
          hasLocation,
        }, response);
      }
    },

    onSandboxResponse(response) {
      // console.log('Response:', response);

      const result = response.payload;

      // Don't render any phantoms for things still going on in previous scripts
      // console.log('ResponseIds:', result.execId, this.activeExecId);

      if (result.execId >= this.activeExecId) {
        const execId = result.execId;

        if ((!response.done) && result.expression) {
          const expr = result.expression;
          this.$emit('response', response);

          this.addPhantom({
            isExpired: this.isPhantomExpired,
            execId,
            content: expr.value,
            line: expr.loc.end.line,
          });
        }
      }
    },

  },

  async mounted() {
    const [{ transform }] = await this.imports;

    this.transform = transform;

    if (this.execOnReady) {
      this.runScript();
    }
  },

  created() {
    this.phantoms = [];
    this.transform = null;
    this.imports = Promise.all([import('lively/code')]);
  },

  components: {
    AppSandbox,
    AppEditor,
  },

};
</script>

<style scoped lang="scss">

</style>
