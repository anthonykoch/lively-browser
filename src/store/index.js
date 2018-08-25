import createPersistedState from 'vuex-persistedstate'

import editors from './editors';
import settings from './settings';
import tutorials from './tutorials';
import notifications from './notifications';

export default {
  strict: true,
  plugins: [createPersistedState({
    paths: [
      'editors',
      'settings',
      'tutorials',
    ],
  })],
  modules: {
    editors,
    settings,
    tutorials,
    notifications,
  },
};
