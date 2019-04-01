import 'styles/pages/view_thread.scss';

import * as m from 'mithril';
import * as $ from 'jquery';
import app from 'state';
import { Thread } from 'models/thread';
import { notifyError } from 'controllers/notifications';

// TODO: figure out why header moves when viewing a thread with
//   a big comment!

const ThreadComments = {
  view: (vnode) => {
    const thread: Thread = vnode.attrs.thread;

    return m('.ThreadComments', [
      thread.comments.map((c) => m(
        '.thread-comment', [
          m('a.comment-author', {
            // TODO: link to author's page
            href: '#',
            onclick: () => { app.route.set('/'); },
          }, c.author),
          m('.comment-text', c.text),
        ]
      )),
      m('.thread-comment', [
        m('input[type="text"].new-thread-comment-author', {
          placeholder: '<Author>',
          onchange: (e) => {
            e.redraw = false;
            vnode.attrs.author = e.target.value;
          },
        }),
        m('textarea.new-thread-comment', {
          placeholder: '<Comment Text>',
          onchange: (e) => {
            e.redraw = false;
            vnode.attrs.comment = e.target.value;
          },
        }),
        m('button', {
          onclick: () => {
            if (!vnode.attrs.author) {
              notifyError('Comments must have an author.');
              return;
            }
            if (!vnode.attrs.comment) {
              notifyError('Comments must not be empty.');
              return;
            }
            app.forum.createComment(thread, vnode.attrs.author, vnode.attrs.comment);

            // clear input fields
            vnode.attrs.author = '';
            vnode.attrs.comment = '';
            $(vnode.dom).find('input[type="text"].new-thread-comment-author').val('');
            $(vnode.dom).find('textarea.new-thread-comment').val('');
          },
        }, 'Submit Reply'),
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
    return m('.ViewThreadPage', [
      m('.container', [
        m('.thread-page', [
          m('.thread-page-header', [
            m('.thread-title', thread.title),
            m('a.thread-author', {
            // TODO: link to author's page
            href: '#',
            onclick: () => { app.route.set('/'); },
            }, thread.author),
          ]),
          m('.thread-page-body', [
            m(ThreadComments, { thread: thread }),
          ]),
        ]),
      ])
    ]);
  },
};

export default ViewThreadPage;
