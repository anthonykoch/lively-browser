<template>
  <div id="app">
    <app-site-header></app-site-header>

    <transition
      name="tr-fade"
      mode="out-in"
    >
      <router-view></router-view>
    </transition>
  </div>
</template>

<script>

import shortcuts from '@/constants/shortcuts';
import Vue from 'vue';

export default {
  name: 'App',

  components: {
    AppSiteHeader: require('@/components/SiteHeader').default,
  },

  created() {
    this.shortcuts = Vue.setShortcuts({
      $store: this.$store,
      shortcuts,
    });
  },

  destroyed() {
    Vue.unsetShortcuts({
      shortcuts: this.shortcuts,
    });
  },
};
</script>
