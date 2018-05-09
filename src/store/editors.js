
const DEFAULT_TUTORIAL_EDITOR_VALUE = `
var user = {
  username: 'musefan42',
};

const getUsername = () => {
  return \`Hello, $\{user.username}! I'm delighted to meet you\`;
};

getUsername();

user;

`;

const getByQuery = ({ id='', state: editorState=[] }, state) => {
  if (!Array.isArray(editorState)) throw new Error(`{Array<string>} state, got ${editorState}`);
  if (typeof id !== 'string') throw new Error(`{string} id, got ${id}`);

  const shouldMatchByHasFocus = editorState.includes('<focused>');

  return state.editors.find(editor => {
    const bools = [];

    if (shouldMatchByHasFocus) {
      bools.push(editor.hasFocus);
    }

    if (id !== '') {
      bools.push(editor.id === id);
    }

    return bools.every(Boolean);
  }) || null;
};

export default {
  namespaced: true,

  state: {
    editors: [
      {
        id: 'main-tutorial',
        value: DEFAULT_TUTORIAL_EDITOR_VALUE,
        lastModifiedAt: null,
        lastExecutedAt: null,
        shouldExecute: false,
        activeWalkthroughStepIndex: 0,
        isWalkthroughPopupShowing: false,
      }
    ],
  },

  mutations: {
    BOOTSTRAP(state) {
      // FIXME: This is sort of a hack because I don't know how to make this
      //        not persist in localStorage
      state.editors = state.editors.map(editor => {
        return {
          ...editor,
          shouldExecute: false,
        }
      });
    },

    REGISTER(state, data) {
      const {
        id,
        value,
        lastModifiedAt=null,
        lastExecutedAt=null,
        shouldExecute=false,
        activeWalkthroughStepIndex=0,
        isWalkthroughPopupShowing=false,
      } = data;

      state.editors.push({
        id,
        value,
        lastModifiedAt,
        lastExecutedAt,
        shouldExecute,
        activeWalkthroughStepIndex,
        isWalkthroughPopupShowing,
      });
    },

    MARK_SHOULD_EXECUTE(state, { editor }) {
      editor.shouldExecute = true;
    },

    UNMARK_SHOULD_EXECUTE(state, { editor }) {
      editor.shouldExecute = false;
    },

    CLEAR_WALKTHROUGH_POPUP(state, { editor }) {
      editor.isWalkthroughPopupShowing = false;
    },

    SET_WALKTHROUGH_INDEX(state, { editor, index }) {
      editor.walkthroughIndex = index;
    },

    SHOW_WALKTHROUGH_NEXT(state, { editor }) {
      editor.walkthroughIndex += 1;
    },

    SHOW_WALKTHROUGH_PREVIOUS(state, { editor }) {
      editor.walkthroughIndex -= 1;
    },

    SET_VALUE(state, { editor, value }) {
      editor.value = value;
    },

    UPDATE_LAST_EXECUTED_TIME(state, { editor, time }) {
      editor.lastExecutedAt = time;
    },

    UPDATE_LAST_MODIFIED_TIME(state, { editor, time }) {
      editor.lastModifiedAt = time;
    },

    MARK_FOCUSED(state, { editor }) {
      editor.hasFocus = true;
    },

    UNMARK_FOCUSED(state, { editor }) {
      editor.hasFocus = false;
    },
  },

  actions: {
    bootstrap: ($store) => $store.commit('BOOTSTRAP'),

    register($store, data) {
      $store.commit('REGISTER', data);
    },

    markShouldExecute($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('MARK_SHOULD_EXECUTE', {
        editor,
      });
    },

    unmarkShouldExecute($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UNMARK_SHOULD_EXECUTE', {
        editor,
      });
    },

    clearWalkthroughPopup($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('CLEAR_WALKTHROUGH_POPUP', {
        editor,
      });
    },

    setWalkthroughIndex($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('SET_WALKTHROUGH_INDEX', {
        editor,
        index: data.index,
      });
    },

    showWalkthroughNext($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('SHOW_WALKTHROUGH_NEXT', {
        editor,
      });
    },

    showWalkthroughPrevious($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('SHOW_WALKTHROUGH_PREVIOUS', {
        editor,
      });
    },

    setValue($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('SET_VALUE', {
        editor,
        value: data.value,
      });
    },

    markFocused($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('MARK_FOCUSED', {
        editor,
      });
    },

    unmarkFocused($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UNMARK_FOCUSED', {
        editor,
      });
    },

    updateLastExecutedTime($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UPDATE_LAST_EXECUTED_TIME', {
        editor,
        time: data.time,
      });
    },

    updateLastModifiedTime($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UPDATE_LAST_MODIFIED_TIME', {
        editor,
        time: data.time,
      });
    },
  },

  getters: {
    isEditorExecutionDirty: (state, getters) => (id) => {
      const editor = getters.editorsById[id];

      return editor.lastModifiedTime > editor.lastExecutedAt;
    },

    editorsById: (state) => {
      return state.editors.reduce((byId, editor) => {
        byId[editor.id] = editor;

        return byId;
      }, {});
    },

    /**
     * @param  {String} state - Array of '<focused>'
     * @param  {Array<string>} state - Array of '<focused>'
     */
    getEditorByQuery: (state) => (query) => getByQuery(query, state),

    anyHasFocus(state) {
      return state.editors.some(editor => editor.hasFocus);
    },

    anyEditorHasWalkthroughPopup(state) {
      return state.editors.some(editor => editor.hasWalkthroughPopup);
    },
  },
};
