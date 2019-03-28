import 'styles/view_thread.scss';

import * as m from 'mithril';
import app from 'state';
import { Thread } from 'models/thread';

const ThreadComments = {
  view: (vnode) => {
    const user = vnode.attrs.user;
    const thread: Thread = vnode.attrs.thread;

    return m('.ThreadComments', [
      m('.thread-comment', [
        thread.author && m('.thread-comment-author', thread.author),
      ]),
      m('.thread-comment', [
        // TODO: author
        m('textarea.new-thread-comment', {
          placeholder: 'Your comment here...',
        }),
      ])
    ]);
  }
};

const ViewThreadPage = {
  view: (vnode) => {
    const thread: Thread = vnode.attrs.thread;
    return m('.ViewThreadPage.container.content-container-large', [
      m('.thread-page', [
        m('.thread-page-header', [
          m('.thread-title', thread.title),
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
