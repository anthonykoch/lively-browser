<template>
  <div>
    <app-sandbox
      ref="sandbox"
      :origin="origin"
      url="/sandbox.html"
      @response="onSandboxResponse"
      @load="onSandboxLoaded"
      @error="onSandboxError"
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
import uniqueId from 'lodash/uniqueId';

import AppEditor from '@/components/Editor';
import AppSandbox from '@/components/Sandbox';

export default {
  name: 'Home',
  props: {
    code: {
      required: true,
      type: String,
    },
  },
  data() {
    return {
      origin: `name:lively-editor;id:${Math.random()}`,
      isSandboxLoaded: false,
      id: uniqueId(),
      activeExecId: 0,
      console,
    };
  },
  methods: {
    addPhantom(phantom) {
      phantom.isExpired = this.isPhantomExpired;
      phantom.editorId = this.id;

      this.$refs.editor.addPhantom(phantom);
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
      const activeExecId = this.increaseActiveExecId();

      this.$refs.sandbox.injectCode({
        input: this.$refs.editor.getValue(),
        execId: activeExecId,
        initiator: 'lively.js',
      });
    },
    onSandboxLoaded() {
      this.runScript();
    },
    onSandboxError({ execId, error }) {
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
          this.clearPhantoms();
        }

        const message = Error.prototype.toString.call(error);
        const location = hasLocation ? `(${loc.line}:${loc.column})` : '';

        this.$emit('error', {
          message,
          location,
          loc,
        });
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
          this.$emit('response');

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
  created() {
    this.phantoms = [];
  },
  components: {
    AppSandbox,
    AppEditor,
  },
};
</script>

<style scoped lang="scss">

</style>
