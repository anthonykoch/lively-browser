<template>
  <div>
    <!-- {{ this.coverage.ids }} -->
    <app-sandbox
      ref="sandbox"
      :origin="origin"
      url="/sandbox.html"
      @busy="onSandboxBusy"
      @free="onSandboxFree"
      @replies="onSandboxResponse"
      @done="onSandboxDone"
      @runtime-error="onSandboxRuntimeError"
    ></app-sandbox>
    <app-editor
      ref="editor"
      :value="value"
      :phantoms="phantoms"
      :insertions="insertions"
      :show-ellipses="true"
      style="font-size: 14px"
      @phantom-group-mouseenter="onPhantomGroupMouseEnter"
      @phantom-group-mouseleave="onPhantomGroupMouseLeave"
    >
    </app-editor>
  </div>
</template>

<script>

import Vue from 'vue';
import _ from 'lodash';
import cuid from 'cuid';

import { PopupType } from '@/constants';
import logger from '@/logger';

const TIMEOUT_PHANTOM_HOVER_SHOW = 300;
const TIMEOUT_PHANTOM_HOVER_HIDE = 200;

const WALKTHROUGH_HIGHLIGHT_CLASS = 'WalkthoughtStep';

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

export const Popup = Vue.extend(require('@/components/EditorPopup').default);

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
 *
 * Cases:
 *   - Don't show popups for lines that already have a walkthrough popup
 *   - Don't show markers if the line has been modified past its insertion's end line
 *   - Don't show popups if the line has been modified past its insertion's end line
 *   - Only beautify if the line is longer than 40 or so characters
 *
 * Emits:
 *   sandbox-busy: When the sandbox is at 100% cpu utilization and can't respond
 *   sandbox-free: When the sandbox is no longer busy
 *   sandbox-response: When the sandbox sends a response
 *   sandbox-done: When the sandbox is done synchronously executing a script
 *   ready: Fired when the editor has loaded all its important dependencies
 *          and is ready to execute code.
 *   transform-error: Fires if the code has a syntax error
 *   runtime-error: Executed when there is a synchronous runtime error
 *   before-sandbox-inject: Emits before the sandbox is sent code to execute
 */
export default {
  name: 'EditorSandbox',

  components: {
    AppEditor: require('@/components/Editor').default,
    AppSandbox: require('@/components/Sandbox').default,
  },

  props: {
    editorId: {
      type: String,
      required: true,
    },

    value: {
      required: true,
      type: String,
    },

    shouldExecute: {
      type: Boolean,
      required: true,
    },

    shouldExecuteOnReady: {
      type: Boolean,
      default: () => false,
    },

    activeWalkthroughStepIndex: {
      type: Number,
      default: () => -1,
    },

    isWalkthroughMarkerShowing: {
      type: Boolean,
      required: true,
    },

    isWalkthroughPopupShowing: {
      type: Boolean,
      required: true,
    },
  },

  data(vm) {
    return {
      insertions: {
        items: Object.freeze([]),
      },
      coverage: Object.freeze({
        ids: [],
        values: [],
      }),
      local_activeWalkthroughStepIndex: vm.$props.activeWalkthroughStepIndex,
      phantoms: Object.freeze([]),
      origin: cuid(),
      activeExecId: 0,
      filename: '/lively.js',
      dirname: '/',
      logger,
    };
  },

  watch: {
    shouldExecute(should) {
      if (should === true) {
        this.runScript();
      }
    },

    activeWalkthroughStepIndex(newIndex, oldIndex) {
      this.renderWalkthroughStep(newIndex);
    },

    isWalkthroughMarkerShowing(isShowing) {
      this.renderWalkthroughStep(this.activeWalkthroughStepIndex);
    },

    isWalkthroughPopupShowing(isShowing) {
      this.renderWalkthroughStep(this.activeWalkthroughStepIndex);
    },
  },

  async mounted() {
    this.cm = this.$refs.editor.cm;
    this.cm.on('change', this.onEditorChange);
    this.cm.on('changes', this.onEditorChanges);
    this.cm.on('cursorActivity', this.onCursorActivity);
    this.cm.on('focus', this.onEditorFocus);
    this.cm.on('blur', this.onEditorBlur);

    window.addEventListener('click', this.onWindowClick);

    this.popups = this.createPopups();

    if (this.shouldExecuteOnReady) {
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
    this.activeExecution = null;
    this.timeouts = {};
    this.phantoms = [];
    this.transform = null;
    this.maxWalkthroughStep = 0;
    this.activeWalkthroughInsertionId = null;
    this.renders = {};

    this.beautify = (val) => val;
  },

  beforeDestroy() {
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
      const popups = {
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

      popups.phantomHover.$on('popup-mouse-enter', this.onPhantomPopupEnter);
      popups.phantomHover.$on('popup-mouse-leave', this.onPhantomPopupLeave);

      Object.values(popups)
        .forEach(popup => {
          popup.$mount();
        });

      return popups;
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
          type: PopupType.Code,
          content: this.beautify(content),
        }],
      });
    },

    canShowWalkthroughStepIndex(index) {
      return (
          this.activeExecution?.instrumentor === 'thorough' &&
          index > -1 &&
          Number.isFinite(index) &&
          this.coverage.ids.hasOwnProperty(index)
        );
    },

    isInsertionPastChangedLine(insertion) {
      return this.lastChangedLine != null && insertion.node.loc.end.line >= this.lastChangedLine + 1;
    },

    getInsertionDataFromIndex(index, shouldStopAtChangedLine=true) {
      const insertionId = this.coverage.ids[index];
      const items = this.insertions.items;

      let insertion = null;
      let i = 0;

      for (; i < items.length; i++) {
        if (items[i].id === insertionId) {
          insertion = items[i];

          if (
            shouldStopAtChangedLine &&
            this.lastChangedLine != null &&
            insertion.node.loc.end.line >= this.lastChangedLine + 1
          ) {
            break;
          }

          break;
        }
      }

      return {
        fromIndex: index,
        insertion,
        foundIndex: insertion == null ? null : i,
      };
    },

    /**
     * @param  {Object|null} insertion
     */
    showWalkthroughPopup(insertion) {
      const index = this.activeWalkthroughStepIndex;

      if (this.isInsertionPastChangedLine(insertion)) {
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
                type: PopupType.Code,
                content: this.beautify(this.coverage.values[index]),
              }],
            },
          ],
          loc: {
            line,
            column: 0,
          },
        });
      } else {
        const loc = toCodemirrorLoc(insertion.node.loc);
        const ch = ((loc[0].line === loc[1].line) ? loc[0].ch : loc[1].ch - 1);

        this.activeWalkthroughInsertionId = insertion.id;

        if (this.isWalkthroughPopupShowing) {
          this.popups.walkthrough.show({
            content: [{
              type: PopupType.Code,
              content: this.beautify(this.coverage.values[index])
            }],
            loc: {
              line: loc[1].line,
              // If the loc spans multiple lines, display the popup at ending column
              // else display it at the start of the starting column
              column: ch,
            },
          });
        }
      }
    },

    showWalkthroughMarker(insertion) {
      const loc = toCodemirrorLoc(insertion.node.loc);

      this.hideWalkthroughMarker();

      if (this.isInsertionPastChangedLine(insertion)) {
        return;
      }

      this.walkthroughMarker = this.cm.doc.markText(loc[0], loc[1], {
        className: WALKTHROUGH_HIGHLIGHT_CLASS,
      });
    },

    renderWalkthroughStep() {
      const index = this.activeWalkthroughStepIndex;
      const canShow = this.canShowWalkthroughStepIndex(index);

      if (!canShow) {
        return null;
      }

      const { insertion } = this.getInsertionDataFromIndex(index);

      if (insertion == null) {
        return null;
      }

      if (this.isWalkthroughMarkerShowing) {
        this.showWalkthroughMarker(insertion);
      } else {
        this.hideWalkthroughMarker();
      }

      if (this.isWalkthroughPopupShowing) {
        this.showWalkthroughPopup(insertion);
      } else {
        this.hideWalkthroughPopup();
      }

      // TODO: Maybe highlight call expressions as they're being run. This could
      //       potentially be done by checking if the previous insertion is a call
      //       expression and adding it to a stack, or it would require modifications
      //       to the instrumentation.

      return insertion;
    },

    hideWalkthrough() {
      this.activeWalkthroughInsertionId = null;
      this.popups.walkthrough.hide();

      if (this.walkthroughMarker) {
        this.walkthroughMarker.clear();
      }
    },

    hideWalkthroughPopup() {
      this.popups.walkthrough.cancelAllShow();
      this.popups.walkthrough.hide();
    },

    hideWalkthroughMarker() {
      if (this.walkthroughMarker) {
        this.walkthroughMarker.clear();
      }
    },

    addCoverage(coverage, execId) {
      const oldCoverage = this.coverage;

      this.coverage = Object.freeze({
        ids: this.coverage.ids.concat(coverage.ids),
        values: this.coverage.values.concat(coverage.values),
      });

      this.$emit('coverage', this.coverage, coverage, oldCoverage);

      coverage.ids
        .forEach((id, index) => {
          const insertion = this.insertions.items[id];

          if (this.shouldCreatePhantom(insertion)) {
            const loc = insertion.node.loc;

            this.addPhantoms([{
              insertion,
              execId,
              content: [coverage.values[index]],
              line: loc.end.line,
              meta: {
                popupType: PopupType.Code,
              },
            }]);
          }
        });
    },

    resetCoverage() {
      this.coverage = Object.freeze({
        ids: [],
        values: [],
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
            editorId: this.editorId,
            meta: {
              ...phantom.meta,
            },
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
          (insertion.type === 'Identifier' || insertion.type === 'ThisExpression') &&
          insertion.context === 'ExpressionStatement'
        );
    },

    async runScript() {
      this.lastChangedLine = null;

      if (this.transform == null) {
        return;
      }

      const { filename, dirname } = this;
      const activeExecId = this.increaseActiveExecId();
      const input = this.$refs.editor.getValue();

      const instrumentor =
        this.$store.getters.getValidUserSetting('execution.isWalkthroughEnabled')
          ? 'thorough'
          : 'minimal';

      const data = await this.transform(input, {
        filename,
        instrumentor,
      });

      const error = data.error;

      console.log(data.code);

      // TODO: Detect potential freezes from loops
      // if (badLoops.length) {
      //   return this.$emit('potential-freeze', data.badLoops);
      // }
      this.activeExecution = {
        id: activeExecId,
        instrumentor,
        input,
        compilation: data,
      };

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
            meta: {
              popupType: PopupType.Info,
              isError: true,
            },
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

      this.$emit('before-sandbox-inject');
      this.resetCoverage();

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
        if (line == null || change.from.line < line) {
          return change.from.line;
        }

        return line;
      }, line);

      if (line != null) {
        this.lastChangedLine = line + 1;
        this.clearPhantomsBelow(line + 1);
      }

      this.$emit('changes', changes);
    },

    onEditorFocus() {
      this.$emit('focus');
    },

    onEditorBlur() {
      this.$emit('blur');
    },

    onPhantomGroupMouseEnter(e, phantoms) {
      const phantom = phantoms.length ? phantoms[0] : null;

      if (
        phantom &&
        phantom.insertion == null ||
        this.activeWalkthroughInsertionId !== phantom.insertion.id
      ) {
        this.popups.phantomHover.cancelAllHide();

        const { popupType: type=PopupType.Code } = phantom.meta;

        const content =
          phantoms.map((p, i) => {
            const prefix = phantoms.length > 1 ? i : '';

            const partials = [{
              content: this.beautify(p.content.join(', ')),
              type,
            }];

            if (phantoms.length > 1) {
              partials.unshift({
                content: prefix,
                type,
              });
            }

            return {
              partials,
            };
          });

        this.popups.phantomHover.show({
          delay: TIMEOUT_PHANTOM_HOVER_SHOW,
          loc: {
            line: phantom.line - 1,
            column: phantom.column,
          },
          content,
        });
      }
    },

    onPhantomGroupMouseLeave() {
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
            meta: {
              popupType: PopupType.Code,
              isError: true,
            },
          }]);

          this.$refs.editor.renderCovered(loc, execId, {
            isError: true,
          });
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
      this.$emit('sandbox-busy', time);
    },

    onSandboxFree() {
      this.$emit('sandbox-free');
    },

    onSandboxResponse(replies) {
      // console.log('Received', replies);

      replies.forEach((payload) => {
        const execId = payload.execId;

        // Don't render any phantoms for replies incoming from previously executed scripts
        if (execId >= this.activeExecId) {

          // Avoid rendering phantoms for things that are redundant, link strings, numbers
          if (payload.coverage) {
            this.addCoverage(payload.coverage, execId);
          }

          if (payload.hasOwnProperty('insertionId')) {
            const insertion = this.insertions.items[payload.insertionId];
            const locStart = insertion.node.loc.start;

            this.$refs.editor.renderCovered(locStart, execId, {
              isCovered: true,
            });
          }
        }
      });

      this.$emit('sandbox-response', replies)
    },

    onSandboxDone(payload) {
      this.eraseOutdatedPhantoms();
      this.$refs.editor.updatePhantoms(true);
      this.$emit('sandbox-done', payload);
    },
  },
};
</script>

<style scoped lang="scss">

</style>
