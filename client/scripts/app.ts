import 'styles/lib/normalize.css';
import 'styles/lib/toastr.min.css';
import 'styles/layout.css';

import * as m from 'mithril';
import * as $ from 'jquery';
import app from 'state';

import { Layout } from 'views/layouts';
import PageNotFound from 'views/pages/404';
import HomePage from 'views/pages/home';
import ViewThreadPage from 'views/pages/view_thread';
import AdminPage from 'views/pages/admin';

import { notifyError } from 'controllers/notifications';
import { ForumDatabase } from 'controllers/database';
import { Thread } from 'models/thread';
import LoginPage from 'views/pages/login';

async function initServices() {
  const redraw = () => {
    m.redraw();
    // console.log('redrawn');
  };
  app.forum = new ForumDatabase(false, redraw, 'QmVDWT9BAn4J6TtxcNxiaf2LfQWwJxxnAnbyFdGVvkf8eb');
  const threads = await app.forum.init();
  m.redraw();
}

initServices();

/*
 * router
 */
$(() => {
  // set window error handler
  window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
    notifyError(errorMsg);
    return false;
  };

  m.route(document.body, '/', {
    '/': {
      render: (vnode) => {
        return m(Layout, [
          m(HomePage, { }),
        ]);
      },
    },
    '/admin': {
      render: (vnode) => m(Layout, {lightBg: true}, [ m(AdminPage) ])
    },
    '/login': {
      render: (vnode) => m(Layout, {lightBg: true}, [ m(LoginPage) ])
    },
    '/:hash': {
      render: (vnode) => {
        let thread: Thread;
        try {
          thread = app.forum.threadStore.getByHash(vnode.attrs.hash);
        } catch (e) {
          return m(Layout, [ m(PageNotFound) ]);
        }
        return m(Layout, [
          m(ViewThreadPage, { thread: thread }),
        ]);
      },
    },
  });
});
