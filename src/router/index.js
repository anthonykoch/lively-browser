import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/views/Home';
import Editor from '@/views/Editor';

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: '/vue-scuffka/',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/editor',
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
