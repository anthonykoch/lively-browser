import assert from 'assert';

import * as NOTIFICATIONS from '@/constants/notifications';
import * as TUTORIALS from '@/constants/tutorials';
import * as EDITORS from '@/constants/editors';

import { wait } from '@/utils';

const defaultFinishPredicate = (tutorial, getters, payload) => {
  return (
    // By default, we'll only run the finish for a tutorial if the user has not
    // yet finished the tutorial and if we're actually on the same tutorial step.
    tutorial.activeIndex === payload.index && !tutorial.isComplete
  );
};

const defaultStartPredicate = (tutorial, getters, payload) => {
  return (
    (
      // if it's the first step
      (payload.index === 0 && tutorial.activeIndex == null) ||
      // If it's the next step from the previous active step
      payload.index === tutorial.activeIndex + 1
    ) &&
    !tutorial.isComplete
  );
};

export const tutorialSteps = {
  [TUTORIALS.INTRODUCTION]: {
    steps: [
      {
        async start($store) {
          await $store.dispatch('notifications/show', {
            id: NOTIFICATIONS.INTRODUCTION_1,
          }, {
            root: true
          });
        },
        async finish($store) {
          await $store.dispatch('notifications/hide', {
            id: NOTIFICATIONS.INTRODUCTION_1,
          }, {
            root: true
          });
        },
      },

      {
        async start($store) {
          await $store.dispatch('notifications/show', {
            id: NOTIFICATIONS.INTRODUCTION_2,
          }, {
            root: true
          });
        },
        async finish($store) {
          await $store.dispatch('notifications/hide', {
            id: NOTIFICATIONS.INTRODUCTION_2,
          }, {
            root: true
          });
        },
      },

      {
        async start($store) {
          await $store.dispatch('editors/unmarkWalkthroughPopupVisible', {
            query: {
              id: EDITORS.ID_MAIN,
            },
          }, {
            root: true
          });

          await $store.dispatch('notifications/show', {
            id: NOTIFICATIONS.INTRODUCTION_3,
          }, {
            root: true
          });

          for (let i = 1; i < 5; i++) {
            wait(i * 1200).then(() => {
              return $store.dispatch('editors/showWalkthroughNext', {
                query: {
                  id: EDITORS.ID_MAIN,
                },
              }, {
                root: true
              });
            });
          }
        },
        async finish($store) {
          await $store.dispatch('notifications/hide', {
            id: NOTIFICATIONS.INTRODUCTION_3,
          }, {
            root: true
          });
        },
      },

      {
        async start($store) {
          await $store.dispatch('notifications/show', {
            id: NOTIFICATIONS.INTRODUCTION_4,
          }, {
            root: true
          });
        },
        async finish($store) {
          await $store.dispatch('notifications/hide', {
            id: NOTIFICATIONS.INTRODUCTION_4,
          }, {
            root: true
          });
        },
      },
    ],
  },
};

const getTutorialStepsById = (id) => {
  assert(tutorialSteps[id], `Tutorial steps for "${id}" do not exist`);

  return tutorialSteps[id].steps;
};

export default {
  namespaced: true,

  state: {
    tutorials: {
      [TUTORIALS.INTRODUCTION]: {
        id: TUTORIALS.INTRODUCTION,
        activeIndex: null,
        isComplete: false,
      },
    },
  },

  mutations: {
    BOOTSTRAP(state) {
      // Check if the tutorial is done, and if not, restart it.
      Object.values(state.tutorials).forEach((tutorial) => {
        if (!tutorial.isComplete) {
          tutorial.activeIndex = null;
        }
      });
    },

    UPDATE_INDEX(state, { tutorial, index }) {
      assert(Number.isFinite(index), `index is not a number, got ${index}`);
      tutorial.activeIndex = index;
    },

    MARK_TUTORIAL_COMPLETE(state, { tutorial }) {
      tutorial.isComplete = true;
    },

    UNMARK_TUTORIAL_COMPLETE(state, { tutorial }) {
      tutorial.isComplete = false;
    },
  },

  actions: {
    bootstrap({ dispatch, commit }) {
      commit('BOOTSTRAP');
    },

    markTutorialComplete({ commit, getters }, { id }) {
      const tutorial = getters.getTutorialById(id);

      commit('MARK_TUTORIAL_COMPLETE', { tutorial })
    },

    unmarkTutorialComplete({ commit, getters }, { id }) {
      const tutorial = getters.getTutorialById(id);

      commit('UNMARK_TUTORIAL_COMPLETE', { tutorial })
    },

    /**
     * Starts a tutorial from the beginning. If the tutorial has already been
     * completed, this call will be ignored and no state changes will happen.
     */
    async begin({ dispatch }, { id }) {
      return dispatch('start', { id, index: 0, begin: true });
    },

    async start({ dispatch, commit, getters }, payload) {
      const { id, index, when } = payload;
      const tutorial = getters.getTutorialById(id);

      const predicate =
        payload.hasOwnProperty('when') && when == null
          // If when is passed and it loosely equals null, don't check any predicate
          ? null
          : payload.hasOwnProperty('when')
            // else if when it is passed, use it
            ? when
            // Use the default predicate
            : defaultStartPredicate;

      if (typeof predicate !== 'function' || !predicate(tutorial, getters, payload)) {
        return null;
      }

      console.log('Commiting start tutorial', {
        goto: index,
        active: tutorial.activeIndex
      });

      dispatch('fire', {
        id,
        index,
        begin: payload.begin,
        which: 'start',
      });

      commit('UPDATE_INDEX', { tutorial, index });
    },

    /**
     * @param $store
     * @param payload.id - the id for the tutorial to fire the clean up for
     * @param payload.index - the specific step of the tutorial to finish
     * @param payload.when - a predicate to determine whether or not the clean up should
     *                       actually fire. The tutorial is passed as the first argument.
     *
     * @example
     *   $store.dispatch('tutorials/finish', {
     *     id: 'introduction',
     *     index: 0,
     *     // Only fires when the tutorial is actually on 0.
     *     when: tutorial => tutorial.activeIndex === 0
     *   })
     */
    async finish({ dispatch, commit, getters }, payload) {
      const { id, index, when } = payload;
      const tutorial = getters.getTutorialById(id);

      const predicate =
        payload.hasOwnProperty('when') && when == null
          // If when is passed and it loosely equals null, don't check any predicate
          ? null
          : payload.hasOwnProperty('when')
            // else if when it is passed, use it
            ? when
            // Use the default predicate
            : defaultFinishPredicate;

      if (typeof predicate !== 'function' || !predicate(tutorial, getters, payload)) {
        return null;
      }

      console.log('Commiting finish tutorial', {
        goto: index,
        active: tutorial.activeIndex
      });

      dispatch('fire', {
        id,
        index,
        which: 'finish',
      });

      commit('UPDATE_INDEX', { tutorial, index });
    },

    /**
     * Initiates a tutorial step or fires the clean up for the tutorial step.
     *
     * @private
     * @throws If the tutorial has not been manually started
     *
     * @param $store
     * @param options.index - the step of the tutorial to show
     * @param options.which - either "start" or "finish"
     * @param options.id - the id of the tutorial
     * @param options.begin - whether or not this action designates the beginning of the tutorial.
     */
    async fire($store, { index, which, id, begin=false }) {
      const tutorialSteps = getTutorialStepsById(id);
      const tutorial = $store.getters.getTutorialById(id);
      const hasTutorialStarted = tutorial.activeIndex != null;
      const isTutorialAtEnd = tutorial.activeIndex === tutorialSteps.length - 1;

      if (!hasTutorialStarted && !begin) {
        throw new Error(`Tutorial "${id}" has not been manually initiated`);
      } else if (index >= tutorialSteps.length) {
        throw new Error(`Tutorial "${id}" has only ${tutorialSteps.length} steps, got index ${index}`);
      }

      if (!tutorial.isComplete) {
        await tutorialSteps[index][which]($store);
      }

      if (which === 'finish' && isTutorialAtEnd) {
        await $store.dispatch('markTutorialComplete', { id });
      } else {
        await $store.dispatch('unmarkTutorialComplete', { id });
      }

      return {
        isTutorialAtEnd,
      };
    },
  },

  getters: {
    getTutorialById: (state) => (id) => {
      assert(state.tutorials[id], `Tutorial "${id}" doesn't exist `);

      return state.tutorials[id];
    },
  },
};
