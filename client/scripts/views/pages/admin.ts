import * as m from 'mithril';
import app from 'state';

const AdminPage = {
  view: (vnode) => {
    return m('.AdminPage', [
      m('.container', [
        m('h3', 'Admin'),
        m('p', 'No admin functionality present'),
      ]),
    ]);
  }
};

export default AdminPage;
