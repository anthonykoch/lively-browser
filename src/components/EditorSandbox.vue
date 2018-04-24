<template>
  <div>
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
      @change="onEditorChange">
    </app-editor>
  </div>
</template>

<script>
import _ from 'lodash';
import cuid from 'cuid';

import logger from '@/logger';

// type CoveredInsertionPoint = {
//  ids: number[], // Unsigned int array technically, not sure how to annotate that
//  points: { [key: number]: string },
//  start: number,
//  end: number,
//  chunkSize: number,
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
      activeWalkthroughStep: -1,
      phantoms: Object.freeze([]),
      origin: `name:lively-editor;id:${cuid()}`,
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
    const [{ default: transform }, instrument] = await this.imports;

    this.cm = this.$refs.editor.cm;
    this.cm.doc.on('delete', this.onLineDeleted);
    this.cm.on('keydown', this.onKeydown);
    this.instrument = instrument;
    this.transform = transform;

    if (this.execOnReady) {
      this.runScript();
    }
  },

  created() {
    this.coverage = Object.freeze({
      start: 0,
      end: 0,
      chunkSize: 0,
      ids: [],
      points: {},
    });

    this.phantoms = [];
    this.transform = null;
    this.imports = Promise.all([
      import('scuffka-javascript/dist/transform'),
      import('scuffka-javascript/dist/instrument'),
    ]);
  },

  destroyed() {
    this.cm.off('keydown', this.onKeydown);
  },

  methods: {
    stepPreviousInWalkthrough() {
      const step = Math.max(0, this.activeWalkthroughStep - 1);

      this.activeWalkthroughStep = step;
      // console.log({step});
      this.showWalkthroughStep(step);
    },

    stepNextInWalkthrough() {
      const items = this.insertions.items;

      if (items.length > 0) {
        const step = Math.min(items.length - 1, this.activeWalkthroughStep + 1);

        this.activeWalkthroughStep = step;
        this.showWalkthroughStep(step);
        // console.log({step});
      }

    },

    showWalkthroughStep(walkthroughStepIndex) {
      // console.log(this.isShowingWalkthrough, walkthroughStepIndex);

      if (Number.isFinite(walkthroughStepIndex) && this.insertions.items.hasOwnProperty(walkthroughStepIndex)) {
        const insertionId = this.coverage.ids[walkthroughStepIndex];
        const insertion =
          this.insertions.items.find(({ id }) => insertionId === id);

        console.log(this.coverage.ids)
        if (insertion) {
          // console.log({walkthroughStepIndex, insertionId},  this.insertions.items[insertionId])

          // console.log(insertion.loc)

          const toCodemirrorLoc = (loc) => ([
            {
              line: loc.start.line - 1,
              ch: loc.start.column,
            },
            {
              line: loc.end.line - 1,
              ch: loc.end.column,
            },
          ]);

          if (this.walkthroughMarker) {
            this.walkthroughMarker.clear();
          }

          const walkthroughHighlightClass = 'WalkthoughtStep';
          const loc = toCodemirrorLoc(insertion.node.loc);

          this.walkthroughMarker = this.cm.doc.markText(loc[0], loc[1], {
            className: walkthroughHighlightClass,
            title: 'a title ma dewdy',
          });
        } else {
          console.log('lol nope')
        }

      }
    },

    renderInitialCoverage(insertions) {
      // console.log(coverage);

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

    isSkippable(insertion, meta) {
      return (
          insertion.type !== 'Identifier'
          // this.instrument.isLiteral(node)             ||
          // insertion.context === 'ReturnStatement'     ||
          // insertion.context === 'VariableDeclaration'
        );
    },

    async runScript() {
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

      // console.log(data.badLoops);

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

    setCoverage(coverage, execId) {
      this.coverage = coverage;
      console.log(coverage);

      // for (let id = coverage.start; id < coverage.end; id += 1) {
        // console.log('LOL', id, coverage.hasOwnProperty(id));
      Object.keys(coverage.points)
        .map(key => +key)
        .forEach((id) => {
          const insertion = this.insertions.items[id];;

          if (!this.isSkippable(insertion)) {
            const loc = insertion.node.loc;

            this.addPhantoms([{
              insertion,
              execId,
              content: coverage.points[id],
              line: loc.end.line,
            }]);
          }
        });
    },

    onEditorChange: _.debounce(function onEditorChange() {
      // this.runScript();
    }, 200, {
      trailing: true,
    }),

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
      console.log('Received', replies);

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
            const item = this.insertions.items[payload.insertionId];

            this.$refs.editor.renderCovered(item, execId);
          }
        }
      });
    },

    onSandboxDone(payload) {
      this.eraseOutdatedPhantoms();
      this.$refs.editor.updatePhantoms(true);
      this.$emit('done', payload);
    },

    onKeydown(cm, event) {
      if (event.ctrlKey && event.which === 13) {
        this.runScript();
      }
    },

    onLineDeleted() {
      this.$emit('lineDeleted');
    },

  },

  beforeDestroyed() {
    this.cm.doc.off('delete', this.onLineDeleted);
    this.cm.off('keydown', this.onKeydown);
  },
};
</script>

<style scoped lang="scss">

</style>
