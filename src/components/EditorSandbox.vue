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

export class Popup extends EventEmitter {
  constructor(cm, options) {
    super();

    const { close=false, className='' } = options;

    const hasCloseClass = close === true ? 'has-close' : '';

    this.isDestroyed = false;
    this.cm = cm;
    this.name = options.name;
    this.$$el = document.createElement('div');
    this.$$el.className = `EditorPopup ${className} ${hasCloseClass}`;
    this.$$el.innerHTML =
      `
      <div class="EditorPopup-header"></div>
      <div class="EditorPopup-content"></div>
      <button class="EditorPopup-close" style="display: ${close ? 'block' : 'none'}">
        <span>&times;</span>
      </button>
      `;

    this.onPopupClose = this.onPopupClose.bind(this);
    this.onMouseenter = this.onMouseenter.bind(this);
    this.onMouseleave = this.onMouseleave.bind(this);

    this.tokens = {
      show: [],
      hide: [],
    };

    this.$$header = this.$$el.querySelector('.EditorPopup-header');
    this.$$content = this.$$el.querySelector('.EditorPopup-content');
    this.close = this.$$el.querySelector('.EditorPopup-close');
    this.close.addEventListener('click', this.onPopupClose);

    this.$$el.addEventListener('mouseenter', this.onMouseenter);
    this.$$el.addEventListener('mouseleave', this.onMouseleave);
  }

  onMouseenter(e) {
    this.emit('mouseenter', e);
  }

  onMouseleave(e) {
    this.emit('mouseleave', e);
  }

  onPopupClose() {
    this.hide();
  }

  show({
    delay,
    loc,
    content='',
    header='',
    scrollIntoView=true,
  }={}) {
    const token = {};

    token.promise =
      new Promise((resolve) => {
        token.id = setTimeout(() => {
          this.$$content.textContent = content;
          this.$$header.textContent = header.trim();

          if (header.trim() === '') {
            this.$$header.style.display = 'none';
          } else {
            this.$$header.style.display = 'block';
          }

          this.cm.addWidget({
            line: loc.line,
            ch: loc.column,
          }, this.$$el);

          // console.log(loc)

          this.cm.scrollIntoView({
            line: loc.line,
            ch: loc.column + 50,
          }, 200);

          this.$$el.style.opacity = 1;
          this.cancelShow(token);

          resolve();
        }, delay);
      });

    this.tokens.show.push(token);

    return token;
  }

  hide({ delay=0 }={}) {
    const token = {};

    token.promise =
      new Promise((resolve) => {
        token.id = setTimeout(() => {
          if (this.$$el.parentNode) {
            this.$$el.parentNode.removeChild(this.$$el);
            this.$$el.style.opacity = 0;
          }

          this.cancelHide(token);

          resolve();
        }, delay);
      });

    this.tokens.hide.push(token);

    return token;
  }

  cancelHide(token) {
    clearTimeout(token.id);

    this.tokens.hide = this.tokens.hide.filter(t => t != token);
  }

  cancelShow(token) {
    clearTimeout(token.id);

    this.tokens.show = this.tokens.show.filter(t => t != token);
  }

  cancelAllHide() {
    this.tokens.hide =
      this.tokens.hide.filter(t => {
        clearTimeout(t.id);

        return false;
      });
  }

  cancelAllShow() {
    this.tokens.show =
      this.tokens.show.filter(t => {
        clearTimeout(t.id);

        return false;
      });
  }

  destroy() {
    this.hide().then(() => {
      this.$$el = null;
      this.cm = null;

      this.tokens = {
        show: [],
        hide: [],
      };

      this.close.removeEventListener('click', this.onPopupClose);
      this.removeAllListeners('mouseenter');
      this.removeAllListeners('mouseleave');
    });
  }
}

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

    this.popups = {
      walkthrough: new Popup(this.cm, {
        name: 'WalkthroughPopup',
      }),
      expressionHover: new Popup(this.cm, {
        name: 'ExpressionHover',
      }),
      phantomHover: new Popup(this.cm, {
        name: 'PhantomHover',
      }),
    };

    this.popups.phantomHover.on('mouseenter', this.onPhantomPopupEnter);
    this.popups.phantomHover.on('mouseleave', this.onPhantomPopupLeave);

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
      ['ctrl+n', this.keyWalkthroughNext],
      ['ctrl+p', this.keyWalkthroughPrevious],
    ]);

    Array.from(this.keymap)
      .forEach(([key, handler]) => {
        Keyboard.bind(key, handler);
      });

    this.beautify = (val) => val;
  },

  beforeDestroyed() {
    Array.from(this.keymap)
      .forEach(([key, handler]) => Keyboard.off(key, handler));

    this.cm.off('changes', this.onEditorChanges)
    this.cm.off('change', this.onEditorChange);
    this.cm = null;
    this.hideAllPopups();

    Object.values(this.popups).forEach(popup => popup.destroy());

    this.popups = {};

    window.removeEventListener('click', this.onWindowClick);
  },

  methods: {
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
        content: this.beautify(content),
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
          // console.log('isInsertionPastChangedLine');
          // const remainder = this.insertions.items.slice(index);

          const viewport = this.cm.getViewport();
          // const line = Math.floor((viewport.to - viewport.from) / 2) - 1;
          const line = viewport.from;

          // console.log('ismeme', viewport.from)

          this.popups.walkthrough.show({
            header: `This point can not be highlighted because it has been modified`,
            content: this.coverage.values[index],
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
          const ch = ((loc[0].line === loc[1].line) ? loc[0].ch: loc[1].ch - 1);

          this.activeWalkthroughInsertionId = insertion.id;

          this.popups.walkthrough.show({
            content: this.beautify(this.coverage.values[index]),
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
            title: 'a title ma dewdy',
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
          content: phantom.content.map(value => this.beautify(value)).toString(),
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
