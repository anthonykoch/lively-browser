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
            <div class="Article-header">Marinara</div>

            <h2 class="Article-title">{{ article.meta.title }}<span class="Article-meta">memes</span></h2>
            <div class="Article-body markdown markdown--styled" v-html="section.content"></div>
          </article>
        </div>
      </div>
      <div style="width: 40%;">
        <div class="EditorPanel">
            <app-editor-sandbox
              :code="'name;\n\n'"
              @runtime-error="onRuntimeError"
              @transform-error="onTransformError"
              @done="onSandboxDone"
            >
            </app-editor-sandbox>

            <transition
              name="lols"
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
      console,
      error: null,
      errorExecId: null,
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
      code: state => state.editor.value,
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

    onRuntimeError(error) {
      this.error = Object.freeze(error);
      this.errorExecId = error.execId;
      console.log('Error:', error);
    },

    onTransformError(error) {
      this.error = Object.freeze(error);
      this.errorExecId = error.execId;
      console.log('Error:', error);
    },

    onSandboxDone(payload) {
      this.error = null;
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


.Article {
  height: 100vh;
  overflow: scroll;
}

.Article-header {
  background-color: #352d30;
  color: #f29100;
  font-size: 40px;
  font-family: Comfortaa;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding-left: 4rem;
  font-size: 13px;
  padding-bottom: 40px;
  padding-top: 40px;
}

.Article-title {
  letter-spacing: 1px;
  letter-spacing: 0.25px;
  font-size: 40px;
  font-weight: 500;
  padding-left: $app-article-padding;
  padding-right: $app-article-padding;
  padding-bottom: 1.5rem;
  margin-top: 4rem;
  font-family: Comfortaa;
}

.Article-meta {
  color: #9bc2d8;
  font-size: 12px;
}




.EditorPanel {
  font-family: consolas;
  font-size: 15px;
  position: relatice;
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
