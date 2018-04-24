import assert from 'assert';

import _ from 'lodash';

const defaultSettings = {
  execution: {
    walkthrough: false,
    mode: 'manual',
  },
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
          _.set(state.user, path, value);
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
      return args.map(path => _.has(state.user, path));
    },

    /**
     * Returns a user setting based on a path or the default if it doesn't exist
     */
    getUserSettingOrDefault: (state) => (...args) => {
      return args.map(path => {
        const result = _.get(state.user, path);

        assert(_.has(defaultSettings, path), `Invalid settings path ${path}`);

        return result === undefined ? _.get(defaultSettings, path) : result;
      });
    },

    /**
     * Retrieved the user setting unmodified
     */
    getUserSetting: (state) => (...args) => args.map(path => _.get(state.user, path)),

    /**
     * If any of the settings retrieved are not valid, the default setting is returned.
     */
    getValidUserSetting: (state) => (...args) => {
      return args.map(path => {
        assert(validators.hasOwnProperty(path), `Invalid settings path ${path}`);

        const value = _.get(state.user, path);

        return validators[path](value) ? value : _.get(state.default, path);
      });
    },
  },
};
