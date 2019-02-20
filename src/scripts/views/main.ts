import 'styles/main.css';

import * as m from 'mithril';
import app from 'state';

const MainPage = {
  view: (vnode) => {
    console.log('view');
    return m('.MainPage', [
      m('.container', [
          m('.empty-text', 'No threads found')
      ]),
    ]);
  }
};

export default MainPage;
