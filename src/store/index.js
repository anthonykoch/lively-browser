import createPersistedState from 'vuex-persistedstate'

import editor from './editor';
import articles from './articles';
import settings from './settings';

export default {
  strict: true,
  plugins: [createPersistedState({
    //
  })],
  modules: {
    editor,
    articles,
    settings,
  },
};
