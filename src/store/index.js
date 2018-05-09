import createPersistedState from 'vuex-persistedstate'

import editors from './editors';
import articles from './articles';
import settings from './settings';

export default {
  strict: true,
  plugins: [createPersistedState({
    //
  })],
  modules: {
    editors,
    articles,
    settings,
  },
};
