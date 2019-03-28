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
        let thread;
        try {
          thread = app.threads.getByHash(vnode.attrs.hash);
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
