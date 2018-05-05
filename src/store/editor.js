
export default {
  // namespaced: true,
  state: {
    code: `
var user = {
  username: 'musefan42',
};

const getUsername = () => {
  return \`Hello, $\{user.username}! I'm delighted to meet you\`;
};

getUsername();

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
