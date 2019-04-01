import * as m from 'mithril';
import app from 'state';

const AdminPage = {
  view: (vnode) => {
    return m('.AdminPage', [
      m('.container', [
        m('h3', 'Admin'),
        m('p', 'Clear local thread cache'),
        m('button', {
          onclick: () => {
            app.forum.drop().then(() => {
              console.log('forum dropped!');
              m.redraw();
            });
          },
        }, 'Clear All'),
      ]),
    ]);
  }
};

export default AdminPage;
