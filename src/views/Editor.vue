<template>
  <div>
    <app-modal-settings
      :isShowing="modals.settings.isShowing"
      :settings="userSettings"
      @confirm-changes="closeSettingsModal"
      @overlay-request-close="closeSettingsModal"
      @modal-request-close="closeSettingsModal"
    ></app-modal-settings>

    <app-site-header></app-site-header>

    <div>
      <div class="EditorPanel">
        <app-editor-notification-list :items="notifications"></app-editor-notification-list>
        <div class="EditorToolbar">
          <button
            :class="{ 'is-busy': isBusy }"
            :title="titles.play"
            class="EditorToolbar-button is-run"
            @click="toggleScript"
            @mouseenter="tooltips.executeCode.open = true"
            @mouseleave="tooltips.executeCode.open = false"
          >
            <span
              :class="{ 'ion-play': !isBusy, 'ion-stop': isBusy }"
              class="ion"
            ></span>
          </button>
          <button
            :title="titles.settings"
            class="EditorToolbar-button is-settings"
            @click="showSettingsModal"
          >
            <span class="ion ion-gear-a"></span>
          </button>
          <transition
            :duration="300"
            name="lol2"
            enter-class="animated fadeIn"
            leave-class="animated fadeOut"
          >
            <button
              :title="titles.walkthroughPrevious"
              v-show="$store.getters.getValidUserSetting('execution.isWalkthroughEnabled')"
              class="EditorToolbar-button is-walkthrough is-walkthrough-previous"
              @click="stepPreviousInWalkthrough()"
            >
              <span class="ion ion-chevron-left"></span>
            </button>
          </transition>
          <transition
            :duration="300"
            name="lol"
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
          >
            <button
              v-show="$store.getters.getValidUserSetting('execution.isWalkthroughEnabled')"
              :title="titles.walkthroughNext"
              class="EditorToolbar-button is-walkthrough is-walkthrough-next"
              @click="stepNextInWalkthrough()"
            >
              <span class="ion ion-chevron-right"></span>
            </button>
          </transition>
        </div>
        <app-editor-sandbox
          ref="editorSandbox"
          v-if="editor != null"
          :is-walkthrough-marker-showing="editor.isWalkthroughMarkerShowing"
          :is-walkthrough-popup-showing="editor.isWalkthroughPopupShowing"
          :editor-id="editor.id"
          :value="editor.value"
          :should-execute-on-ready="editor.shouldExecuteOnReady"
          :should-execute="editor.shouldExecute"
          :active-walkthrough-step-index="editor.activeWalkthroughStepIndex"
          style="font-size: 15px; font-family: consolas"
          @coverage="onEditorSandboxCoverageChange"
          @focus="onEditorSandboxFocus"
          @blur="onEditorSandboxBlur"
          @changes="onEditorSandboxChange"
          @runtime-error="onRuntimeError"
          @before-sandbox-inject="onBeforeEditorSandboxInject"
          @transform-error="onTransformError"
          @sandbox-busy="onSandboxBusy"
          @sandbox-free="onSandboxFree"
          @sandbox-done="onSandboxDone"
        >
        </app-editor-sandbox>
        <transition
          :duration="400"
          enter-active-class="animated fadeIn bounceIn"
          leave-active-class="animated fadeOut bounceOut"
        >
          <div
            v-show="error != null"
            class="EditorError"
          >
            <span class="EditorError-location">{{ errorLocation }}</span>
            <span class="EditorError-text">{{ errorMessage }}</span>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import * as shortcuts from '@/constants/shortcuts';

export default {
  name: 'Tutorial',

  components: {
    AppEditorSandbox: require('@/components/EditorSandbox').default,
    AppEditorNotificationList: require('@/components/EditorNotificationList').default,
    AppSiteHeader: require('@/components/SiteHeader').default,
    AppModalSettings: require('@/components/ModalSettings').default,
  },

  data() {
    return {
      content: '',

      shortcuts,
      isBusy: false,
      error: null,
      errorExecId: null,
      console,

      tooltips: {
        executeCode: {
          placement: 'left-middle',
          autoHide: false,
          open: true,
          offset: 10,
        },
      },

      modals: {
        settings: {
          isShowing: false,
        },
      },

      notificationsById: {
        webWorkerBusy: {
          title: '',
          isShowing: false,
          message: 'The web worker running your code seems to be hanging. To terminate the web worker, press the stop button. Otherwise, be careful and watch your CPU usage!',
          actions: [],
        },
      },
    };
  },

  computed: {
    ...mapState({
      editor: (state, getters) => getters['editors/editorsById']['main-tutorial'],
      // article: state => state.articles.article,
      // articlesMeta: state => state.articles.articlesMeta,
      userSettings: state => ({ ...state.settings.user }),
    }),

    ...mapGetters([
      'hasUserSetting',
      'getValidUserSetting',
      'getUserSetting',
    ]),

    titles() {
      return {
        ...this.$shortcuts.humanizeEntries({
          play: shortcuts.EDITORS_EXECUTE_CODE,
        })
      };
    },

    notifications() {
      return Object.entries(this.notificationsById)
        .map(([key, item]) => {
          item.id = key;

          return item;
        }).filter((item) => item.isShowing);
    },

    errorLocation() {
      const error = this.error;

      if (error && error.hasLocation) {
        return `(${error.loc.line}:${error.loc.column})`;
      }

      return '';
    },

    errorMessage() {
      return this.error ? this.error.message : '';
    },
  },

  created() {
    this.isCodeExecuted = true;
    this.showBusyTimeoutId = null;
  },

  beforeDestroy() {
    this.cancelBusyMessage();
  },

  methods: {
    showSettingsModal() {
      this.modals.settings.isShowing = true;
    },

    closeSettingsModal() {
      this.modals.settings.isShowing = false;
    },

    onConfirmSettings() {
      this.modals.settings.isShowing = false;
    },

    stepPreviousInWalkthrough() {
      this.$store.dispatch('editors/showWalkthroughPrevious', {
        query: {
          id: this.editor.id,
        },
      });
    },

    stepNextInWalkthrough() {
      this.$store.dispatch('editors/showWalkthroughNext', {
        query: {
          id: this.editor.id,
        },
      });
    },

    toggleNotification(name) {
      this.notificationsById[name].isShowing = !this.notificationsById[name].isShowing;
    },

    toggleScript() {
      if (this.isBusy) {
        this.restartSandbox();
      } else {
        this.$refs.editorSandbox.runScript();
      }
    },

    restartSandbox() {
      this.$refs.editorSandbox.$refs.sandbox.restart();
      this.notificationsById.webWorkerBusy.isShowing = false;
      // FIXME: Might run into problems here because if the sandbox restart is not synchronous
      this.isBusy = false;
      this.cancelBusyMessage();
    },

    showBusyMessage() {
      this.showBusyTimeoutId = setTimeout(() => {
        this.notificationsById.webWorkerBusy.isShowing = true;
        this.isBusy = true;
      }, 3000);
    },

    cancelBusyMessage() {
      clearTimeout(this.showBusyTimeoutId);
    },

    onSandboxBusy() {
      this.showBusyMessage();
    },

    onSandboxFree() {
      this.cancelBusyMessage();
      this.isBusy = false;
      this.notificationsById.webWorkerBusy.isShowing = false;
    },

    onRuntimeError(error) {
      this.error = Object.freeze(error);
      this.errorExecId = error.execId;
    },

    onTransformError(error) {
      this.$store.dispatch('editors/unmarkShouldExecute', {
        query: {
          id: this.editor.id,
        },
      });

      // The timeout avoids showing the babel code frame error every time
      // the syntax is invalid.
      this.showErrorTimeoutId = setTimeout(() => {
        this.error = Object.freeze(error);
        this.errorExecId = error.execId;
      }, 500);
    },

    onSandboxDone() {
      this.error = null;
      clearTimeout(this.showErrorTimeoutId);
    },

    onEditorSandboxCoverageChange(allCoverage) {
      this.$store.dispatch('editors/updateCoverageTotal', {
        coverageTotalLength: allCoverage.ids.length,
        query: {
          id: this.editor.id,
        },
      });
    },

    onEditorSandboxFocus() {
      this.$store.dispatch('editors/markFocused', {
        query: {
          id: this.editor.id,
        },
      });
    },

    onEditorSandboxBlur() {
      this.$store.dispatch('editors/unmarkFocused', {
        query: {
          id: this.editor.id,
        },
      });
    },

    onBeforeEditorSandboxInject() {
      this.$store.dispatch('editors/updateLastExecutedTime', {
        time: Date.now(),
        query: {
          id: this.editor.id,
        },
      });

      this.$store.dispatch('editors/unmarkShouldExecute', {
        query: {
          id: this.editor.id,
        },
      });

      this.$store.dispatch('editors/unmarkWalkthroughVisible', {
        query: {
          id: this.editor.id,
        },
      });
    },

    onEditorSandboxChange() {
      this.isCodeExecuted = false;

      this.$store.dispatch('editors/updateLastModifiedTime', {
        time: Date.now(),
        query: {
          id: this.editor.id,
        },
      });

      this.$store.dispatch('editors/setValue', {
        value: this.$refs.editorSandbox.$refs.editor.getValue(),
        query: {
          id: this.editor.id,
        },
      });
    },
  },
};

</script>

<style scoped lang="scss">

.HelpTip {
  background-color: #222222;
  border-radius: 50%;
  cursor: help;
  font-size: 12px;
  height: 18px;
  display: inline-block;
  position: relative;
  width: 18px;
}

.HelpTip-icon {
  color: white;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}





// #e8e7e0 // gray green
// #eaaa5d // orange




// $color-brand-2: hsla(120, 85%, 68%, 1); // yellow




.EditorPanel {
  height: 90vh;
  box-shadow: 0 14px 34px -3px rgba(black, 0.3);
  max-width: 800px;
  margin-bottom: 4rem;
  margin-left: auto;
  margin-right: auto;
  margin-top: 2rem;
  position: relative;
  width: 80%;
}




.EditorError {
  // border: 1px solid darken(#e6e6e6, 4);
  background-color: #f71649;
  color: white;
  bottom: 0;
  font-family: $app-code-font-family;
  font-size: 13px;
  // height: 100%;
  // overflow: hidden;
  padding-bottom: 8px;
  padding-left: 1rem;
  padding-top: 1rem;
  position: absolute;
  width: 100%;
  z-index: $app-editor-error-layer;
}

.EditorError-location {
  width: 100px;
}

.EditorError-text {
  white-space: pre;
  color: inherit,
}

.EditorError.is-errorShowing {
  background-color: #e6e6e6;
}





.Button {
  background-color: transparent;
  background-color: rgba(black, 0.1);
  border: 0;
  box-shadow: none;
  color: rgba(black, 0.7);
  cursor: pointer;
  // box-shadow: 0 2px 4px 0 rgba(black, 0.2);
  font-family: $app-button-font-family;
  border-radius: 3px;
  font-size: 12px;
  outline: 0;
  padding: 18px 28px;
  max-width: 100%;
  min-width: 260px;
  text-transform: uppercase;
  transition-duration: 300ms;
  transition-property: box-shadow;
}


</style>
