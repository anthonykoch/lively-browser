<template>
  <div>
    <!-- {{ this.coverage.ids }} -->
    <app-sandbox
      ref="sandbox"
      :origin="origin"
      url="/sandbox.html"
      @busy="onSandboxBusy"
      @free="onSandboxFree"
      @replies="onSandboxReply"
      @done="onSandboxDone"
      @runtime-error="onSandboxRuntimeError"
    ></app-sandbox>
    <app-editor
      ref="editor"
      :code="code"
      :phantoms="phantoms"
      :insertions="insertions"
      style="font-size: 14px"
      @mouseenter-phantom="onPhantomMouseenter"
      @mouseleave-phantom="onPhantomMouseleave"
    >
    </app-editor>
  </div>
</template>

<script>
import { EventEmitter } from 'events';

import _ from 'lodash';
import Vue from 'vue';
import cuid from 'cuid';
import Keyboard from 'keyboardjs';

import logger from '@/logger';

const TIMEOUT_PHANTOM_HOVER_SHOW = 400;
const TIMEOUT_PHANTOM_HOVER_HIDE = 700;

// type CoveredInsertionPoint = {
//   ids: number[],
//   values: string[],
// };

// type Phantom = {
//   content: string[],
//   line: number,
//   column: number,
//   execId: number,
//   editorId: number,
//   className: string,
// };

/**
 * @param  {{ content: string, loc: CodeMirrorLocation }} options
 */

export const Popup = Vue.extend({
  template:
  `
    <div
      class="EditorPopup"
      :class="{ 'has-close': isCloseable }"
      @mouseenter="onMouseEnter"
      @mouseleave="onMouseLeave"
    >
      <div class="EditorPopup-content">
        <template v-for="(section, index) in content">
          <span
            v-if="section.content"
            :class="getSectionClass(section.type)"
            class="EditorPopup-contentSection"
          >{{ section.content }}</span>
          <span
            v-if="section.partials"
            class="EditorPopup-partial"
          >
            <span
              v-for="partial of section.partials"
              :class="getSectionClass(partial.type)"
              class="EditorPopup-contentSection is-partial"
            >{{ partial.content }}</span>
          </span>
          <span v-if="index != content.length - 1" class="EditorPopup-separator"></span>
        </template>
      </div>
      <button
        class="EditorPopup-close"
        v-show="isCloseable"
        @click="onPopupClose"
      >
        <span>&times;</span>
      </button>
    </div>
  `,

  props: {
    isCloseable: {
      type: Boolean,
      default: () => false,
    },
    cm: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      content: [],
      isDestroyed: false,
    };
  },

  mounted() {
    console.log(this)
  },

  created() {
    this.tokens = [];
  },

  beforeDestroy() {
    this.cancelAllHide();
    this.cancelAllShow();
  },

  methods: {
    onMouseEnter(e) {
      this.$emit('popup-mouse-enter', e);
    },

    onMouseLeave(e) {
      this.$emit('popup-mouse-leave', e);
    },

    onPopupClose() {
      this.hide();
    },

    getSectionClass(type) {
      return {
        'is-info': type === 'info',
        'is-code': type === 'code',
      };
    },

    getPartialClass(type) {
      return '';
    },

    show({
      content=[],
      delay,
      loc,
      scrollIntoView=true,
      wrap=false,
    }={}) {
      const token = {
        type: 'show',
      };

      token.promise =
        new Promise((resolve) => {
          token.id = cuid();
          token.timeout = setTimeout(() => {
            this.cm.addWidget({
              line: loc.line,
              ch: loc.column,
            }, this.$el);

            this.content = content;

            this.cm.scrollIntoView({
              line: loc.line,
              ch: loc.column + 50,
            }, 200);

            this.removeToken([token]);

            resolve();
          }, delay);
        });

      this.addToken([token]);

      return token;
    },

    hide({ delay=0 }={}) {
      const token = {
        type: 'hide',
      };

      token.promise =
        new Promise((resolve) => {
          token.id = cuid();
          token.timeout = setTimeout(() => {
            if (this.$el.parentNode) {
              this.$el.parentNode.removeChild(this.$el);
            }

            this.cancelHide([token]);

            resolve();
          }, delay);
        });

      this.addToken([token]);

      return token;
    },

    addToken(tokens) {
      this.tokens = this.tokens.concat(tokens);
    },

    removeToken(tokens) {
      this.tokens =
        this.tokens.filter((token) => tokens.some(t => t.id === token.id));
    },

    cancelHide(tokens) {
      tokens.forEach(token => clearTimeout(token.timeout));

      this.removeToken(tokens);
    },

    cancelShow(tokens) {
      tokens.forEach(token => clearTimeout(token.timeout));

      this.removeToken(tokens);
    },

    cancelAllHide() {
      this.cancelHide(this.tokens.filter(token => token.type === 'hide'));
    },

    cancelAllShow() {
      this.cancelShow(this.tokens.filter(token => token.type === 'show'));
    },

    destroy() {
      return this.hide().then(() => {
        this.cm = null;
      });
    },
  },
});

/**
 * @param  {Location} loc
 * @return {CodeMirrorLocation}
 */
export const toCodemirrorLoc = (loc) => ([
  {
    line: loc.start.line - 1,
    ch: loc.start.column,
  },
  {
    line: loc.end.line - 1,
    ch: loc.end.column,
  },
]);

/**
 * EditorSandbox acts as an orchestrator for the editor and sandbox.
 */
export default {
  name: 'EditorSandbox',

  components: {
    AppEditor: require('@/components/Editor').default,
    AppSandbox: require('@/components/Sandbox').default,
  },

  props: {
    code: {
      required: true,
      type: String,
    },

    execOnReady: {
      type: Boolean,
      default: true,
    },
  },

  data() {
    return {
      insertions: {
        items: Object.freeze([]),
      },
      coverage: Object.freeze({
        ids: [],
        values: [],
      }),
      activeWalkthroughStep: -1,
      phantoms: Object.freeze([]),
      origin: cuid(),
      id: cuid(),
      activeExecId: 0,
      filename: '/lively.js',
      dirname: '/',
      logger,
    };
  },

  computed: {
    isWalkthroughEnabled() {
      return this.$store.getters.getUserSettingOrDefault('execution.walkthrough')[0];
    },
  },

  async mounted() {
    this.cm = this.$refs.editor.cm;
    this.cm.on('change', this.onEditorChange);
    this.cm.on('changes', this.onEditorChanges);
    this.cm.on('cursorActivity', this.onCursorActivity);

    window.addEventListener('click', this.onWindowClick);

    this.createPopups();

    if (this.execOnReady) {
      this.$once('ready', () => {
        this.runScript();
      });
    }
  },

  created() {
    const sleep = (delay) => new Promise(resolve => setTimeout(resolve, delay));

    this.imports = Promise.all([
      import('scuffka-javascript/dist/transform'),
      import('scuffka-javascript/dist/instrument'),
    ]).then(([{ default: transform }, instrument]) => {
      this.instrument = instrument;
      this.transform = transform;
      this.$emit('ready');
    });

    this.delayedImports = Promise.all([
      sleep(3000).then(() => import('js-beautify')),
    ]).then(([jsbeautifier]) => {
      const { js_beautify: beautify } = jsbeautifier;

      this.beautify = (value, max=35) => {
        if (max == null || max === Infinity || value.length > max) {
          return beautify(value, { indent_size: 2 });
        }

        return value;
      };
    });

    this.lastChangedLine = null;
    this.timeouts = {};
    this.phantoms = [];
    this.transform = null;
    this.maxWalkthroughStep = 0;
    this.activeWalkthroughInsertionId = null;
    this.keymap = new Map([
      ['esc', this.resetWalkthrough],
      ['ctrl+shift+0', this.showFirstWalkthroughStep],
      ['ctrl+enter', this.runScript],
      ['command+alt+enter', this.runScript],
      ['ctrl+n', this.keyWalkthroughNext],
      ['command+shift+period', this.keyWalkthroughNext],
      ['ctrl+p', this.keyWalkthroughPrevious],
      ['command+shift+,', this.keyWalkthroughPrevious],
    ]);

    Array.from(this.keymap)
      .forEach(([key, handler]) => {
        Keyboard.bind(key, handler);
      });

    this.beautify = (val) => val;
  },

  beforeDestroy() {
    Array.from(this.keymap)
      .forEach(([key, handler]) => Keyboard.off(key, handler));

    this.cm.off('changes', this.onEditorChanges)
    this.cm.off('change', this.onEditorChange);
    this.cm = null;

    this.destroyPopups();

    window.removeEventListener('click', this.onWindowClick);
  },

  methods: {
    destroyPopups() {
      Object.values(this.popups).forEach(popup => {
        popup.$destroy();
      });

      this.popups = {};
    },

    createPopups() {
      this.popups = {
        walkthrough: new Popup({
          propsData: {
            cm: this.cm,
          },
        }),
        expressionHover: new Popup({
          propsData: {
            cm: this.cm,
          },
        }),
        phantomHover: new Popup({
          propsData: {
            cm: this.cm,
          },
        }),
      };

      this.popups.phantomHover.$on('popup-mouse-enter', this.onPhantomPopupEnter);
      this.popups.phantomHover.$on('popup-mouse-leave', this.onPhantomPopupLeave);

      Object.values(this.popups)
        .forEach(popup => {
          popup.$mount();
        });
    },

    keyWalkthroughNext(e) {
      e.preventDefault();
      this.stepNextInWalkthrough();
    },

    keyWalkthroughPrevious(e) {
      e.preventDefault();
      this.stepPreviousInWalkthrough();
    },

    onCursorActivity() {
      // TODO: Check to see if cursor is still in the same range?
      // this.clearTimeout
      return;
      const cursor = this.cm.getCursor();
      const content = this.findExpressionAt({ line: cursor.line, column: cursor.ch });

      this.popups.expressionHover.show({
        delay: 200,
        loc: {
          line: cursor.line,
          column: cursor.ch,
        },
        content: [{
          type: 'code',
          content: this.beautify(content),
        }],
      });
    },

    stepPreviousInWalkthrough() {
      const step = Math.max(0, this.activeWalkthroughStep - 1);
      // const step = Math.min(Math.max(0, this.activeWalkthroughStep - 1), this.maxWalkthroughStep);

      this.activeWalkthroughStep = step;
      this.showWalkthroughStep(step);
      // console.log({ step })
    },

    stepNextInWalkthrough() {
      const items = this.coverage.ids;

      if (items.length > 0) {
        const step = Math.min(items.length - 1, this.activeWalkthroughStep + 1);
        // const step = Math.min(items.length - 1, this.activeWalkthroughStep + 1, this.maxWalkthroughStep);

        // console.log({step})
        this.activeWalkthroughStep = step;
        this.showWalkthroughStep(step);
      }
    },

    showFirstWalkthroughStep() {
      this.showWalkthroughStep(0);
    },

    showWalkthroughStep(index) {
      if (
          index > -1 &&
          Number.isFinite(index) &&
          this.coverage.ids.hasOwnProperty(index)
        ) {
        // const insertion = this.getInsertionByIndex(index);
        const insertionId = this.coverage.ids[index];
        const items = this.insertions.items;

        let insertion = null;
        let before = null;

        // console.log(this.coverage.ids);

        for (let i = 0; i < items.length; i++) {
          if (items[i].id === insertionId) {
            insertion = items[i];

            if (this.lastChangedLine != null && insertion.node.loc.end.line >= this.lastChangedLine + 1) {
              break;
            }

            break;
          }
        }

        if (this.walkthroughMarker) {
          this.walkthroughMarker.clear();
        }

        if (insertion != null) {
          if (insertion.context === 'CallExpression') {
            // TODO: Maybe highlight call expressions as they're being run, but this would
            //       require modifications to instrumentation.
          }
        }

        const isInsertionPastChangedLine =
          this.lastChangedLine != null && insertion.node.loc.end.line >= this.lastChangedLine + 1;

        // console.log({id: insertion.id, line: insertion.node.loc.end.line, changed: this.lastChangedLine, isInsertionPastChangedLine});
        // console.log('before', before, this.coverage.ids);

        if (isInsertionPastChangedLine) {
          const loc = insertion.node.loc;
          const viewport = this.cm.getViewport();
          const line = viewport.from;

          this.popups.walkthrough.show({
            content: [{
                content: `This point can not be highlighted because it has been modified`,
                type: 'info',
              }, {
                partials: [{
                  content: `${loc.start.line}:${loc.start.column}`,
                }, {
                  type: 'code',
                  content: this.beautify(this.coverage.values[index]),
                }],
              },
            ],
            loc: {
              line,
              // If the loc spans multiple lines, display the popup at ending column
              // else display it at the start of the starting column
              column: 0,
            },
          });
        } else if (insertion) {
          const loc = toCodemirrorLoc(insertion.node.loc);
          const walkthroughHighlightClass = 'WalkthoughtStep';
          const ch = ((loc[0].line === loc[1].line) ? loc[0].ch : loc[1].ch - 1);

          this.activeWalkthroughInsertionId = insertion.id;

          this.popups.walkthrough.show({
            content: [{
              type: 'code',
              content: this.beautify(this.coverage.values[index])
            }],
            loc: {
              line: loc[1].line,
              // If the loc spans multiple lines, display the popup at ending column
              // else display it at the start of the starting column
              column: ch,
            },
          });

          // console.log(loc[0].line === loc[1].line, loc[1].ch, loc[0].ch, ch)

          this.walkthroughMarker = this.cm.doc.markText(loc[0], loc[1], {
            className: walkthroughHighlightClass,
          });
        }
      }
    },

    resetWalkthrough() {
      this.activeWalkthroughStep = -1;
      this.activeWalkthroughInsertionId = null;

      this.popups.walkthrough.hide();

      if (this.walkthroughMarker) {
        this.walkthroughMarker.clear();
      }
    },

    setCoverage(coverage, execId) {
      this.coverage = Object.freeze(coverage);

      coverage.ids
        .forEach((id, index) => {
          const insertion = this.insertions.items[id];;

          if (this.shouldCreatePhantom(insertion)) {
            const loc = insertion.node.loc;

            this.addPhantoms([{
              insertion,
              execId,
              content: [coverage.values[index]],
              line: loc.end.line,
            }]);
          }
        });
    },

    renderInitialCoverage(insertions) {
      this.insertions = Object.freeze({
        items: Object.freeze(insertions.items.slice(0)),
      });

      this.$refs.editor.renderInitialCoverage(insertions, this.activeExecId);
    },

    eraseOutdatedPhantoms() {
      this.phantoms =
        Object.freeze(
            this.phantoms.filter(p => p.execId >= this.activeExecId)
          );
    },

    addPhantoms(phantoms) {
      const newPhantoms = this.phantoms
        .filter(p => {
          const gtfo =
            phantoms.some(phantom =>
                (p.execId < phantom.execId && p.line > phantom.line) ||
                (p.execId === phantom.execId)
              );

          return gtfo;
        })
        .concat(phantoms.map(phantom => {
          return {
            insertion: phantom.insertion,
            execId: phantom.execId,
            content: phantom.content,
            line: phantom.line,
            column: phantom.column,
            className: phantom.className,
            editorId: this.id,
          };
        }));

      this.phantoms = Object.freeze(newPhantoms);
    },

    clearPhantoms() {
      this.phantoms = Object.freeze([]);
    },

    increaseActiveExecId() {
      return this.activeExecId += 1;
    },

    shouldCreatePhantom(insertion) {
      return (
          insertion.type === 'Identifier' && insertion.context === 'ExpressionStatement'
        );
    },

    async runScript() {
      this.resetWalkthrough();
      this.lastChangedLine = null;

      if (this.transform == null) {
        return;
      }

      const activeExecId = this.increaseActiveExecId();
      const { filename, dirname } = this;

      const [isWalkthroughEnabled] =
        this.$store.getters.getUserSettingOrDefault('execution.walkthrough');

      const data = await this.transform(this.$refs.editor.getValue(), {
        filename,
        instrumentor: isWalkthroughEnabled ? 'thorough' : 'minimal',
      });

      const error = data.error;

      console.log(data.code);

      // if (data.badLoops?.length) {
      //   return this.$emit('potential-freeze', data.badLoops);
      // }

      if (error) {
        this.$emit('transform-error', { ...error, execId: activeExecId });

        const match = error.message.match(/^(.*?):\s*.*?:\s*(.*?)\s*\(/);

        if (error.loc) {
          this.addPhantoms([{
            execId: activeExecId,
            // Todo: Extract the error message from the stack trace
            content: [match ? match[2] : 'SyntaxError'],
            line: error.loc.line,
            column: error.loc.column,
            className: 'is-error',
            // layout: 'inline',
          }]);
        }

        return;
      }

      this.maxWalkthroughStep = data.insertions.length - 1,

      this.renderInitialCoverage({
        execId: this.activeExecId,
        items: data.insertions,
      });

      this.$refs.sandbox.injectCode({
        input: data.code,
        execId: activeExecId,
        dirname,
        filename,
        sourcemap: data.map,
      });
    },

    clearPhantomsBelow(line) {
      this.phantoms =
        Object.freeze(
            this.phantoms.filter(p => p.line <= line)
          );
    },

    onPhantomPopupEnter() {
      this.popups.phantomHover.cancelAllHide();
    },

    onPhantomPopupLeave() {
      this.popups.phantomHover.hide({ delay: TIMEOUT_PHANTOM_HOVER_HIDE });
    },

    onWindowClick(e) {
      if (e.target.closest('.Phantom')) {
        const loc = this.cm.coordsChar({
          left: e.pageX,
          top: e.pageY,
        }, 'window');

        this.timeouts.resetCursor = setTimeout(() => {
          this.cm.focus();
          this.cm.setCursor({ line: loc.line, ch: loc.ch });
        }, 50);
      }
    },

    onEditorChange() {
      clearTimeout(this.timeouts.resetCursor);
    },

    onEditorChangeDelayed: _.debounce(function onEditorChange() {
      // this.runScript();
    }, 200, {
      trailing: true,
    }),

    onEditorChanges(cm, changes) {
      const line = changes.reduce((line, change) => {
        return (line === null || change.from.line < line) ? change.from.line : line;
        // return line;
      }, null);


      if (line != null) {
        this.lastChangedLine = line + 1;
        this.$refs.editor.clearBelow(line)
        this.clearPhantomsBelow(line + 1);

        const items = this.insertions.items;

        for (let i = 0; i < items.length; i++) {
          const insertion = items[i];

          if (insertion.node.loc.end.line >= this.lastChangedLine) {
            console.log('maxStep', i, this.coverage.ids[i], this.coverage.ids)
            this.maxWalkthroughStep = i;
            break;
          }
        }

        // this.resetWalkthrough();
      }
    },

    onPhantomMouseenter(e, phantom) {
      const loc = this.cm.coordsChar({
        left: e.pageX,
        top: e.pageY,
      }, 'window');

      // console.log(this.activeWalkthroughInsertionId, phantom.insertion.id)

      // NOTE: Don't show popups for lines that already have a walkthrough popup
      if (this.activeWalkthroughInsertionId !== phantom.insertion.id) {
        this.popups.phantomHover.cancelAllHide();

        this.popups.phantomHover.show({
          delay: TIMEOUT_PHANTOM_HOVER_SHOW,
          loc: {
            line: phantom.line - 1,
            column: phantom.column,
          },
          content: [{
            type: 'code',
            content: phantom.content.map(value => this.beautify(value)).toString(),
          }],
        });
      }
    },

    onPhantomMouseleave(e, phantom) {
      this.popups.phantomHover.cancelAllShow();
      this.popups.phantomHover.hide({ delay: TIMEOUT_PHANTOM_HOVER_HIDE });
    },

    onSandboxRuntimeError(payload) {
      const { execId, result: { error } } = payload;
      const loc = error.loc;
      const hasLocation = loc && Number.isFinite(loc.line) && Number.isFinite(loc.column);

      if (execId >= this.activeExecId) {
        if (hasLocation) {
          this.addPhantoms([{
            execId,
            content: [error.message],
            line: loc.line,
            column: loc.column,
            className: 'is-error',
          }]);
        }

        const message = error.message.trim();

        this.$emit('runtime-error', {
          message,
          location,
          loc,
          hasLocation,
          execId,
        });
      }
    },

    onSandboxBusy(time) {
      this.$emit('busy', time);
    },

    onSandboxFree() {
      this.$emit('free');
    },

    onSandboxReply(replies) {
      // console.log('Received', replies);

      replies.forEach((payload) => {
        const execId = payload.execId;

        // console.log('Reply:', payload.execId, this.activeExecId)

        // Don't render any phantoms for replies incoming from previously executed scripts
        if (execId >= this.activeExecId) {

          // Avoid rendering phantoms for things that are redundant, link strings, numbers
          if (payload.coverage) {
            this.setCoverage(payload.coverage, execId);
          }

          if (payload.hasOwnProperty('insertionId')) {
            const insertion = this.insertions.items[payload.insertionId];
            const locStart = insertion.node.loc.start;

            this.$refs.editor.renderCovered(locStart, execId);
          }
        }
      });
    },

    onSandboxDone(payload) {
      this.eraseOutdatedPhantoms();
      this.$refs.editor.updatePhantoms(true);
      this.$emit('done', payload);
    },
  },
};
</script>

<style scoped lang="scss">

</style>
