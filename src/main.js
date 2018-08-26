// @flow

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import Vuex from 'vuex';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

import 'normalize.css';
import 'animate.css';
import '@/styles/_utilities.scss';
import '@/styles/global.scss';

import App from './App';
import router from './router';
import storeDefinitions from './store';

import Shortcuts from '@/plugins/shortcuts';


Vue.use(Vuex);
Vue.use(Shortcuts);

Vue.config.productionTip = false;

const $store = new Vuex.Store(storeDefinitions);

// For debugging purposes
console.log('Store', $store);

$store.subscribe(function(mutation, state) {
  console.log('Store change', mutation)
});

// Anything that needs to be kicked off in the store goes here
$store.dispatch('editors/bootstrap');
$store.dispatch('tutorials/bootstrap');

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
