import * as m from 'mithril';
import * as $ from 'jquery';

import app from 'state';

const Layout = {
  view: (vnode) => {
    return m('.mithril-app', {
      class: vnode.attrs.lightBg ? 'light-bg' : '',
    }, [
      vnode.children,
    ]);
  },
};

export { Layout };
