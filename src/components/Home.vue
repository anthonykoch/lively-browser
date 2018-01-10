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
            <app-editor-header-item>
              <div class={styles.buttonList}>
                <button
                  class={`button ${styles.buttonSettings}`}
                  onClick={this.onButtonClick}
                  key="settings"
                ></button>
              </div>
            </app-editor-header-item>
          </app-editor-header>


          <div style="flex: 1;">
            <app-editor></app-editor>
            <app-sandbox url="/sandbox.html"></app-sandbox>

            <!-- <editor
              setNewCode="{this.setNewCode}"
              value="{this.props.editorValue}"
              onPhantomsRendered="{this.props.markPhantomsClean}"
              shouldRenderPhantoms="{this.props.shouldRenderPhantoms}"
              phantoms="{this.props.phantoms}"
              onChange="{this.onChange}"
              headerButtons="{this.state.buttons}"
            >

            </editor> -->

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppEditor from '@/components/Editor';
import AppSandbox from '@/components/Sandbox';
import AppEditorHeader from '@/components/EditorHeader';
import AppEditorHeaderItem from '@/components/EditorHeaderItem';

export default {
  name: 'Home',
  data() {
    return {
      sandboxUrl: '',
      msg: 'Welcome to Your Vue.js App',
    };
  },
  components: {
    AppSandbox,
    AppEditorHeader,
    AppEditorHeaderItem,
    AppEditor,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
$header-height: 40px;

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

.buttonSettings {
  /*background-image: url('/assets/images/icon.navicon.svg');*/
  background-repeat: no-repeat;
  background-position: center;
  background-size: 30px;
  display: inline-block;
  padding: 20px;
}

</style>
