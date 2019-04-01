import 'styles/pages/login.scss';

import * as m from 'mithril';
import * as $ from 'jquery';
import app from 'state';
import Button from 'views/components/button';
import { User } from 'models/user';

const LogoutWell = {
  view: (vnode) => {
    return m('.LoginWell', [
      m('.login-option', [
        m('h3', 'Logout'),
        m(Button, {
          disabled: false,
          onclick: (e) => {
            e.preventDefault();
            app.login.user = null;
            app.login.loggedIn = false;
            vnode.state.loggedOut = true;
            console.log('logged out');
          }
        }),
        vnode.state.loggedOut && m('.login-message.success', [
          'You have successfully logged out.',
        ])
      ])
    ]);
  }
};

const LoginWell = {
  view: (vnode) => {
    // TODO: add a selection for provider
    return m('.LoginWell', [
      m('.login-option', [
        m('h3', 'Login'),
        m('input[type="text"]', {
          name: 'username',
          placeholder: 'Username',
          value: 'jnaviask',
        }),
        m(Button, {
          disabled: vnode.state.disabled,
          onclick: async (e) => {
            e.preventDefault();
            const username = $(vnode.dom).find('[name="username"]').val() as string;
            if (!username) {
              return;
            }
            vnode.state.disabled = true;
            let user: User = app.forum.userStore.getByHash(username);
            if (!user) {
              // TODO: don't do this, make the user register...
              console.log('user not found, registering...');
              await app.forum.createUser(username, 'github');
              user = app.forum.userStore.getByHash(username);
            }
            if (!user) {
              throw new Error('failed to add user to db');
            }
            vnode.state.user = user;
            app.login.user = user;
            app.login.loggedIn = true;
            console.log('logged in as: ' + user.name);
          }
        }, vnode.state.disabled ? 'Logging in...' : 'Login'),
        vnode.state.user && m('.login-message.success', [
          `You have successfully logged in as "${vnode.state.user.name}". `,
        ])
      ]),
    ]);
  }
};

const LoginPage = {
  view: (vnode) => {
    const page = app.login.loggedIn ? LogoutWell : LoginWell;
    return m('.LoginPage', [
      m('.container.content-container', [
        m(page),
      ]),
    ]);
  }
};

export default LoginPage;
