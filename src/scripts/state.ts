import * as m from 'mithril';

/*
 * state
 */

// Mithril style global state store
// TODO: replace with a real React state store
const app = {
  vm: {

  },

  // routing hack to fix m.route.set()
  route: {
    set: (path, data?, options?) => {
      console.log(path);
      m.route.set(path, data, options);
      window.scrollTo(0, 0);
    },
    link: (vnode) => {
      m.route.link(vnode);
      window.scrollTo(0, 0);
    }
  }
};

export default app;
