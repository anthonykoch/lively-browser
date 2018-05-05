<template>
  <div>
    <app-modal-settings
      :isShowing="modals.settings.isShowing"
      :settings="userSettings"
      @confirm-changes="closeSettingsModal"
      @overlay-request-close="closeSettingsModal"
      @modal-request-close="closeSettingsModal"
    ></app-modal-settings>

    <div
      v-if="section"
      style="display: flex;"
    >
      <div style="width: 60%;">
        <div>
          <article class="Article">
            <div class="Article-header">
              <span>Marinara</span>
            </div>
            <h2 class="Article-title">{{ article.meta.title }}<span class="Article-meta"> memes</span></h2>
            <div
              class="Article-body markdown markdown--styled"
              v-html="section.content"
            ></div>
          </article>
        </div>
      </div>
      <div style="width: 40%;">
        <div class="EditorPanel">
          <app-editor-notification-list :items="notifications"></app-editor-notification-list>
          <div class="EditorToolbar">
            <button
              :class="{ 'is-busy': isBusy }"
              class="EditorToolbar-button is-run"
              @click="toggleScript"
            >
              <span
                :class="{ 'ion-play': !isBusy, 'ion-stop': isBusy }"
                class="ion"
              ></span>
            </button>
            <button
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
                class="EditorToolbar-button is-walkthrough is-walkthrough-next"
                @click="stepNextInWalkthrough()"
              >
                <span class="ion ion-chevron-right"></span>
              </button>
            </transition>
          </div>
          <app-editor-sandbox
            ref="editor"
            :code="code"
            :active-walkthrough-step="activeWalkthroughStep"
            style="font-size: 15px; font-family: consolas"
            @busy="onSandboxBusy"
            @free="onSandboxFree"
            @runtime-error="onRuntimeError"
            @transform-error="onTransformError"
            @done="onSandboxDone"
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
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import {
  LOAD_ARTICLE_REQUEST,
} from '@/store/constants';

export default {
  name: 'Tutorial',

  components: {
    AppEditorSandbox: require('@/components/EditorSandbox').default,
    AppEditorNotificationList: require('@/components/EditorNotificationList').default,
    // AppModal: require('@/components/Modal').default,
    // AppOverlay: require('@/components/Overlay').default,
    // AppSettings: require('@/components/Settings').default,
    AppModalSettings: require('@/components/ModalSettings').default,
  },

  data() {
    return {
      tooltips: {
        helpSettingsExecutionMode: {
          content: 'Manual mode only executes code with ctrl+enter. Automatic will execute code ever n ms after typing',
          classes: ['is-medium-size'],
          autoHide: false,
          // open: true,
          offset: 10,
          // show: true,
        },
      },
      modals: {
        settings: {
          isShowing: false,
        },
      },

      activeWalkthroughStep: 0,
      isBusy: false,
      error: null,
      errorExecId: null,

      notificationsById: {
        webWorkerBusy: {
          title: '',
          isShowing: false,
          message: 'The web worker running your code seems to be hanging. To terminate the web worker, press the stop button. Otherwise, be careful and watch your CPU usage!',
          actions: [],
        },

        // loljk: {
        //   title: '',
        //   isShowing: false,
        //   message: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet adipisci accusantium incidunt obcaecati cum repellendus, distinctio, illo, voluptas qui unde dicta. Tempore ipsa hic omnis quibusdam labore magnam dignissimos sit!',
        //   actions: [],
        // },
      },

      console,
    };
  },

  computed: {
    ...mapState({
      code: state => state.editor.code,
      article: state => state.articles.article,
      articlesMeta: state => state.articles.articlesMeta,
      userSettings: state => ({ ...state.settings.user }),
    }),

    ...mapGetters({
      section: 'activeArticleSection',
    }),

    ...mapGetters([
      'hasUserSetting',
      'getValidUserSetting',
      'getUserSetting',
    ]),

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
    this.showBusyTimeoutId = null;
  },

  beforeDestroy() {
    this.cancelBusyMessage();
  },

  beforeRouteEnter(to, from, next) {
    next(async (vm) => {
      const slug = to.params.slug;

      await vm.$store.dispatch(LOAD_ARTICLE_REQUEST, slug);
    });
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
      this.$refs.editor.stepPreviousInWalkthrough();
    },

    stepNextInWalkthrough() {
      this.$refs.editor.stepNextInWalkthrough();
    },

    toggleNotification(name) {
      this.notificationsById[name].isShowing = !this.notificationsById[name].isShowing;
    },

    toggleScript() {
      if (this.isBusy) {
        this.restartSandbox();
      } else {
        this.$refs.editor.runScript();
      }
    },

    restartSandbox() {
      this.$refs.editor.$refs.sandbox.restart();
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
      // The timeout avoids showing a gigantic babel code frame error every time
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

    closeModal(name) {
      this.modals[name].isShowing = false;
    },

    onSettingSaveClick() {
      this.saveSettings();
      this.closeModal('settings');
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





.Article {
  height: 100vh;
  overflow: scroll;
}

.Article-header {
  background-color: #f29100;
  color: white;
  font-size: 40px;
  font-family: Oswald;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding-left: 4rem;
  font-size: 13px;
  padding-bottom: 40px;
  padding-top: 40px;

  > span {
    background-color: #f29100;
    padding: 2px 0px;
    position: relative;
    z-index: 1;

    &:before {
      content: '';
      position: absolute;
      border-radius: 50%;
      border: 2px solid white;
      left: 0;
      top: 50%;
      transform: translate(-50%, -50%);
      height: 30px;
      width: 30px;
      z-index: -1;
    }

  }
}

.Article-title {
  letter-spacing: 1px;
  letter-spacing: 0.25px;
  font-size: 40px;
  font-family: Oswald;
  font-weight: 300;
  letter-spacing: 1px;
  padding-left: $app-article-padding;
  padding-right: $app-article-padding;
  padding-bottom: 1.5rem;
  margin-top: 4rem;
}

.Article-meta {
  color: #9bc2d8;
  font-size: 12px;
}




.EditorPanel {
  position: relative;
  height: 100vh;
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
