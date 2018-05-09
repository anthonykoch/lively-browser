
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

const getEditorByQuery = ({ id='', state: editorState=[] }, state) => {
  if (!Array.isArray(editorState)) throw new Error(`{Array<string>} state, got ${editorState}`);
  if (typeof id !== 'string') throw new Error(`{string} id, got ${id}`);

  const shouldMatchByHasFocus = editorState.includes('focused');

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
        coverageTotalLength: 0,
        lastModifiedAt: null,
        lastExecutedAt: null,
        shouldExecute: false,
        activeWalkthroughStepIndex: -1,
        isWalkthroughPopupShowing: false,
        isWalkthroughMarkerShowing: false,
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
          activeWalkthroughStepIndex: -1,
          coverageTotalLength: 0,
          shouldExecute: false,
          lastModifiedAt: null,
          lastExecutedAt: null,
          isWalkthroughPopupShowing: false,
          isWalkthroughMarkerShowing: false,
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
        activeWalkthroughStepIndex=-1,
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

    MARK_WALKTHROUGH_VISIBLE(state, { editor }) {
      editor.isWalkthroughPopupShowing = true;
      editor.isWalkthroughMarkerShowing = true;
    },

    UNMARK_WALKTHROUGH_VISIBLE(state, { editor }) {
      editor.isWalkthroughPopupShowing = false;
      editor.isWalkthroughMarkerShowing = false;
    },

    MARK_WALKTHROUGH_MARKER_VISIBLE(state, { editor }) {
      editor.isWalkthroughMarkerShowing = true;
    },

    UNMARK_WALKTHROUGH_MARKER_VISIBLE(state, { editor }) {
      editor.isWalkthroughMarkerShowing = false;
    },

    MARK_WALKTHROUGH_POPUP_VISIBLE(state, { editor }) {
      editor.isWalkthroughPopupShowing = true;
    },

    UNMARK_WALKTHROUGH_POPUP_VISIBLE(state, { editor }) {
      editor.isWalkthroughPopupShowing = false;
    },

    MARK_FOCUSED(state, { editor }) {
      editor.hasFocus = true;
    },

    UNMARK_FOCUSED(state, { editor }) {
      editor.hasFocus = false;
    },

    CLEAR_WALKTHROUGH_POPUP(state, { editor }) {
      editor.isWalkthroughPopupShowing = false;
    },

    SET_WALKTHROUGH_INDEX(state, { editor, index }) {
      editor.walkthroughIndex = index;
    },

    SHOW_WALKTHROUGH_NEXT(state, { editor }) {
      const step =
        editor.coverageTotalLength === 0
          ? -1
          : Math.min(editor.coverageTotalLength - 1, editor.activeWalkthroughStepIndex + 1);

      // console.log({step});

      if (editor.coverageTotalLength > 0) {
        editor.activeWalkthroughStepIndex = step;
        editor.isWalkthroughPopupShowing = true;
        editor.isWalkthroughMarkerShowing = true;
      }
    },

    SHOW_WALKTHROUGH_PREVIOUS(state, { editor }) {
      const step =
        editor.coverageTotalLength === 0
         ? -1
         : Math.max(0, editor.activeWalkthroughStepIndex - 1);

      // console.log({step});

      editor.activeWalkthroughStepIndex = step;
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

    UPDATE_COVERAGE_TOTAL(state, { coverageTotalLength, editor }) {
      editor.coverageTotalLength = coverageTotalLength;
    },
  },

  actions: {
    bootstrap: ($store) => $store.commit('BOOTSTRAP'),

    register($store, data) {
      $store.commit('REGISTER', data);
    },

    markShouldExecute($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('MARK_SHOULD_EXECUTE', { editor });
    },

    unmarkShouldExecute($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UNMARK_SHOULD_EXECUTE', { editor });
    },

    markFocused($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('MARK_FOCUSED', { editor });
    },

    unmarkFocused($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UNMARK_FOCUSED', { editor });
    },

    markWalkthroughVisible($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('MARK_WALKTHROUGH_VISIBLE', { editor });
    },

    unmarkWalkthroughVisible($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UNMARK_WALKTHROUGH_VISIBLE', { editor });
    },

    markWalkthroughMarkerVisible($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('MARK_WALKTHROUGH_MARKER_VISIBLE', { editor });
    },

    unmarkWalkthroughMarkerVisible($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UNMARK_WALKTHROUGH_MARKER_VISIBLE', { editor });
    },

    markWalkthroughPopupVisible($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('MARK_WALKTHROUGH_POPUP_VISIBLE', { editor });
    },

    unmarkWalkthroughPopupVisible($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UNMARK_WALKTHROUGH_POPUP_VISIBLE', { editor });
    },

    clearWalkthroughPopup($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('CLEAR_WALKTHROUGH_POPUP', { editor });
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

      $store.commit('SHOW_WALKTHROUGH_NEXT', { editor });
    },

    showWalkthroughPrevious($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('SHOW_WALKTHROUGH_PREVIOUS', { editor });
    },

    setValue($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('SET_VALUE', {
        editor,
        value: data.value,
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

    updateCoverageTotal($store, data) {
      const editor = $store.getters.getEditorByQuery(data.query);

      $store.commit('UPDATE_COVERAGE_TOTAL', {
        editor,
        coverageTotalLength: data.coverageTotalLength,
      });
    },
  },

  getters: {
    isEditorExecutionDirty: (state, getters) => (id) => {
      const editor = getters.editorsById[id];

      return (
          editor.lastExecutedAt == null ||
          editor.lastModifiedTime == null ||
          editor.lastModifiedTime > editor.lastExecutedAt
        );
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
    getEditorByQuery: (state) => (query) => getEditorByQuery(query, state),

    anyHasFocus(state) {
      return state.editors.some(editor => editor.hasFocus);
    },

    anyEditorHasWalkthroughPopup(state) {
      return state.editors.some(editor => editor.hasWalkthroughPopup);
    },
  },
};
