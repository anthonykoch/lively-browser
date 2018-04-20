// @flow

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import Vuex from 'vuex';

import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';

import '@/styles/global.scss';

import App from './App';
import router from './router';
import storeDefinitions from './store';

Vue.use(Vuex);

Vue.config.productionTip = false;

const store = new Vuex.Store(storeDefinitions);

// store.subscribe(function(mutation, state) {
//   console.log('Store change', mutation)
// });

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: {
    App,
  },
  router,
  store,
  template: '<App/>',
});
