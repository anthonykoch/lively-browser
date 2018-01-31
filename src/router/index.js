import Vue from 'vue';
import Router from 'vue-router';
import Home from '@/views/Home';
import Tutorial from '@/views/Tutorial';
import TutorialList from '@/views/TutorialList';

Vue.use(Router);

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/tutorials',
      name: 'tutorial-list',
      component: TutorialList,
    },
    {
      path: '/tutorials/:slug',
      name: 'tutorial',
      component: Tutorial,
    },
    {
      path: '*',
      name: 'error404',
      component: { template: '<div>memers are 404ed</div>' },
    },
  ],
});
