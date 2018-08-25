import assert from 'assert';

import * as NOTIFICATIONS from '@/constants/notifications';

export default {
  namespaced: true,

  state: {
    notificationsById: {
      [NOTIFICATIONS.WEB_WORKER_BUSY]: {
        isShowing: false,
        forEditor: true,
        message: 'The web worker running your code seems to be hanging. To terminate the web worker, press the stop button. Otherwise, be careful and watch your CPU usage!',
      },
      [NOTIFICATIONS.INTRODUCTION_1]: {
        isShowing: false,
        message: 'Hey, press me!',
        size: 'small',
      },
      [NOTIFICATIONS.INTRODUCTION_2]: {
        isShowing: false,
        message: '<span style="font-weight: 600">Tip:</span> Awesome! The code has now been executed. You can now see code coverage as well as the values for standalone variable names (like <code>greeting</code>).',
        size: 'small',
      },
      [NOTIFICATIONS.INTRODUCTION_3]: {
        isShowing: false,
        message: `<span style="font-weight: 600">Tip:</span> You can also see which expressions resolved first with these buttons. You can go back and forth as much as you please. <div style="margin-top: 15px">You're all set to go!</div>`,
        size: 'small',
      },
    },
  },

  mutations: {
    MARK_NOTIFICATION_VISIBLE(state, id) {
      assert(
        NOTIFICATIONS[id] != null,
        `Could not mark notification "${id}" visible`
      );

      state.notificationsById[id].isShowing = true;
    },

    UNMARK_NOTIFICATION_VISIBLE(state, id) {
      assert(
        NOTIFICATIONS[id] != null,
        `Could not mark notification "${id}" visible`
      );

      state.notificationsById[id].isShowing = false;
    },
  },

  actions: {
    show({ commit }, { id }) {
      commit('MARK_NOTIFICATION_VISIBLE', id);
    },

    hide({ commit }, { id }) {
      commit('UNMARK_NOTIFICATION_VISIBLE', id);
    },
  },

  getters: {
    getById: state => id => {
      if (!state.notificationsById.hasOwnProperty(id)) {
        throw new Error(`Notification "${id}" does not exist`);
      }

      return state.notificationsById[id];
    },

    getEditorNotifications(state) {
      console.log(Object.entries(state.notificationsById)
      .map(([key, item]) => {
        item.id = key;

        return item;
      }).filter((item) => item.forEditor));

      return Object.entries(state.notificationsById)
        .map(([key, item]) => {
          item.id = key;

          return item;
        }).filter((item) => item.forEditor);
    },
  },
};
