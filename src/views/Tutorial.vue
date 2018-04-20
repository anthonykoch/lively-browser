<template>
  <div>
    <!-- :duration="{ enter: 300, leave: 300 }" -->
    <!-- :duration="200"
      enter-active-class="overlay-fadeIn"
      leave-active-class="overlay-fadeOut" -->
    <transition
    >
      <app-overlay
        v-show="isSettingsModalShowing"
        :allow-close="true"
        @request-close="isSettingsModalShowing = false"
      >
        <app-modal
          id="settings"
          @close="isSettingsModalShowing = !isSettingsModalShowing"
        >
          <div class="Settings">
            <header class="Settings-header">
              <h1 class="Settings-title">Settings</h1>
            </header>

            <div class="Settings-container">
              <div class="Settings-content">
                <div class="Settings-group">
                  <label
                    for="editors_settings_mode"
                    class="Settings-label"
                  >
                    Mode:
                  </label>
                  <select
                    id="editors-settings-mode"
                    v-model="editorSettingsMode"
                    name="editors_settings_mode"
                    class="Settings-select"
                  >
                    <option value="manual">Manual (via keybinding)</option>
                    <option
                      value="automatic"
                      disabled
                    >
                      Automatic (as you type)
                    </option>
                  </select>
                </div>
                <div class="Settings-group">
                  <label
                    for="execution"
                    class="Settings-label"
                  >
                    Execution:
                  </label>
                  <select
                    id="execution"
                    name="execution"
                    class="Settings-select"
                  >
                    <option value="minimal">Normal (faster)</option>
                    <option value="thorough">Walkthrough (slower)</option>
                  </select>
                  <p class="Settings-description">
                    Normal execution will execute the code, give coverage feedback, and will render values for identifier expressions. Walkthrough will do all of that, but also allows a walkthrough of how the expressions resolved.
                  </p>
                </div>
              </div>
            </div>
            <div class="Settings-actionList">
              <button class="Settings-save">Save</button>
            </div>
          </div>
        </app-modal>
      </app-overlay>
    </transition>
    <div
      v-if="section"
      style="display: flex;"
    >
      <div style="width: 60%;">
        <div>
          <article class="Article">
            <div
              class="Article-header"
              @click="toggleNotification('webWorkerBusy')"
            >
              <span>Marinara</span>
            </div>

            <h2 class="Article-title">{{ article.meta.title }}<span class="Article-meta">memes</span></h2>
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
              class="EditorToolbar-button EditorToolbar-button--run"
              @click="toggleScript"
            >
              <span
                :class="{ 'ion-play': !isBusy, 'ion-stop': isBusy }"
                class="ion"
              ></span>
            </button>
            <button
              class="EditorToolbar-button EditorToolbar-button--settings"
              @click="isSettingsModalShowing = true"
            >
              <span class="ion ion-gear-a"></span>
            </button>
          </div>
          <app-editor-sandbox
            ref="editor"
            :code="code"
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
    AppModal: require('@/components/modal').default,
    AppOverlay: require('@/components/overlay').default,
  },

  data() {
    return {
      isSettingsModalShowing: false,
      isBusy: false,
      error: null,
      errorExecId: null,
      editorSettingsMode: 'manual',
      notificationsById: {
        webWorkerBusy: {
          title: '',
          isShowing: false,
          message: 'The web worker running your code seems to be hanging. To terminate the web worker, press the stop button. Otherwise, be careful and watch your CPU usage!',
          actions: [],
        },

        loljk: {
          title: '',
          isShowing: false,
          message: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Amet adipisci accusantium incidunt obcaecati cum repellendus, distinctio, illo, voluptas qui unde dicta. Tempore ipsa hic omnis quibusdam labore magnam dignissimos sit!',
          actions: [],
        },
      },
      console,
    };
  },

  computed: {

    ...mapState({
      code: state => state.editor.code,
      article: state => state.articles.article,
      articlesMeta: state => state.articles.articlesMeta,
    }),

    ...mapGetters({
      section: 'activeArticleSection',
    }),

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

  },

};
</script>

<style scoped lang="scss">

$app-editor-settings-border-radius: 4px;
$app-editor-settings-background-color: $color-gray;

.Settings-header {
  background-color: $app-editor-settings-background-color;
  border-radius: $app-editor-settings-border-radius $app-editor-settings-border-radius 0 0;
}

.Settings-title {
  border-bottom: 1px solid rgba(black, 0.1);
  font-size: 32px;
  line-height: 1.1;
  font-weight: 200;
  letter-spacing: 3px;
  margin: 0;
  padding-bottom: 1rem;
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 1rem;
}

.Settings-container {
  overflow: hidden;
  background-color: white;
}

.Settings-content {
  // box-shadow: 3px 6px 20px 0px rgba(0,0,0,0.2);
  max-height: 500px;
  overflow: auto;
  position: relative;
  margin-bottom: 32px;
  padding-left: 2rem;
  padding-right: 2rem;
  margin-top: 32px;
  z-index: 1;

  > :last-child {
    margin-bottom: 0;
  }
}

.Settings-group {
  margin-bottom: 24px;
}

.Settings-select {
  font-size: 14px;
}

.Settings-label {
  font-size: 12px;
  font-weight: 600;
  // display: block;
  margin-bottom: 6px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.Settings-description {
  font-size: 13px;
  line-height: 1.8;
  margin-top: 10px;
}

.Settings-actionList {
  // display: flex;
}

// .Settings-actionList > :first-child {
//   border-right: 1px solid rgba(black, 0.06);
//   border-bottom-left-radius: 4px;
// }

// .Settings-actionList > :last-child {
//   border-bottom-right-radius: 4px;
//   background-color: #eaaa5d;
// }

// .Settings-discard {
//   background-color: transparent;
//   border: 0;
//   font-size: 14px;
//   cursor: pointer;
//   margin-bottom: 1rem;
//   margin-right: 1rem;
// }

.Settings-save {
  background: #d6c96b;
  // background-color: #5abef9;
  // background-color: $color-gray;
  border: 0;
  border-top: 1px solid rgba(black, 0.1);
  border-radius: 0 0 $app-editor-settings-border-radius $app-editor-settings-border-radius;
  cursor: pointer;
  color: white;
  display: block;
  font-family: Montserrat;
  font-size: 15px;
  font-weight: 400;
  outline: 0;
  padding: 1rem 0;
  text-align: center;
  user-select: none;
  // width: 50%;
  width: 100%;

  &:link,
  &:visited,
  &:hover,
  &:active {
    color: white;
  }
}

// #e8e7e0 // gray green
// #eaaa5d // orange


.EditorToolbar {
  position: fixed;
  display: flex;
  flex-direction: column;
  top: 16px;
  right: 16px;
  z-index: 9999;
}

.EditorToolbar-button {
  @include button;
  border-radius: 3px;
  box-shadow: 0 8px 22px -3px rgba(black, 0.5);
  color: white;
  font-size: 10px;
  height: 40px;
  padding: 0;
  margin-bottom: 0.5rem;
  position: relative;
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);
  width: 44px;

  > span {
    filter: drop-shadow(3px 3px 6px rgba(black, 0.2));
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}

.EditorToolbar-button--run {
  background-color: #d8cc6d;

  &.is-busy {
    background-color: $color-error;
    // hsla(11, 100%, 64%, 1);
  }

  > span {
    font-size: 15px;
  }
}

.EditorToolbar-button--settings {
  background-color: $color-info;

  > span {
    font-size: 20px;
  }
}





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
  z-index: 10;
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
