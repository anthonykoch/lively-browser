// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import Vuex from 'vuex';

import App from './App';
import router from './router';
import storeDefinitions from './store';

import '@/styles/global.scss';
import 'codemirror/lib/codemirror.css';

import 'codemirror/theme/monokai.css';

Vue.use(Vuex);

Vue.config.productionTip = false;

const store = new Vuex.Store(storeDefinitions);

// store.subscribe(function(mutation, state) {
//   console.log('Store change', mutation)
// });

console.log(store);

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: {
    App,
  },
});
