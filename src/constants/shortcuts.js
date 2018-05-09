
// type Platform = 'osx' | 'windows' | 'linux';


export default [
  {
    keys: ['ctrl+enter', 'command+alt+enter'],
    when: (state, getters) => getters['editors/anyHasFocus'],
    on(e, $store) {
      $store.dispatch('editors/markShouldExecute', {
        query: {
          state: ['focused'],
        },
      });
    },
  },
  {
    keys: ['esc'],
    when: (state, getters) => getters.anyEditorHasFocus,
    on(e, $store) {
      $store.dispatch('editors/unmarkWalthroughPopupVisible', {
        query: {
          state: ['focused'],
        },
      });
    },
  },
  { // TODO: Should be removed when walkthrough UI is in place
    keys: ['ctrl+shift+0'],
    on(e, $store) {
      $store.dispatch('editors/setWalkthroughIndex', {
        index: 0,
        query: {
          state: ['focused'],
        },
      });
    },
  },
  {
    keys: ['command+shift+period', 'ctrl+n'],
    when: (state, getters) => getters['editors/anyHasFocus'],
    on(e, $store) {
      $store.dispatch('editors/showWalkthroughNext', {
        query: {
          state: ['focused'],
        },
      });
    },
  },
  {
    keys: ['command+shift+,', 'ctrl+p'],
    when: (state, getters) => getters['editors/anyHasFocus'],
    on(e, $store) {
      $store.dispatch('editors/showWalkthroughPrevious', {
        query: {
          state: ['focused'],
        },
      });
    },
  },
];
