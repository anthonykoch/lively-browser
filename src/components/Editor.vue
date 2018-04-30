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
import _ from 'lodash';

import 'codemirror/lib/codemirror.css';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/comment/comment';

import emmet from '@emmetio/codemirror-plugin';

emmet(CodeMirror);

const createCoverageMarker = (options={}) => {
  const element = document.createElement('div');
  const isCovered = options.isCovered ? 'is-covered' : 'is-uncovered';
  const isError = options.isError ? 'is-error': '';

  element.className = `CoverageMarker ${isCovered} ${isError}`;
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

    insertions: {
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
          'Ctrl-P'() {},
          'Ctrl-N'() {},
          'Ctrl-Shift-0'() {},
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
    this.cm = null;
  },

  created() {
    this.maxRecordedViewportLength = 0;
    this.phantomPool = [];
    this.widgets = [];
    this.coveredByLine = {};
    this.widgetsByLine = {};
    this.updatePhantomsDelayed = _.debounce(this.updatePhantoms, 200, {
      trailing: true,
    });
  },

  methods: {
    clearBelow(startingLine) {
      // console.log(Object.keys(this.coveredByLine), {startingLine})
      Object.keys(this.coveredByLine)
        .forEach((key) => {
          const line = (key | 0) + 1;

          if (line > startingLine) {
            this.cm.setGutterMarker(line, GUTTER_KEY, null);
          }
        });
    },

    clearCoverage() {
      return this.cm.clearGutter(GUTTER_KEY);
    },

    renderInitialCoverage(insertions, execId) {
      this.coveredByLine = {};
      this.cm.operation(() => {
        this.clearCoverage();

        for (let i = 0; i < insertions.items.length; i += 1) {
          const insertion = insertions.items[i];
          const loc = insertion.node.loc;
          const element = createCoverageMarker({ isCovered: false, });

          this.cm.setGutterMarker(loc.start.line - 1, GUTTER_KEY, element);
        }
      });
    },

    renderCovered(locStart, execId, options={}) {
      const line = locStart.line - 1;
      // const [start, end] = getSingleCharFromLoc(locStart);
      // const rangeId = createRangeId(start, end, execId);

      if (this.coveredByLine[line]) {
        return;
      }

      const element = createCoverageMarker({
        isCovered: true,
        isError: options.isError,
      });

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

    onPhantomMouseenter(e) {
      this.$emit('mouseenter-phantom', e, e.target.phantom, e.target);
    },

    onPhantomMouseleave(e) {
      this.$emit('mouseleave-phantom', e, e.target.phantom, e.target);
    },

    onWidgetMouseenter(e) {
      this.$emit('mouseenter-widget', e, e.target.phantoms, e.target);
    },

    onWidgetMouseleave(e) {
      this.$emit('mouseleave-widget', e, e.target.phantoms, e.target);
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
              contents: phantoms,
            });

            const widget =
              this.cm.addLineWidget(line, phantomElement, {
                coverGutter: false,
                noHScroll: true,
              });

            this.widgetsByLine[line] = widget;
            this.widgets.push(widget);

            widget.node.addEventListener('mouseenter', this.onWidgetMouseenter);
            widget.node.addEventListener('mouseleave', this.onWidgetMouseleave);
            widget.node.phantom = phantoms;
          });

        // console.timeEnd('render-block');
      });
    },

    addElementToPool(el) {
      el.phantoms = null;

      const children = el.querySelector('.Phantom-messageList').children;

      el.removeEventListener('mouseenter', this.onWidgetMouseenter);
      el.removeEventListener('mouseleave', this.onWidgetMouseleave);

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        child.phantom = null;
        child.removeEventListener('mouseenter', this.onPhantomMouseenter);
        child.removeEventListener('mouseleave', this.onPhantomMouseleave);
      }

      this.phantomPool.push(el);
    },

    getPooledElement() {
      if (this.phantomPool.length) {
        // console.log('LOOK, POOLING DAD', this.phantomPool.length,
        // this.phantomPool.map(el => el.textContent))
        return this.phantomPool.shift();
      }

      return document.createElement('div');
    },

    updatePhantomElement(el, { column, line, contents: phantoms, maxPerLine=10 }) { /* eslint-disable no-param-reassign */
      // Reset the elements attributes in case they aren't reset wherever they are used

      const token = this.cm.getTokenAt({ line, ch: 0 });
      const whitespace =
        Number.isFinite(column)
          ? ' '.repeat(column)
          : ' '.repeat(token.state.indented);

      el.className = `Phantom`;
      el.style.display = 'block';
      el.innerHTML =
        // DO NOT ADD WHITESPACE in the Phantom-indent element
        `<span class="Phantom-indent">${whitespace}</span>
        <span class="Phantom-messageList"></span>`;

      const fragment = document.createDocumentFragment();

      let hey = 0;

      for (let i = 0; i < phantoms.length; i += 1) {
        if (hey > 9) {
          break;
        }

        const phantom = phantoms[i];

        const div = document.createElement('span');
        const { content, className='' } = phantom;
        const comma =
          phantoms.length > 1 && i != phantoms.length - 1
            ? ', '
            : '';

        div.phantom = phantom;

        div.textContent = content.join(', ') + comma;
        // TODO: Enforce a max line length/max item length
        div.textContent = content.slice(0, 10).join(', ') + comma;
        div.className = `Phantom-messageListItem ${className}`;

        fragment.appendChild(div);

        div.addEventListener('mouseenter', this.onPhantomMouseenter);
        div.addEventListener('mouseleave', this.onPhantomMouseleave);
      }

      let messageList = el.querySelector('.Phantom-messageList');

      messageList.appendChild(fragment);

      // NOTE: This is necessary to know which phantoms were mouseentered
      el.phantoms = phantoms;

      el.addEventListener('mouseenter', this.onWidgetMouseenter);
      el.addEventListener('mouseleave', this.onWidgetMouseleave);

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
