import * as m from 'mithril';
import { ForumDatabase } from 'controllers/database';
import { User } from 'models/user';

/*
 * state
 */

// Mithril style global state store
// TODO: replace with a real React state store
interface IApp {
  login: {
    loggedIn: boolean;
    user?: User;
  };
  forum: ForumDatabase;
  route: {
    set(path: string, data?: any, options?: m.RouteOptions): void;
    link(vnode: any): void;
  };
}

const app: IApp = {
  login: {
    loggedIn: false,
  },
  forum: null,

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
