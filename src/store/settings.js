import assert from 'assert';

const defaultSettings = {
  'execution.walkthrough': false,
  'execution.mode': 'manual',
};

const toArray = (arg) => Array.isArray(arg) ? arg: [arg];

const validators = {
  'execution.walkthrough': (value) => typeof value === 'boolean',
  'execution.mode': (value) => ['manual', 'automatic'].includes(value),
};

export default {
  state: {
    user: { ...defaultSettings },
    default: defaultSettings,
  },
  mutations: {
    saveSettings(state, settings) {
      Object.entries(settings)
        .forEach(([path, value]) => {
          state.user[path] = value;
        });
    },
  },
  actions: {
    saveSettings({ commit }, settings) {
      commit('saveSettings', settings);
    },
  },
  getters: {
    /**
     * Returns true if the path is in the user settings
     */
    hasUserSetting: (state) => (...args) => {
      return args.map(path => state.user.hasOwnProperty(path))
    },

    /**
     * Returns a user setting based on a path or the default if it doesn't exist
     */
    getUserSettingOrDefault: (state) => (...args) => {
      return args.map(path => {
        const result = state.user[path];

        assert(defaultSettings.hasOwnProperty(path), `Invalid settings path ${path}`);

        return result === undefined ? defaultSettings[path] : result;
      });
    },

    /**
     * Retrieved the user setting unmodified
     */
    getUserSetting: (state) => (...args) => args.map(path => state.user[path]),

    /**
     * If any of the settings retrieved are not valid, the default setting is returned.
     */
    getValidUserSetting: (state) => (...args) => {
      return args.map(path => {
        assert(validators.hasOwnProperty(path), `Invalid settings path ${path}`);

        const value = _.get(state.user, path);

        return validators[path](value) ? value : state.default[path];
      });
    },
  },
};
