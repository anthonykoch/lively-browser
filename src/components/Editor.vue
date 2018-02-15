<template>
  <div class="container">
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

import emmet from '@emmetio/codemirror-plugin';

emmet(CodeMirror);

export default {

  name: 'Editor',

  props: {
    code: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      cmOptions: {
        mode: 'javascript',

        autoCloseBrackets: true,
        theme: 'monokai',
        keyMap: 'sublime',
        lineNumbers: true,
        matchBrackets: true,
        // lineWrapping: true,
        viewportMargin: 15,
        showCursorWhenSelecting: true,
        styleActiveLine: true,
        tabWidth: 2,

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

  components: {
    codemirror,
  },

  methods: {

    addPhantom(newPhantom) {
      const newPhantoms =
        this.phantoms
          .filter((phantom) => {
            const isExpired = phantom.isExpired != null && phantom.isExpired(phantom);
            const shouldRemain = isExpired === false && phantom.line !== newPhantom.line;

            // console.log({shouldRemain, isExpired}, phantom)

            return shouldRemain;
          });

      newPhantoms.push(newPhantom);

      this.phantoms = newPhantoms;
      this.hasDirtyPhantoms = true;
      this.updatePhantomsDelayed(true);
    },

    clearPhantoms() {
      this.phantoms = [];
      this.hasDirtyPhantoms = false;
      this.updatePhantoms();
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
      return this.getCodeMirror().getValue();
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
      this.renderInlinePhantoms();

      this.hasDirtyPhantoms = false;
    },

    renderBlockPhantoms() {
      // FIXME: Phantom filtering needs refactoring
      this.phantoms = this.getPhantoms();

      const cm = this.getCodeMirror();
      const viewport = cm.getViewport();

      cm.operation(() => {
        // console.time('render-block');

        // Remove the old phantoms and recycle the widget phantom node
        const removedPhantomLines =
          this.widgets.map((widget) => {
            cm.removeLineWidget(widget);
            this.onAfterRemoveWidget(widget);

            return widget.line.lineNo();
          });

        this.widgets = [];

        const addedPhantomLines =
          this.getPhantomsInView(viewport)
            .filter(phantom => phantom.layout == null || phantom.layout === 'block')
            .map((phantom) => {
              const line = phantom.line - 1;
              const phantomElement = this.getPhantomElement(phantom);

              this.widgets.push(
                cm.addLineWidget(line, phantomElement, {
                  coverGutter: false,
                  noHScroll: true,
                }),
              );

              return phantom.line;
            });

        this.$emit('update-block-phantoms', removedPhantomLines, addedPhantomLines);

        // console.timeEnd('render-block');
      });
    },

    renderInlinePhantoms() {
      // console.time('render-inline');

      const viewport = this.getCodeMirror().getViewport();
      const phantoms = this.getPhantomsInView(viewport).filter(phantom => phantom.layout === 'inline');

      for (let i = 0; i < phantoms.length; i += 1) {
        const phantom = phantoms[i];

        // Note: 1 is subtracted from the index because phantom lines start from 1, not 0
        const elementIndex = phantom.line - viewport.from - 1;
        // const elementIndex = Math.min(phantom.line - viewport.from - 1, 0);

        // console.log(viewport, 'line:', phantom.line, 'elIndex:', elementIndex)

        const lineElement = this.lines[elementIndex].querySelector('.CodeMirror-line');
        // TOOD: Could probably remove the query call by keeping track of phantoms. It would
        //       also play well into element pooling anyway..
        let phantomElement = lineElement.querySelector('.Phantom');

        if (phantomElement == null) {
          phantomElement = this.getPhantomElement(phantom);
          lineElement.appendChild(phantomElement);
        } else {
          this.updatePhantomElement(phantomElement, phantom);
        }
      }

      this.$emit('update-inline-phantoms', phantoms);
      // console.timeEnd('render-inline');
    },

    addElementToPool(element) {
      this.inlinePhantomPool.push(element);
    },

    getPooledElement() {
      if (this.inlinePhantomPool.length) {
        // console.log('LOOK, POOLING DAD', this.inlinePhantomPool.length,
        // this.inlinePhantomPool.map(el => el.textContent))
        return this.inlinePhantomPool.shift();
      }

      return document.createElement('div');
    },

    updatePhantomElement(el, { content='', className='', layout }) {
      // Reset the elements attributes in case they aren't reset wherever they are used

      // Enforce nowrap in case a user defined class adds it
      el.style.whiteSpace = 'nowrap';
      el.className = `Phantom is-inline ${className}`;

      el.style.display =
        layout === 'block' || layout == null
          ? 'block'
          : 'inline-block';

      el.id = '';
      el.textContent = content;

      return el;
    },

    getPhantomElement(phantom) {
      const div = this.getPooledElement();

      return this.updatePhantomElement(div, phantom);
    },

    onAfterRemoveWidget(widget) {
      this.addElementToPool(widget.node);
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

    onRenderLine() {
      // Note: The set timeout fixes a bug where codemirror overwrites the entire line
      //       when the cursor moves to the line, resulting in the phantom needing to
      //       be rewritten.
      setTimeout(this.renderInlinePhantoms, 0);
    },

  },

  mounted() {
    const cm = this.getCodeMirror();

    cm.on('renderLine', this.onRenderLine);

    this.lines = this.$refs.editor.$el.querySelector('.CodeMirror-code').children;
  },

  created() {
    this.maxRecordedViewportLength = 0;
    this.inlinePhantomPool = [];
    this.phantoms = [];
    this.widgets = [];
    this.updatePhantomsDelayed = debounce(this.updatePhantoms, 200, {
      trailing: true,
    });
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

.container {
  font-size: inherit;
  height: 100%;
  line-height: inherit;
  position: absolute; /* [1] */
  width: 100%;
}

</style>
