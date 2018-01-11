import editor from './editor';
import codeSlideshow from './code-slideshow';

export default {
  strict: true,
  modules: {
    editor,
    codeSlideshow,
  },
};

// import assert from 'assert';

// import { EDITOR, SLIDESHOW } from 'app/constants.js';
// import { parseMarkdown, restrict } from 'app/utils';

// const defaultSlides =
//   parseMarkdown(require('raw-loader!app/_posts/how-objects-and-properties-work.md'));

// assert(Array.isArray(defaultSlides), 'dafuck boro');

// const DEFAULT_SLIDESHOW_STATE = {
//   slides: defaultSlides,
//   activeSlideIndex: 0,
//   activeSlide: defaultSlides[0],
// };

// const DEFAULT_EDITOR_STATE = {
//   /**
//    * The value of the current editor
//    * @type {String}
//    */
//   value: defaultSlides[0].code,

//   /**
//    * The ID of the last executed script
//    * @type {Number}
//    */
//   activeExecId: 0,

//   /**
//    * Whether or not phantoms have changed and are waiting to be rendered.
//    * @type {Boolean}
//    */
//   hasDirtyPhantoms: false,

//   /**
//    * A wrapper is used around the items so we don't have to
//    * copy the list every time.
//    * @type {Array}
//    */
//   phantoms: [],

//   origin: `name:lively-editor;id:${Math.random()}`,
// };

// export const editor = (state=DEFAULT_EDITOR_STATE, { type, payload }) => {
//   // console.log('Action:', type);
//   let phantoms = null;

//   switch (type) {

//     /**
//      * Keeps track of the editor value.
//      */
//     case EDITOR.SET_VALUE:
//       return { ...state, value: payload.value };

//     case EDITOR.MARK_SANDBOX_LOADED:
//       return { ...state, isSandboxLoaded: true };

//     /**
//      * We set the active ID instead of incrementing it because setState is async
//      * and the id is needed before the state changes.
//      */
//     case EDITOR.SET_ACTIVE_EXEC_ID:
//       return {
//         ...state,
//         activeExecId: state.activeExecId + 1,
//       };

//     case EDITOR.MARK_PHANTOMS_CLEAN:
//       return {
//         ...state,
//         hasDirtyPhantoms: false,
//       };

//     case EDITOR.MARK_PHANTOMS_DIRTY:
//       return {
//         ...state,
//         hasDirtyPhantoms: true,
//       };

//     /**
//      * Adds a phantom and deletes and phantoms for an older execId that is equal
//      * to or below that line.
//      */
//     case EDITOR.ADD_PHANTOM:
//       phantoms =
//         state.phantoms
//           .filter(phantom => {
//             return (
//               payload.phantom.execId === phantom.execId &&
//               phantom.line !== payload.phantom.line
//             );
//           });

//       phantoms.push(payload.phantom);

//       return {
//         ...state,
//         hasDirtyPhantoms: true,
//         phantoms,
//       };

//     /**
//      * Clear all phantoms.
//      */
//     case EDITOR.CLEAR_PHANTOMS:
//       return {
//         ...state,
//         phantoms: [],
//       };

//     default:
//       return state;
//   }
// };

// export const slideshow = (state=DEFAULT_SLIDESHOW_STATE, { type }) => {
//   switch (type) {

//     case SLIDESHOW.NAVIGATE_NEXT:
//       const nextIndex = restrict(state.activeSlideIndex + 1, 0, state.slides.length - 1);

//       return {
//         ...state,
//         activeSlideIndex: nextIndex,
//         activeSlide: state.slides[nextIndex] || null,
//       };

//     case SLIDESHOW.NAVIGATE_PREVIOUS:
//       const previousIndex = restrict(state.activeSlideIndex - 1, 0, state.slides.length - 1);

//       return {
//         ...state,
//         activeSlideIndex: previousIndex,
//         activeSlide: state.slides[previousIndex] || null,
//       };

//     default:
//       return state;
//   }

// };
