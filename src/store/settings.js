import assert from 'assert';

const defaultSettings = {
  'execution.isWalkthroughEnabled': true,
  'execution.mode': 'manual',
};

const toArray = (arg) => Array.isArray(arg) ? arg: [arg];

const validators = {
  'execution.isWalkthroughEnabled': (value) => typeof value === 'boolean',
  'execution.mode': (value) => ['manual', 'automatic'].includes(value),
};

const assertPath = (path) => {
  assert(validators.hasOwnProperty(path), `Invalid settings path ${path}`);
};

export default {
  state: {
    user: { ...defaultSettings },
    default: defaultSettings,
  },
  mutations: {
    updateSettings(state, settings) {
      Object.entries(settings)
        .forEach(([path, value]) => {
          state.user[path] = value;
        });
    },
  },
  actions: {
    updateSettings({ commit }, settings) {
      commit('updateSettings', settings);
    },
  },
  getters: {
    /**
     * Returns true if the path is in the user settings
     */
    hasUserSetting: (state) => (path) => {
      assertPath(path);

      return state.user.hasOwnProperty(path);
    },

    /**
     * Returns a user setting based on a path or the default if the user setting is invalid.
     */
    getValidUserSetting: (state) => (path) => {
      assertPath(path);

      const value = state.user[path];

      return validators[path](value) ? value : state.default[path];
    },

    getUserSetting: (state) => {
      assertPath(path);

      return state.user[path];
    },

    isSettingValid: (state) => (path) => {
      assertPath(path);

      return validators[path](state.user[path]);
    },
  },
};
