
import { ID_MAIN } from '@/constants/editors';

export const EDITORS_EXECUTE_CODE = 'shortcut/editors/executeCode';

export const EDITORS_CLEAR_WALKTHROUGH_POPUP = 'shortcut/editors/clearWalkthroughPopup';

export const EDITORS_SET_WALKTHROUGH_AT_START = 'shortcut/editors/setWalkthroughAtStart';

export const EDITORS_SHOW_WALKTHROUGH_NEXT = 'shortcut/editors/showWalkthroughNext'

export const EDITORS_SHOW_WALKTHROUGH_PREVIOUS = 'shortcut/editors/showWalkthroughPrevious'

export default [
  {
    name: EDITORS_EXECUTE_CODE,
    keys: ['ctrl+enter', 'command+alt+enter'],
    // IDEA: when: (state, getters) => getters['editors/anyHasFocus'],
    on(e, $store) {
      $store.dispatch('editors/markShouldExecute', {
        query: {
          id: ID_MAIN,
        },
      });
    },
  },
  {
    name: EDITORS_CLEAR_WALKTHROUGH_POPUP,
    keys: ['esc'],
    on(e, $store) {
      $store.dispatch('editors/unmarkWalkthroughPopupVisible', {
        query: {
          id: ID_MAIN,
        },
      });
      $store.dispatch('editors/unmarkWalkthroughMarkerVisible', {
        query: {
          id: ID_MAIN,
        },
      });
    },
  },
  { // TODO: Should be removed when walkthrough UI is in place
    name: EDITORS_SET_WALKTHROUGH_AT_START,
    keys: ['ctrl+shift+0'],
    on(e, $store) {
      $store.dispatch('editors/setWalkthroughIndex', {
        index: 0,
        query: {
          id: ID_MAIN,
        },
      });
    },
  },
  {
    name: EDITORS_SHOW_WALKTHROUGH_NEXT,
    keys: ['command+shift+period', 'ctrl+n'],
    // when: (state, getters) => getters['editors/anyHasFocus'],
    on(e, $store) {
      $store.dispatch('editors/showWalkthroughNext', {
        query: {
          id: ID_MAIN,
          // state: ['focused'],
        },
      });
    },
  },
  {
    name: EDITORS_SHOW_WALKTHROUGH_PREVIOUS,
    keys: ['command+shift+,', 'ctrl+p'],
    // when: (state, getters) => getters['editors/anyHasFocus'],
    on(e, $store) {
      $store.dispatch('editors/showWalkthroughPrevious', {
        query: {
          id: ID_MAIN,
          // state: ['focused'],
        },
      });
    },
  },
];
