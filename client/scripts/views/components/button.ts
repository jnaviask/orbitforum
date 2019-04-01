import 'styles/components/button.scss';

import * as m from 'mithril';

const Button = {
  view: (vnode) => {
    return m('a.Button', {
      class: vnode.attrs.class + (vnode.attrs.disabled ? ' disabled' : ''),
      href: vnode.attrs.href,
      onclick: vnode.attrs.onclick,
    }, vnode.children);
  }
};

export default Button;
