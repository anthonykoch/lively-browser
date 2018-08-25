<template>
  <div>
    <app-modal-settings
      :is-showing="modals.settings.isShowing"
      :settings="userSettings"
      @confirm-changes="closeSettingsModal"
      @overlay-request-close="closeSettingsModal"
      @modal-request-close="closeSettingsModal"
    ></app-modal-settings>

    <app-site-header></app-site-header>

    <div>
      <div class="EditorPanel">
        <app-notification-list :items="editorNotifications"></app-notification-list>

        <div class="EditorToolbar">
          <app-popper
            :options="{
              placement: 'left',
              positionFixed: true,
            }"
            :transition="{ name: 'tr-Notification' }"
          >
            <!-- FIXME: I can not for the life of me figure out why Popper doesn't position correctly. Hacking it with inline styling -->
            <app-notification
              v-show="tutorialNotifications.intro1.isShowing"
              :key="1"
              size="small"
              style="position: relative; left: -15px; top: 8px"
            >
              {{ tutorialNotifications.intro1.message }}
            </app-notification>
            <app-notification
              v-show="tutorialNotifications.intro2.isShowing"
              :key="2"
              :actions="[{ id: 1, text: 'ok' }]"
              :message="tutorialNotifications.intro2.message"
              size="small"
              style="position: relative; left: -15px; top: 44px"
              @action="onIntroductionTutorialStep2Accept"
            >
            </app-notification>

            <button
              slot="reference"
              :class="{ 'is-busy': isBusy }"
              :title="titles.play"
              class="EditorToolbar-button is-run"
              @click="onPlay"
            >
              <span
                :class="{ 'ion-play': !isBusy, 'ion-stop': isBusy }"
                class="ion"
              ></span>
            </button>
          </app-popper>
          <button
            :title="titles.settings"
            class="EditorToolbar-button is-settings"
            @click="showSettingsModal"
          >
            <span class="ion ion-gear-a"></span>
          </button>

          <transition
            :duration="300"
            enter-class="animated fadeIn"
            leave-class="animated fadeOut"
          >
            <button
              v-show="$store.getters.getValidUserSetting('execution.isWalkthroughEnabled')"
              :title="titles.walkthroughPrevious"
              class="EditorToolbar-button is-walkthrough is-walkthrough-previous"
              @click="stepPreviousInWalkthrough()"
            >
              <span class="ion ion-chevron-left"></span>
            </button>
          </transition>

          <transition
            :duration="300"
            enter-active-class="animated fadeIn"
            leave-active-class="animated fadeOut"
          >
            <div
              v-show="$store.getters.getValidUserSetting('execution.isWalkthroughEnabled')"
            >
              <app-popper
                :options="{
                  placement: 'left',
                  positionFixed: true,
                }"
                :transition="{ name: 'tr-Notification' }"
              >
                <!--
                  FIXME: I can not for the life of me figure out why Popper doesn't position correctly.
                  Hacking it with inline styling
                 -->
                <app-notification
                  v-show="tutorialNotifications.intro3.isShowing"
                  :key="1"
                  :actions="[{ id: 1, text: 'ok' }]"
                  :message="tutorialNotifications.intro3.message"
                  size="small"
                  style="position: relative; left: -15px; top: 22px"
                  @action="onIntroductionTutorialStep3Accept"
                >
                </app-notification>
                <button
                  slot="reference"
                  :title="titles.walkthroughNext"
                  class="EditorToolbar-button is-walkthrough is-walkthrough-next"
                  @click="stepNextInWalkthrough"
                >
                  <span class="ion ion-chevron-right"></span>
                </button>
              </app-popper>
            </div>
          </transition>
        </div>

        <app-editor-sandbox
          v-if="editor != null"
          ref="editorSandbox"
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
import * as NOTIFICATIONS from '@/constants/notifications';
import * as TUTORIALS from '@/constants/tutorials';
import * as EDITORS from '@/constants/editors';

import { wait } from '@/utils';

export default {
  name: 'Tutorial',

  components: {
    AppEditorSandbox: require('@/components/EditorSandbox').default,
    AppNotificationList: require('@/components/NotificationList').default,
    AppNotification: require('@/components/Notification').default,
    AppSiteHeader: require('@/components/SiteHeader').default,
    AppModalSettings: require('@/components/ModalSettings').default,
    AppPopper: require('@/components/Popper').default,
  },

  data() {
    return {
      content: '',

      shortcuts,
      isBusy: false,
      error: null,
      errorExecId: null,
      console,

      modals: {
        settings: {
          isShowing: false,
        },
      },
    };
  },

  computed: {
    ...mapState({
      editor: (state, getters) => getters['editors/editorsById'][EDITORS.ID_MAIN],
      userSettings: state => ({ ...state.settings.user }),
      tutorial: state => state.tutorial,
      editorNotifications: (state, getters) => getters['notifications/getEditorNotifications'],
      tutorialNotifications: (state, getters) => ({
        intro1: getters['notifications/getById'](NOTIFICATIONS.INTRODUCTION_1),
        intro2: getters['notifications/getById'](NOTIFICATIONS.INTRODUCTION_2),
        intro3: getters['notifications/getById'](NOTIFICATIONS.INTRODUCTION_3),
      }),
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

  mounted() {
    this.introTutorialTimeout = setTimeout(() => {
      this.$store.dispatch('tutorials/begin', {
        id: TUTORIALS.INTRODUCTION,
      });
    }, 2000);
  },

  created() {
    this.isCodeExecuted = true;
    this.showBusyTimeoutId = null;
  },

  beforeDestroy() {
    this.cancelBusyMessage();
  },

  methods: {
    onPlay() {
      clearTimeout(this.introTutorialTimeout);
      this.toggleScript();

      this.$store.dispatch('tutorials/finish', {
        id: TUTORIALS.INTRODUCTION,
        index: 0,
      });

      wait(1200).then(() => {
        this.$store.dispatch('tutorials/start', {
          id: TUTORIALS.INTRODUCTION,
          index: 1,
        });
      });
    },

    onIntroductionTutorialStep2Accept() {
      this.$store.dispatch('tutorials/finish', {
        id: TUTORIALS.INTRODUCTION,
        index: 1,
      })
      .then(() => wait(1200))
      .then(() => {
        this.$store.dispatch('tutorials/start', {
          id: TUTORIALS.INTRODUCTION,
          index: 2,
        });
      });
    },

    onIntroductionTutorialStep3Accept() {
      wait(200).then(() => {
        console.log('meme');

        this.$store.dispatch('tutorials/finish', {
          id: TUTORIALS.INTRODUCTION,
          index: 2,
        });
      });
    },

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

    toggleScript() {
      if (this.isBusy) {
        this.restartSandbox();
      } else {
        this.$refs.editorSandbox.runScript();
      }
    },

    restartSandbox() {
      this.$refs.editorSandbox.$refs.sandbox.restart();
      this.$store.dispatch('notifications/show', NOTIFICATIONS.WEB_WORKER_BUSY);
      // FIXME: Might run into problems here because if the sandbox restart is not synchronous
      this.isBusy = false;
      this.cancelBusyMessage();
    },

    showBusyMessage() {
      this.showBusyTimeoutId = setTimeout(() => {
        this.$store.dispatch('notifications/show', NOTIFICATIONS.WEB_WORKER_BUSY);
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
      this.$store.dispatch(
        'notifications/hide',
        NOTIFICATIONS.WEB_WORKER_BUSY,
      );
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

      this.$store.dispatch('editors/unmarkWalkthroughPopupVisible', {
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
  background-color: #f71649;
  color: white;
  bottom: 0;
  font-family: $app-code-font-family;
  font-size: 13px;
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
