// @flow

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import Vuex from 'vuex';
import { VTooltip, VPopover, VClosePopover } from 'v-tooltip';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

import '@/styles/global.scss';

import App from './App';
import router from './router';
import storeDefinitions from './store';

import Shortcuts from '@/plugins/shortcuts';

Vue.use(Vuex);
Vue.use(Shortcuts);

Vue.directive('tooltip', VTooltip);
Vue.directive('close-popover', VClosePopover);
Vue.component('v-popover', VPopover);

Vue.config.productionTip = false;

const $store = new Vuex.Store(storeDefinitions);

console.log($store);

$store.subscribe(function(mutation, state) {
  console.log('Store change', mutation)
});

$store.dispatch('editors/bootstrap');

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: {
    App,
  },
  router,
  store: $store,
  template: '<App/>',
});
