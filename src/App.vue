<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'app',
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
