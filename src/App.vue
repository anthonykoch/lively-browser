<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>

import shortcuts from '@/constants/shortcuts';
import Vue from 'vue';

export default {
  name: 'App',

  created() {
    this.shortcuts = Vue.setShortcuts({
      $store: this.$store,
      shortcuts,
    });
  },

  destroyed() {
    const remaining = Vue.unsetShortcuts({
      shortcuts: this.shortcuts,
    });
  },
};
</script>

<style lang="scss">

@import '~bootstrap/scss/functions';
@import '~bootstrap/scss/mixins';
@import '~bootstrap/scss/variables';
@import '~bootstrap/scss/_grid.scss';
@import '~bootstrap/scss/_media.scss';
@import '~bootstrap/scss/_utilities.scss';

#app {
  // font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
