import {
} from './constants';

export default {
  // namespaced: true,
  state: {
    code: `
var user = {
  username: 'musefan42',
};

const a = () => {
  return user.username + 'memes';
};

a();

user;

`,
  },
  mutations: {

  },
  actions: {
  },
  getters: {
    //
  },
};
