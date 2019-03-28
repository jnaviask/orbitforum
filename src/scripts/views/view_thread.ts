import 'styles/view_thread.scss';

import * as m from 'mithril';
import app from 'state';
import { Thread } from 'models/thread';
import { makeComment } from 'controllers/orbitdb';

const ThreadComments = {
  view: (vnode) => {
    const thread: Thread = vnode.attrs.thread;
    console.log(thread.comments);

    return m('.ThreadComments', [
      thread.comments.map((c) => m(
        '.thread-comment', [
          m('.comment-author', c.author),
          m('.comment-hash', c.hash),
          m('.comment-text', c.text),
        ]
      )),
      m('.thread-comment', [
        m('input[type="text"]', {
          placeholder: '<Author>',
          onchange: (e) => {
            e.redraw = false;
            vnode.attrs.author = e.target.value;
          },
        }),
        m('textarea.new-thread-comment', {
          placeholder: 'Your comment here...',
          onchange: (e) => {
            e.redraw = false;
            vnode.attrs.comment = e.target.value;
          },
        }),
        m('button', {
          onclick: () => {
            makeComment(thread, vnode.attrs.author, vnode.attrs.comment);
          },
        }, 'Submit'),
      ])
    ]);
  }
};

const ViewThreadPage = {
  view: (vnode) => {
    if (!vnode.attrs.thread) {
      return m('.Spinner');
    }
    const thread: Thread = vnode.attrs.thread;
    return m('.ViewThreadPage.container.content-container-large', [
      m('.thread-page', [
        m('.thread-page-header', [
          m('.thread-title', thread.title),
          m('.thread-author', thread.author),
        ]),
        m('.thread-page-body', [
          m('.thread-page-left', [
            m(ThreadComments, { thread: thread }),
          ]),
          m('.thread-page-right', [

          ]),
        ]),
      ]),
    ]);
  },
};

export default ViewThreadPage;
