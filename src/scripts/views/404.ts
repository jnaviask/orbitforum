import * as m from 'mithril';

const PageNotFound = {
  view: (vnode) => {
    return m('.PageNotFound', [
      m('.container', [
        m('h3', '404'),
        m('p', 'Page not found'),
      ]),
    ]);
  }
};

export default PageNotFound;
