import * as m from 'mithril';
import * as $ from 'jquery';

import app from 'state';
import Header from './components/header/header';

const Layout = {
  view: (vnode) => {
    return m('.mithril-app', {
      class: vnode.attrs.lightBg ? 'light-bg' : '',
    }, [
      m(Header),
      vnode.children,
    ]);
  },
};

export { Layout };
