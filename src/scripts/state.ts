import * as m from 'mithril';
import { ThreadsStore } from 'models/stores';

/*
 * state
 */

// Mithril style global state store
// TODO: replace with a real React state store
const app = {
  orbitdb: null,

  vm: {

  },

  // stores
  threads: null,

  // routing hack to fix m.route.set()
  route: {
    set: (path, data?, options?) => {
      m.route.set(path, data, options);
      window.scrollTo(0, 0);
    },
    link: (vnode) => {
      m.route.link(vnode);
      window.scrollTo(0, 0);
    }
  }
};

app.threads = new ThreadsStore();

export default app;

function initServices() {
  console.log('init');
}

initServices();
