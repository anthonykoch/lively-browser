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
        <div class="editorPanel">

          <app-editor-header>
            <app-editor-header-item :flex="1">
              <div class="EditorError">
                <span class="EditorError-text">{{errorMessage}}</span>
              </div>
            </app-editor-header-item>
            <!-- <app-editor-header-item>
              <div class="buttonList">
                <button class="button styles.button--settings"></button>
              </div>
            </app-editor-header-item> -->
          </app-editor-header>

          <div style="flex: 1;">
            <app-sandbox
              ref="sandbox"
              :origin="origin"
              url="/sandbox.html"
              @response="onSandboxResponse"
              @load="runScript"
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
      this.runScript();
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
    onSandboxResponse(response) {
      // console.log('Response:', response);
      // console.log('Response:', JSON.stringify(response, null, 2));

      const result = response.payload;

      this.errorMessage = '';
      // console.log('Ids:', result.execId >= this.props.activeExecId, result.execId, this.props.activeExecId);

      // Don't render any phantoms for things still going on in previous scripts
      // console.log(result.execId, this.activeExecId)
      if (result.execId >= this.activeExecId) {
        const err = result.error;
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

        if (err) {
          if (err.loc && Number.isFinite(err.loc.line)) {
            this.$store.dispatch(EDITOR_ADD_PHANTOM, {
              execId: execId,
              // value: `${err.message}`,
              content: `\u{1f608} ${err.message}`,
              line: err.loc.line,
              left: err.loc.column,
              // className: classnames(stylesShared.phantom, stylesShared.phantomIsError),
            });
          } else {
            this.$store.dispatch(EDITOR_CLEAR_PHANTOMS);
          }

          this.errorMessage = err && err.message ? err.message : '';
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

.editorPanel {
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
  /*background-image: url('/assets/images/icon.navicon.svg');*/
  background-repeat: no-repeat;
  background-position: center;
  background-size: 30px;
  display: inline-block;
  padding: 20px;
}

</style>
