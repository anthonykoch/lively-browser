<template>
  <div class="container">
    <codemirror
      ref="editor"
      :value="code"
      :options="cmOptions"
      @ready="onCMReady"
      @input="onCMCodeChange">
    </codemirror>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/javascript/javascript.js';

export default {
  name: 'Editor',
  props: {
    code: {
      type: String,
      required: true,
    },
    phantoms: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      widgets: [],
      cmOptions: {
        autoCloseBrackets: true,
        theme: 'monokai',
        keyMap: 'sublime',
        lineNumbers: true,
        matchBrackets: true,
        mode: 'javascript',
        viewportMargin: 15,
        showCursorWhenSelecting: true,
        styleActiveLine: true,
        tabWidth: 2,
      },
    };
  },
  components: {
    codemirror,
  },
  methods: {
    onCMReady() {
      this.$emit('ready');
    },
    onCMCodeChange() {
      this.$emit('change');
    },
    getValue() {
      return this.getCodeMirror().getValue();
    },
    getCodeMirror() {
      return this.$refs.editor.codemirror;
    },
    updatePhantoms(props) {
      const { shouldRenderPhantoms, phantoms } = props;
      // console.log('UpdatedPhantoms:', phantoms.map(p => p.line));

      // Don't bother updating the phantoms because it may cause old phantoms
      // to be rendered on a previous old line and then its new line when.
      // if (!shouldRenderPhantoms) {
      //   return;
      // }
      const cm = this.getCodeMirror();
      const viewport = cm.getViewport();

      cm.operation(() => {
        console.log('Updating', Date.now());
        this.widgets.forEach(widget => {
          cm.removeLineWidget(widget);
        });

        this.widgets = [];
        const VIEWPORT_OFFSET = 20;

          console.time('render');
        phantoms
          .filter(p => (
              p.line >= (viewport.from - VIEWPORT_OFFSET) && p.line <= (viewport.to + VIEWPORT_OFFSET)
            )
          )
          .forEach(phantom => {
            const line = phantom.line - 1;
            const phantomElement = document.createElement('div');

            // Enforce nowrap in case a user defined class adds it
            phantomElement.style.whiteSpace = 'nowrap';
            phantomElement.classList.add('Phantom');
            phantomElement.classList.add(phantom.className);
            phantomElement.textContent = phantom.content;

            this.widgets.push(
              cm.addLineWidget(line, phantomElement, {
                coverGutter: false,
                noHScroll: true,
              })
            );

            // this.$emit('phantoms-rendered', phantoms);
          });
          console.timeEnd('render');
          console.log('\n');
      });
    },
  },
  watch: {
    phantoms() {
      this.updatePhantoms(this.$props);
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

.container {
  font-size: inherit;
  height: 100%;
  line-height: inherit;
  position: absolute; /* [1] */
  width: 100%;
}

</style>
