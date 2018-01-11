import assert from 'assert';

import { parseMarkdown, restrict } from '@/utils';

import {
  CODE_SLIDESHOW_NEXT,
  CODE_SLIDESHOW_PREVIOUS,
} from '@/store/constants';

const defaultSlides =
  parseMarkdown(require('raw-loader!@/_posts/how-objects-and-properties-work.md'));

assert(Array.isArray(defaultSlides), 'You dun messed up the markdown parsing');

export default {
  state: {
    slides: defaultSlides,
    activeSlideIndex: 0,
    activeSlide: defaultSlides[0],
  },
  mutations: {
    codeSlideshowNext(state) {
      const index = restrict(state.activeSlideIndex + 1, 0, state.slides.length - 1);

      state.activeSlide = state.slides[index];
      state.activeSlideIndex = index;
    },
    codeSlideshowPrevious(state) {
      const index = restrict(state.activeSlideIndex - 1, 0, state.slides.length - 1);

      state.activeSlide = state.slides[index];
      state.activeSlideIndex = index;
    },
  },
  actions: {
    [CODE_SLIDESHOW_NEXT]({ commit }) {
      commit('codeSlideshowNext');
    },
    [CODE_SLIDESHOW_PREVIOUS]({ commit }) {
      commit('codeSlideshowPrevious');
    },
  },
  getters: {
    //
  },
};
