import 'styles/main.css';

import * as m from 'mithril';
import app from 'state';
import { Thread } from 'models/thread';

const ThreadRow = {
  view: (vnode) => {
    const thread: Thread = vnode.attrs.thread;

    return m('.ThreadRow', {
      key: thread.hash,
      onclick: (e) => {
        e.preventDefault();
        m.route.set('/' + thread.hash);
      }
    }, [
      m('.thread-title', [
        thread.title,
      ]),
      m('.thread-meta', [
        m('.thread-author', thread.author),
        m('.thread-hash', thread.hash),
        m('.thread-comments', [
          'Comments: ' + thread.comments.length
        ]),
      ]),
    ]);
  }
};

const MainPage = {
  view: (vnode) => {
    const threads = app.forum.threadStore.getAll();
    vnode.attrs.title = '';
    vnode.attrs.author = '';
    return m('.MainPage', [
      m('.container', [
        m('.thread-create', [
          m('input[type="text"]', {
            placeholder: '<Thread Title>',
            onchange: (e) => {
              e.redraw = false;
              vnode.attrs.title = e.target.value;
            },
          }),
          m('input[type="text"]', {
            placeholder: '<Author>',
            onchange: (e) => {
              e.redraw = false;
              vnode.attrs.author = e.target.value;
            },
          }),
          m('button', {
            onclick: () => {
              app.forum.makeThread(vnode.attrs.author, vnode.attrs.title);
            },
          }, 'Submit'),
        ]),
        threads.length > 0 ?
          threads.reverse().map((thread) => m(ThreadRow, { thread: thread })) :
          m('.empty-text', 'No threads found')
      ]),
    ]);
  }
};

export default MainPage;
