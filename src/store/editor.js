import {
  EDITOR_INCREMENT_EXEC_ID,
  EDITOR_CLEAR_PHANTOMS,
  EDITOR_ADD_PHANTOM,
} from './constants';

export default {
  // namespaced: true,
  state: {
    activeExecId: 0,
    hasDirtyPhantoms: false,
    phantoms: [],
    isSandboxLoaded: false,
    value:
`var a = 123;
a;
console.log('LUL');
`,
  },
  mutations: {
    incrementExecId(state, payload) {
      state.activeExecId += 1;
    },
    clearPhantoms(state) {
      state.phantoms = [];
    },
    markPhantomsDirty(state) {
      state.hasDirtyPhantoms = true;
    },
    markPhantomsClean(state) {
      state.hasDirtyPhantoms = false;
    },
    addPhantom(state, payload) {
      console.log('PhantomPayload:', payload);

      const phantoms =
        state.phantoms
          .filter(phantom => {
            return (
              payload.execId === phantom.execId &&
              phantom.line !== payload.line
            );
          });

      phantoms.push(payload);

      state.phantoms = phantoms;
    },
  },
  actions: {
    [EDITOR_INCREMENT_EXEC_ID]({ commit }) {
      commit('incrementExecId');
    },
    [EDITOR_CLEAR_PHANTOMS]({ commit }) {
      commit('clearPhantoms');
      commit('markPhantomsClean');
    },
    [EDITOR_ADD_PHANTOM]({ commit }, payload) {
      commit('addPhantom', payload);
      commit('markPhantomsDirty');
    },
  },
  getters: {
    //
  },
};
