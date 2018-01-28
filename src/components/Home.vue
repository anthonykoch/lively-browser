<template>
  <div>
    <div style="display: flex;">
      <div style="width: 50%;">
        <div>
          <div>
            <button
              class="button button--default"
              onClick="navigatPreviousSlide"
            >
              Previous
            </button>
            <button
              class="button button--default"
              onClick="navigateNextSlide"
            >
              Next
            </button>
          </div>
          <div class="markdown">
            <vue-markdown :source="activeSlide.markdown"></vue-markdown>
            <!-- <ReactMarkdown source={activeSlide.markdown} /> -->
          </div>
        </div>
      </div>
      <div style="width: 50%;">
        <div class="EditorPanel">

          <app-editor-header>
            <app-editor-header-item :flex="1">
              <div class="EditorError">
                <span class="EditorError-text">{{ errorMessage }}</span>
                <span class="EditorError-location">{{ errorLocation }}</span>
              </div>
            </app-editor-header-item>
            <app-editor-header-item>
              <div class="buttonList">
                <button class="button button--settings"></button>
              </div>
            </app-editor-header-item>
          </app-editor-header>

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
              :code="activeSlide.code"
              :phantoms="phantoms"
              @change="onEditorChange">
            </app-editor>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import debounce from 'lodash/debounce';
import VueMarkdown from 'vue-markdown';

import AppEditor from '@/components/Editor';
import AppSandbox from '@/components/Sandbox';
import AppEditorHeader from '@/components/EditorHeader';
import AppEditorHeaderItem from '@/components/EditorHeaderItem';

import {
  EDITOR_INCREMENT_EXEC_ID,
  EDITOR_CLEAR_PHANTOMS,
  EDITOR_ADD_PHANTOM,
} from '@/store/constants';

export default {
  name: 'Home',
  data() {
    return {
      console,
      origin: `name:lively-editor;id:${Math.random()}`,
      errorMessage: '',
      errorLocation: '',
    };
  },
  computed: mapState({
    activeExecId: state => state.editor.activeExecId,
    code: state => state.editor.value,
    hasDirtyPhantoms: state => state.editor.hasDirtyPhantoms,
    phantoms: state => state.editor.phantoms,
    isSandboxLoaded: state => state.editor.isSandboxLoaded,
    activeSlide: state => state.codeSlideshow.activeSlide,
  }),
  methods: {
    onEditorChange: debounce(function () {
      this.onSandboxLoaded();
    }, 200, {
      trailing: true,
    }),
    runScript() {
      this.$store.dispatch({
        type: EDITOR_INCREMENT_EXEC_ID,
      });

      this.$refs.sandbox.injectCode({
        input: this.$refs.editor.getValue(),
        execId: this.activeExecId,
        initiator: 'lively.js',
      });
    },
    onSandboxLoaded() {
      this.runScript();
    },
    onSandboxError({ execId, error }) {
      this.errorMessage = '';

      // console.log(execId, this.activeExecId);
      if (execId >= this.activeExecId) {
        if (error.loc && Number.isFinite(error.loc.line)) {
          this.$store.dispatch(EDITOR_ADD_PHANTOM, {
            execId,
            content: `\u{1f608} ${error.message}`,
            line: error.loc.line,
            left: error.loc.column,
            className: 'Phantom--is-error',
          });
        } else {
          this.$store.dispatch(EDITOR_CLEAR_PHANTOMS);
        }

        this.errorMessage = Error.prototype.toString.call(error);
        this.errorLocation = `(${error.loc.line}:${error.loc.column})`;
      }
    },
    onSandboxResponse(response) {
      // console.log('Response:', response);

      const result = response.payload;

      // Don't render any phantoms for things still going on in previous scripts
      // console.log(result.execId, this.activeExecId)
      if (result.execId >= this.activeExecId) {
        const execId = result.execId;

        if ((!response.done) && result.expression) {
          const expr = result.expression;

          this.$store.dispatch(EDITOR_ADD_PHANTOM, {
            execId,
            content: expr.value,
            line: expr.loc.end.line,
            left: expr.loc.end.column,
          });
        }
      }
    },
  },
  components: {
    VueMarkdown,
    AppSandbox,
    AppEditorHeader,
    AppEditorHeaderItem,
    AppEditor,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.EditorPanel {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  font-family: consolas;
  font-size: 15px;
  height: 100vh;
}




.EditorError {
  // border: 1px solid darken(#e6e6e6, 4);
  font-family: inherit;
  font-size: 13px;
  height: 100%;
  overflow: hidden;
  padding-bottom: 8px;
  padding-left: 8px;
  padding-top: 8px;
  position: relative;
  z-index: 2;
}

.EditorError-text {
  color: inherit,
}

.EditorError.is-errorShowing {
  background-color: #e6e6e6;
}




.buttonList {
  display: flex;
  // align-items: center;
  flex-wrap: nowrap;
  // padding-left: 12px;
  // padding-right: 12px;
}

.button {
  background-color: transparent;
  background-color: rgba(black, 0.1);
  border: 0;
  box-shadow: none;
  color: rgba(black, 0.7);
  cursor: pointer;
  // box-shadow: 0 2px 4px 0 rgba(black, 0.2);
  font-family: Helvetica Neue, Segoe UI, arial;
  font-size: 14px;
  outline: 0;
  padding: 6px 16px;
  transition-duration: 300ms;
  transition-property: box-shadow;

  &:hover {
    box-shadow: inset 0 0.25rem 1rem rgba(0, 0, 0, 0.16);
  }
}

.button--settings {
  background-image: url('../assets/images/icon.navicon.svg');
  background-repeat: no-repeat;
  background-position: center;
  background-size: 30px;
  display: inline-block;
  padding: 20px;
}

</style>
