import 'styles/pages/home.scss';

import * as m from 'mithril';
import app from 'state';
import { Thread } from 'models/thread';
import { notifyError } from 'controllers/notifications';

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
      m('span.thread-title', [
        thread.title,
      ]),
      m('span.thread-meta', [
        m('.thread-comments', [
          thread.comments.length + ' Replies'
        ]),
        m('a.thread-author', {
          // TODO: link to author's page
          href: '#',
          onclick: () => { app.route.set('/'); },
        }, thread.author),
      ]),
    ]);
  }
};

const HomePage = {
  view: (vnode) => {
    const threads = app.forum.threadStore.getAll();
    vnode.attrs.title = '';
    vnode.attrs.author = '';
    return m('.HomePage', [
      m('.container', [
        m('.thread-create', [
          m('span.thread-new-topic', 'New Topic:'),
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
              if (!vnode.attrs.author || !vnode.attrs.title) {
                notifyError('Threads must have both author and title.');
                return;
              }
              app.forum.createThread(vnode.attrs.author, vnode.attrs.title);
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

export default HomePage;
