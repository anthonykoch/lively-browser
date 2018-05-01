<template>
  <div>
    <h2>Tutorials</h2>
    <ul>
      <li
        v-for="articleMeta in articlesMeta"
        :key="articleMeta.id"
      >
        <router-link :to="{ path: articleMeta.slug }">{{ articleMeta.title }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import {
  LOAD_ARTICLES_META_REQUEST,
} from '@/store/constants';

export default {
  name: 'TutorialList',
  beforeRouteEnter(to, from, next) {
    next(async (vm) => {
      await vm.$store.dispatch(LOAD_ARTICLES_META_REQUEST);
    });
  },
  components: {
    //
  },
  data() {
    return {
      console,
    };
  },
  computed: {
    ...mapState({
      articlesMeta: state => state.articles.articlesMeta,
    }),
  },
  methods: {
    //
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

</style>
