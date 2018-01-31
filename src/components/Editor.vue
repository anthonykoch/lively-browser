<template>
  <div class="container">
    <codemirror
      ref="editor"
      :value="code"
      :options="cmOptions"
      @viewportChange="onCMViewportChange"
      @ready="onCMReady"
      @input="onCMCodeChange">
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
import 'codemirror/mode/javascript/javascript.js';

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
      this.updatePhantomsDelayed(newPhantoms, true);
    },
    clearPhantoms() {
      this.phantoms = [];
      this.hasDirtyPhantoms = false;
    },
    onCMReady() {
      this.$emit('ready');
    },
    onCMCodeChange() {
      this.$emit('change');
    },
    onCMViewportChange: debounce(function () {
      this.updatePhantoms(this.phantoms, true);
    }, 300, {
      maxWait: 350,
    }),
    getValue() {
      return this.getCodeMirror().getValue();
    },
    getCodeMirror() {
      return this.$refs.editor.codemirror;
    },
    updatePhantoms(phantoms, force=false) {
      // Don't bother updating the phantoms because it may cause old phantoms
      // to be rendered on a previous old line and then its new line when.
      if (!this.hasDirtyPhantoms && !force) {
        return;
      }

      const VIEWPORT_OFFSET = 20;

      const cm = this.getCodeMirror();
      const viewport = cm.getViewport();

      cm.operation(() => {
        // console.log('Updating', Date.now());
        this.widgets.forEach(widget => cm.removeLineWidget(widget));
        this.widgets = [];

        // console.time('render');

        const ps =
          phantoms
            .filter(p =>
                p.line >= (viewport.from - VIEWPORT_OFFSET) &&
                p.line <= (viewport.to + VIEWPORT_OFFSET)
            )
            .map(phantom => {
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
              return phantom;
            });
            // console.timeEnd('render');
            // console.log('\n');
            // console.log(ps.length)
        });

      this.hasDirtyPhantoms = false;
    },
  },
  created() {
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
