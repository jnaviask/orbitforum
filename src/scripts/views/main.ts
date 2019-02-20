import 'styles/main.css';

import * as m from 'mithril';
import app from 'state';

const ThreadRow = {
  view: (vnode) => {
    const thread = vnode.attrs.thread;

    return m('.ThreadRow', {
      key: thread.hash,
      /*
      onclick: (e) => {
        e.preventDefault();
        app.route.set('/thread/:hash', { hash: thread.hash });
      }*/
    }, [
      m('.thread-title', [
        thread.title,
      ]),
      m('.thread-meta', [
        m('span.thread-author', thread.author),
      ]),
    ]);
  }
};

const MainPage = {
  view: (vnode) => {
    const threads = app.threads.getAll();
    return m('.MainPage', [
      m('.container', [
        threads.length > 0 ?
          threads.map((thread) => m(ThreadRow, { thread: thread })) :
          m('.empty-text', 'No threads found')
      ]),
    ]);
  }
};

export default MainPage;
