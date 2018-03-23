<template>
  <div>
    <div style="display: flex;" v-if="section">
      <div style="width: 60%;">
        <div>
          <!-- <div>
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
          </div> -->
          <article class="Article">
            <div class="Article-header" @click="isShowingBusyMessage = !isShowingBusyMessage">
              <span>Marinara</span>
            </div>

            <h2 class="Article-title">{{ article.meta.title }}<span class="Article-meta">memes</span></h2>
            <div class="Article-body markdown markdown--styled" v-html="section.content"></div>
          </article>
        </div>
      </div>
      <div style="width: 40%;">
        <div class="EditorPanel">
          <ul class="EditorNotificationList">
            <transition
              enter-active-class="animated fadeIn a-EditorNotificationSlideIn"
              leave-active-class="animated fadeOut a-EditorNotificationSlideOut"
              :duration="400"
            >
              <li class="EditorNotificationList-item" v-show="isShowingBusyMessage">
                <div role="alert" class="EditorNotification">
                  <div class="EditorNotification-body">
                    <button class="EditorNotification-close">&times;</button>
                    <p class="EditorNotification-message">
                        The web worker running your code seems to be hanging. If you'd like to terminate the web worker, press terminate below. Otherwise, be careful, and watch your CPU usage!
                    </p>
                    <!-- <div class="EditorNotification-actions">
                      <button
                        class="EditorNotification-actionItem"
                        @click="restartSandbox"
                      >
                        Kill Script
                      </button>
                    </div> -->
                  </div>
                </div>
              </li>
            </transition>
          </ul>
          <div class="EditorToolbar">
            <button class="EditorToolbar-run" :class="{ 'is-busy': isBusy }" @click="toggleScript">
              <span class="ion" :class="{ 'ion-play': !isBusy, 'ion-stop': isBusy }"></span>
            </button>
          </div>
          <app-editor-sandbox
            ref="editor"
            :code="code"
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
            <div class="EditorError" v-show="error != null">
              <span class="EditorError-location">{{ errorLocation }}</span>
              <span class="EditorError-text">{{ errorMessage }}</span>
            </div>
          </transition>

          <!-- <app-editor-header>
            <app-editor-header-item :flex="1">

            </app-editor-header-item>
            <app-editor-header-item>
              <div class="buttonList">
                <button class="button button--settings"></button>
              </div>
            </app-editor-header-item>
          </app-editor-header> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';

import AppEditorSandbox from '@/components/EditorSandbox';
import AppEditorHeader from '@/components/EditorHeader';
import AppEditorHeaderItem from '@/components/EditorHeaderItem';

import {
  LOAD_ARTICLE_REQUEST,
} from '@/store/constants';

export default {

  name: 'Tutorial',

  data() {
    return {
      isBusy: false,
      error: null,
      errorExecId: null,
      isShowingBusyMessage: false,
      console,
    };
  },

  beforeRouteEnter(to, from, next) {
    next(async (vm) => {
      const slug = to.params.slug;

      await vm.$store.dispatch(LOAD_ARTICLE_REQUEST, slug);
    });
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

  methods: {

    toggleScript() {
      if (this.isBusy) {
        this.restartSandbox();
      } else {
        this.$refs.editor.runScript();
      }
    },

    restartSandbox() {
      this.$refs.editor.$refs.sandbox.restart();
      this.isShowingBusyMessage = false;
      // FIXME: Might run into problems here because if the sandbox restart is not synchronous
      this.isBusy = false;
      this.cancelBusyMessage();
    },

    showBusyMessage() {
      this.showBusyTimeoutId = setTimeout(() => {
        this.isShowingBusyMessage = true;
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
      this.isShowingBusyMessage = false;
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

    onSandboxDone(payload) {
      this.error = null;

      clearTimeout(this.showErrorTimeoutId);
    },

    beforeDestroy() {
      this.cancelBusyMessage();
    },

    created() {
      this.showBusyTimeoutId = null;
    },

  },

  components: {
    AppEditorHeader,
    AppEditorHeaderItem,
    AppEditorSandbox,
  },

};
</script>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

// hsla(197, 88%, 58%, 1) // a nice blue

@keyframes a-EditorNotificationSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-50px) scale(0.7);
  }

  100% {
    opacity: 1;
    transform: translateX(0px) scale(1);
  }
}

@keyframes a-EditorNotificationSlideOut {
  0% {
    opacity: 1;
    transform: translateX(0px) scale(1);
  }

  100% {
    transform: translateX(-50px) scale(0.4s);
    opacity: 0;
  }
}

.a-EditorNotificationSlideIn {
  animation: a-EditorNotificationSlideIn 350ms forwards;
}

.a-EditorNotificationSlideOut {
  animation: a-EditorNotificationSlideOut 350ms forwards;
}

.EditorNotificationList {
  bottom: 1rem;
  left: 0;
  list-style-type: none;
  position: absolute;
  width: 100%;
  z-index: 99999;
}

.EditorNotification {
  background-color: #3e3e36;
  background-color: #2b292b;
  background-color: #eae9ea;
  // background-color: #383830;
  // background-color: #333333;
  border-radius: 4px;
  box-shadow: 0 2px 4px 0 rgba(black, 0.1), 0 12px 35px -2px rgba(0, 0, 0, 0.26);
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
  padding-top: 1rem;
  position: relative;
  top: 1rem;
  width: 400px;

  &:before {
    border-bottom: 11px solid transparent;
    border-left: 8px solid #eae9ea;
    border-top: 11px solid transparent;
    content: '';
    position: absolute;
    top: 1rem;
    right: 0;
    transform: translate(100%, 0);
  }
}

.EditorNotification-body {
  position: relative;
}

.EditorNotification-close {
  @include button;
  display: none;
  color: #2b292b;
  font-size: 24px;
  position: absolute;
  padding: 6px 8px;
  right: 0;
  top: 0;
}

.EditorNotification-message {
  color: rgba(black, 0.6);
  font-size: 12px;
  line-height: 1.8;
  padding-left: 1rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;
}

// - Orange #f29100
// - Seafoam #9bc2d8

.EditorNotification-actions {
  background-color: rgba(white, 0.06);
  padding: 0.5rem 1rem 1rem;
  text-align: right;
}

.EditorNotification-actionItem {
  background-color: #ef276d;
  background-color: #e8b92c;
  background-color: transparent;
  // background-color: #f29100;
  // box-shadow: 0 2px 4px 0 rgba(black, 0.15);
  // border: 1px solid transparent;
  border: 1px solid rgba(black, 0.6);
  border-radius: 3px;
  font-family: inherit;
  // color: white;
  color: rgba(black, 0.82);
  cursor: pointer;
  font-size: 12px;
  line-height: 1.5;
  outline: 0;
  padding: 6px 20px;
  transition-duration: 250ms;
  transition-property: background-color, color, box-shadow;
  user-select: none;

  &:hover {
    background-color: rgba(black, 0.82);
    color: white;
    // box-shadow: 0 7px 10px 0 rgba(black, 0.2);
  }
}

.EditorToolbar {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 9999;
}

.EditorToolbar-run {
  @include button;
  // background-color: #f5256f;
  background-color: #d8cc6d;
  border-radius: 3px;
  box-shadow: 0 8px 22px -3px rgba(black, 0.5);
  color: white;
  // border-left: 1px solid rgba(black, 0.1);
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 10px 18px;
  text-shadow: 0 1px 1px rgba(0,0,0,0.2);

  &.is-busy {
    background-color: #e84c3d;
  }

  > span {
    filter: drop-shadow(3px 3px 6px rgba(black, 0.2));
    font-size: 15px;
  }
}

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
  font-family: consolas;
  font-size: 15px;
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
