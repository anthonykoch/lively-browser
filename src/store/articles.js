import axios from 'axios';

import { restrict } from '@/utils';

import {
  LOAD_ARTICLE_REQUEST,
  LOAD_ARTICLE_SUCCESS,
  LOAD_ARTICLE_FAILURE,
  LOAD_ARTICLES_META_SUCCESS,
  LOAD_ARTICLES_META_FAILURE,
  LOAD_ARTICLES_META_REQUEST,
  NAVIGATE_NEXT_ARTICLE_SECTION,
  NAVIGATE_PREVIOUS_ARTICLE_SECTION,
} from '@/store/constants';

export default {
  state: {
    article: null,
    articlesMeta: [],
    activeArticleSectionIndex: 0,
  },
  mutations: {
    setArticle(state, article) {
      state.article = article;
    },
    setArticlesMeta(state, articlesMeta) {
      state.articlesMeta = articlesMeta;
    },
    navigateNextArticleSection(state) {
      if (state.article == null) {
        return;
      }

      const { slides } = state.article;
      const index = restrict(state.activeArticleSectionIndex + 1, 0, slides.length - 1);

      state.activeArticleSectionIndex = index;
    },
    navigatePreviousArticleSection(state) {
      if (state.article == null) {
        return;
      }

      const { slides } = state.article;
      const index = restrict(state.activeArticleSectionIndex - 1, 0, slides.length - 1);

      state.activeArticleSectionIndex = index;
    },
  },
  actions: {
    [LOAD_ARTICLES_META_SUCCESS]({ commit }, articlesMeta) {
      commit('setArticlesMeta', Object.freeze(articlesMeta));
    },
    [LOAD_ARTICLES_META_FAILURE]() {
      //
    },
    async [LOAD_ARTICLES_META_REQUEST]({ dispatch }) {
      const response = await axios.get('/assets/posts/meta.json');

      dispatch(LOAD_ARTICLES_META_SUCCESS, response.data);
    },
    [LOAD_ARTICLE_SUCCESS]({ commit }, article) {
      commit('setArticle', Object.freeze(article));
    },
    [LOAD_ARTICLE_FAILURE]() {
      //
    },
    async [LOAD_ARTICLE_REQUEST]({ dispatch, commit }, articleId) {
      try {
        const response = await axios.get(`/assets/posts/${articleId}.json`);

        dispatch(LOAD_ARTICLE_SUCCESS, response.data);
      } catch (err) {
        await dispatch(LOAD_ARTICLE_FAILURE, err);
      }
    },
    [NAVIGATE_NEXT_ARTICLE_SECTION]({ commit }) {
      commit('navigateNextArticleSection');
    },
    [NAVIGATE_PREVIOUS_ARTICLE_SECTION]({ commit }) {
      commit('navigatePreviousArticleSection');
    },
  },
  getters: {
    activeArticleSection(state) {
      return state.article
        ? state.article.sections[state.activeArticleSectionIndex]
        : null;
    },
  },
};
