import 'styles/lib/normalize.css';
import 'styles/lib/toastr.min.css';
import 'styles/layout.css';

import * as m from 'mithril';
import * as $ from 'jquery';
import app from 'state';

import { Layout } from 'views/layouts';
import PageNotFound from 'views/404';
import MainPage from 'views/main';
import ViewThreadPage from 'views/view_thread';

import { notifyError } from 'controllers/notifications';
import { ForumDatabase } from 'controllers/database';
import { Thread } from 'models/thread';

async function initServices() {
  const redraw = () => m.redraw();
  app.forum = new ForumDatabase('QmYkHL25rrTvt52udjbwhfq6DFWujsEdNbb7hGrsTtGyC2', redraw, redraw);
  const threads = await app.forum.loadThreads();
  console.log('got threads: ', threads);
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
          m(MainPage, { }),
        ]);
      },
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
