import 'styles/components/header/header.scss';

import * as m from 'mithril';
import app from 'state';

const HeaderItem = {
  view: (vnode) => {
    const path = vnode.attrs.path;
    const label = vnode.attrs.label;
    return m('.header-item.menu-header-item', {
      onclick: () => { app.route.set(path); },
    }, label);
  }
};

const Header = {
  view: () => {
    return m('.Header', [
      m('.container', [
        m('.header-left', [
          // logo
          m('a.header-logo', {
            href: '#',
            onclick: () => { app.route.set('/'); },
          }, [
            m('span.header-logo-image'),
            m('span.header-logo-text', 'Orbit Forum'),
          ]),
          m(HeaderItem, {path: '/', label: 'Home', also: (p) => p.startsWith('/?') }),
          m(HeaderItem, {path: '/accounts', label: 'Accounts' }),
          m(HeaderItem, {path: '/admin', label: 'Admin' }),
        ]),
        m('.header-right', [
          m(HeaderItem, {path: '/login', label: app.login.loggedIn ? 'Log Out' : 'Log In' }),
        ])
      ]),
    ]);
  }
};

export default Header;
