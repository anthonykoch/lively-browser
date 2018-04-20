<template>
  <div class="Editor">
    <codemirror
      ref="editor"
      :value="code"
      :options="cmOptions"
      @viewportChange="onViewportChange"
      @ready="onReady"
      @input="onCodeChange">
    </codemirror>
  </div>
</template>

<script>
import CodeMirror from 'codemirror';
import { codemirror } from 'vue-codemirror';
import debounce from 'lodash/debounce';

import 'codemirror/lib/codemirror.css';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/comment/comment';

import emmet from '@emmetio/codemirror-plugin';

emmet(CodeMirror);

const createCoverageMarker = (isCovered) => {
  const element = document.createElement('div');
  const state = isCovered ? 'is-covered' : 'is-uncovered';

  element.className = `CoverageMarker ${state}`;
  element.textContent = '*';

  return element;
};

const GUTTER_KEY = 'CoverageGutter';

// eslint-disable-next-line no-unused-vars
const getSingleCharFromLoc = (simpleLoc) => {
  return [{
    line: simpleLoc.line - 1,
    ch: simpleLoc.column,
  }, {
    line: simpleLoc.line - 1,
    ch: simpleLoc.column + 1,
  }];
};

// eslint-disable-next-line no-unused-vars
const createRangeId =
  (start, end, execId) =>
    `${execId}>${start.line}:${start.ch},${end.line}:${end.ch}`;

export default {

  name: 'Editor',

  components: {
    codemirror,
  },

  props: {
    phantoms: {
      type: Array,
      required: true,
      default: () => Object.freeze([]),
    },

    coverage: {
      type: Object,
      required: true,
      default() {
        return { items: Object.freeze([]) };
      },
      validator(value) {
        return value && Array.isArray(value.items);
      },
    },

    code: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      cmOptions: {
        mode: 'javascript',

        gutters: ['CodeMirror-linenumbers', 'CoverageGutter'],

        autoCloseBrackets: true,
        theme: 'monokai',
        keyMap: 'sublime',
        lineNumbers: true,
        matchBrackets: true,
        // lineWrapping: true,
        viewportMargin: 15,
        showCursorWhenSelecting: true,
        styleActiveLine: true,
        tabSize: 2,

        // Required by Emmet
        markTagPairs: true,
        autoRenameTags: true,

        extraKeys: {
          Tab: 'emmetExpandAbbreviation',
          Enter: 'emmetInsertLineBreak',
        },
      },
    };
  },

  watch: {
    phantoms() {
      this.hasDirtyPhantoms = true;
      this.updatePhantoms();
    },
  },

  mounted() {
   this.cm = this.getCodeMirror();
  },

  beforeDestroy() {
    // this.clearPhantoms();
    // this.clearCoverage();
    this.cm = null;
  },

  created() {
    this.maxRecordedViewportLength = 0;
    this.phantomPool = [];
    this.widgets = [];
    this.coveredByLine = {};
    this.widgetsByLine = {};
    this.updatePhantomsDelayed = debounce(this.updatePhantoms, 200, {
      trailing: true,
    });
  },

  methods: {

    clearCoverage() {
      return this.cm.clearGutter(GUTTER_KEY);
    },

    renderInitialCoverage(coverage, execId) {
      this.coveredByLine = {};
      this.cm.operation(() => {
        this.clearCoverage();

        for (let i = 0; i < coverage.items.length; i += 1) {
          const insertion = coverage.items[i];
          const loc = insertion.node.loc;

          if (insertion.type === 'BlockStatement') {
            // const [start, end] = getSingleCharFromLoc(loc.start);
            // const rangeId = createRangeId(start, end, execId);

            // const marker = this.cm.doc.markText(start, end, {
            //   className: 'CoveredBlock is-uncovered',
            //   title: 'This block has been entered',
            // });
          } else {
            const element = createCoverageMarker(false);

            this.cm.setGutterMarker(loc.start.line - 1, GUTTER_KEY, element);
          }
        }
      });
    },

    renderCovered(insertion, execId) {
      const locStart = insertion.node.loc.start;
      const line = locStart.line - 1;
      // const [start, end] = getSingleCharFromLoc(locStart);
      // const rangeId = createRangeId(start, end, execId);

      if (this.coveredByLine[line]) {
        return;
      }

      const element = createCoverageMarker(true);

      this.cm.setGutterMarker(line, GUTTER_KEY, element);
      this.coveredByLine[line] = true;
    },

    clearPhantoms() {
      this.phantoms = Object.freeze([]);
      this.hasDirtyPhantoms = false;
      this.updatePhantoms(true);
    },

    getPhantoms() {
      const phantoms =
        this.phantoms.filter(phantom => (
          typeof phantom.isExpired === 'function'
            ? !phantom.isExpired(phantom)
            : true
          ),
        );

      return phantoms;
    },

    getValue() {
      return this.cm.getValue();
    },

    getCodeMirror() {
      return this.$refs.editor.codemirror;
    },

    getPhantomsInView(viewport) {
      const phantoms = this.phantoms.filter(p => this.isPhantomInView(p.line, viewport));

      return phantoms;
    },

    /**
     * Returns true if the line is being rendered on the screen.
     *
     * Note: It's important to note that the line index starts from 1. Also, a line may be
     *       rendered but not necessarily visible on screen.
     *
     * @param  {Number}  _line         - The line index (starting from 1)
     * @param  {Number}  viewport.from
     * @param  {Number}  viewport.to
     * @return {Boolean}
     */
    isPhantomInView(_line, viewport) {
      const line = _line - 1;

      return line >= viewport.from && line <= viewport.to;
    },

    updatePhantoms(force=false) {
      // Don't bother updating the phantoms because it may cause old phantoms
      // to be rendered on a previous old line and then its new line when.

      if (!this.hasDirtyPhantoms && !force) {
        return;
      }

      this.renderBlockPhantoms();

      this.hasDirtyPhantoms = false;
    },

    renderBlockPhantoms() {
      const viewport = this.cm.getViewport();
      const phantomsInView = this.getPhantomsInView(viewport);

      this.phantomsByLine = phantomsInView.reduce((groups, phantom) => {
        const line = phantom.line - 1;
        let grouping = null;

        if (!Object.prototype.hasOwnProperty.call(groups, line)) {
          groups[line] = grouping = [];
        } else {
          grouping = groups[line];
        }

        grouping.push(phantom);

        return groups;
      }, {});

      this.widgetsByLine = {};

      this.cm.operation(() => {
        // console.time('render-block');

        // Remove the old phantoms and recycle the widget phantom node
        this.widgets.forEach((widget) => {
          widget.clear();
          this.addElementToPool(widget.node);
        });

        this.widgets = [];

        Object.entries(this.phantomsByLine)
          .forEach(([l, phantoms]) => {
            const line = Number(l);

            const phantomElement = this.getPhantomElement({
              line,
              contents: phantoms.slice(0, 10),
            });

            const widget =
              this.cm.addLineWidget(line, phantomElement, {
                coverGutter: false,
                noHScroll: true,
              });
            this.widgetsByLine[line] = widget;
            this.widgets.push(widget);
          });

        // console.timeEnd('render-block');
      });
    },

    addElementToPool(element) {
      this.phantomPool.push(element);
    },

    getPooledElement() {
      if (this.phantomPool.length) {
        // console.log('LOOK, POOLING DAD', this.phantomPool.length,
        // this.phantomPool.map(el => el.textContent))
        return this.phantomPool.shift();
      }

      return document.createElement('div');
    },

    updatePhantomElement(el, { column, line, contents, className='' }) { /* eslint-disable no-param-reassign */
      // Reset the elements attributes in case they aren't reset wherever they are used
      // console.time('updatePhantomElement');

      const token = this.cm.getTokenAt({ line, ch: 0 });
      const whitespace =
        Number.isFinite(column)
          ? ' '.repeat(column)
          : ' '.repeat(token.state.indented);

      el.style.whiteSpace = 'pre';
      el.className = `Phantom`;
      el.style.display = 'block';
      el.innerHTML =
        // DO NOT ADD WHITESPACE in the Phantom-indent element
        `<span class="Phantom-indent">${whitespace}</span>
        <span class="Phantom-messageList"></span>`;

      const fragment = document.createDocumentFragment();

      contents.forEach((phantom, i) => {
        const div = document.createElement('span');
        const { content, className='' } = phantom;
        const comma =
          contents.length > 1 && i != contents.length - 1
            ? ', '
            : '';

        div.textContent = String(content) + comma;
        div.className = `Phantom-messageListItem ${className}`;
        fragment.appendChild(div);
      });

      let messageList = el.querySelector('.Phantom-messageList');

      messageList.appendChild(fragment);
      // console.timeEnd('updatePhantomElement');

      return el;
    },

    getPhantomElement(phantom) {
      const div = this.getPooledElement();

      return this.updatePhantomElement(div, phantom);
    },

    onReady() {
      this.$emit('ready');
    },

    onCodeChange() {
      this.$emit('change');
    },

    onViewportChange() {
      this.updatePhantomsDelayed(true);
    },

  },

};
</script>

<style scoped lang="scss">

/**
 * 1. There is significant lag when the position is set to static or
 *    relative and the codeMirror `viewportMargin` is set to `Infinity`.
 *    The lag begins at around 900 lines, but with `position: absolute`
 *    it can take 10,000 lines without lagging.
 */

.Editor {
  font-size: inherit;
  height: 100%;
  line-height: inherit;
  position: absolute; /* [1] */
  width: 100%;
}

</style>
