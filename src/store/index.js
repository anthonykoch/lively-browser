import createPersistedState from 'vuex-persistedstate'

import editors from './editors';
import settings from './settings';

export default {
  strict: true,
  plugins: [createPersistedState({
    //
  })],
  modules: {
    editors,
    settings,
  },
};
