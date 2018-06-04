import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/views/Home';
import Editor from '@/views/Editor';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/vue-scuffka',
      name: 'home',
      component: Home,
    },
    {
      path: '/vue-scuffka/editor',
      name: 'editor',
      component: Editor,
    },
    {
      path: '*',
      redirect: {
        name: 'home',
      },
    }
  ],
});
