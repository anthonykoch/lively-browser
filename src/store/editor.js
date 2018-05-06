
const DEFAULT_EDITOR_VALUE = `
var user = {
  username: 'musefan42',
};

const getUsername = () => {
  return \`Hello, $\{user.username}! I'm delighted to meet you\`;
};

getUsername();

user;

`;

export default {
  state: {
    value: DEFAULT_EDITOR_VALUE,
    execution: {
      isDirty: false,
    },
  },

  mutations: {
    SAVE_EDITOR_VALUE(state, { value }) {
      state.value = value;
    },

    UPDATE_EXECUTION_DIRTY_STATUS(state, { isDirty }) {
      state.execution.isDirty = isDirty;
    },
  },

  actions: {
    saveEditorValue($store, data) {
      $store.commit('SAVE_EDITOR_VALUE', data);
    },

    updateExecutionDirtyStatus($store, data) {
      $store.commit('UPDATE_EXECUTION_DIRTY_STATUS', data);
    },
  },

  getters: {
    //
  },
};
