<template>
  <div>
    <codemirror
      ref="editor"
      :value="code"
      :options="cmOptions"
      @ready="onCMReady"
      @focus="onCMFocus"
      @input="onCMCodeChange">
    </codemirror>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';

import 'codemirror/lib/codemirror.css';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/monokai.css';

export default {
  name: 'Editor',
  data() {
    return {
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
      code: 'memes!',
    };
  },
  components: {
    codemirror,
  },
  methods: {
    onCMReady() {
      console.log('lulllz');
    },
    onCMFocus() {
      console.log('focyused');
    },
    onCMCodeChange() {
      console.log('Fuckin memes dood');
    },
  },
};
</script>

<style>

</style>
