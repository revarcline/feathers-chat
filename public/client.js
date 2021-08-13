/* global io, feathers, moment */
// Establish a Socket.io connection
const socket = io();

// Initialize our Feathers client application through Socket.io
// with hooks and authentication.
const client = feathers();
client.configure(feathers.socketio(socket));

// Use localStorage to store our login token
client.configure(
  feathers.authentication({
    storage: window.localStorage,
  })
);

// Login screen
const loginHTML = `<main class="login container">
  <div class="row">
    <div class="col-12 col-6-tablet push-3-tablet text-center heading">
      <h1 class="font-100">Log in or signup</h1>
    </div>
  </div>
  <div class="row">
    <div class="col-12 col-6-tablet push-3-tablet col-4-desktop push-4-desktop">
      <form class="form">
        <fieldset>
          <input class="block" type="email" name="email" placeholder="email">
        </fieldset>

        <fieldset>
          <input class="block" type="password" name="password" placeholder="password">
        </fieldset>

        <button type="button" id="login" class="button button-primary block signup">
          Log in
        </button>

        <button type="button" id="signup" class="button button-primary block signup">
          Sign up and log in
        </button>

        <a class="button button-primary block" href="/oauth/github">
          Login with GitHub
        </a>
      </form>
    </div>
  </div>
</main>`;

// Chat base HTML (without user list and messages)
const chatHTML = `<main class="flex flex-column">
  <header class="title-bar flex flex-row flex-center">
    <div class="title-wrapper block center-element">
      <img class="logo" src="http://feathersjs.com/img/feathers-logo-wide.png"
        alt="Feathers Logo">
      <span class="title">Chat</span>
    </div>
  </header>

  <div class="flex flex-row flex-1 clear">
    <aside class="sidebar col col-3 flex flex-column flex-space-between">
      <header class="flex flex-row flex-center">
        <h4 class="font-300 text-center">
          <span class="font-600 online-count">0</span> users
        </h4>
      </header>

      <ul class="flex flex-column flex-1 list-unstyled user-list"></ul>
      <footer class="flex flex-row flex-center">
        <a href="#" id="logout" class="button button-primary">
          Sign Out
        </a>
      </footer>
    </aside>

    <div class="flex flex-column col col-9">
      <main class="chat flex flex-column flex-1 clear"></main>

      <form class="flex flex-row flex-space-between" id="send-message">
        <input type="text" name="text" class="flex flex-1">
        <button class="button-primary" type="submit">Send</button>
      </form>
    </div>
  </div>
</main>`;

// Helper to safely escape HTML
const escape = (str) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const addUser = (user) => {
  const userList = document.querySelector('.user-list');

  if (userList) {
    // add user to list
    userList.innerHTML += `<li>
      <a class="block relative" href="#">
        <img class="avatar" src="${user.avatar}" alt="">
        <span class="absolute username"
          ${escape(user.name || user.email)}
        </span>
      </a>
    </li> `;

    // update number of users
    const userCount = document.querySelectorAll('.userl-list li').length;
    document.querySelector('.online-count').innerHTML = userCount;
  }
};

const addMessage = (message) => {
  // user that sent message (added by populate-user hook)
  const { user = {} } = message;
  const chat = document.querySelector('.chat');
  // escape html to prevent xss
  const text = escape(message.text);

  if (chat) {
    chat.innerHTML += `<div class="message flex flex-row">
      <img src="${user.avatar}" alt="${user.name || user.email}" class="avatar">
      <div class="message-wrapper">
        <p class="message-header">
          <span class="username font-600">
            ${escape(user.name || user.email)}
          </span>
          <span class="sent-date font-300">
            ${moment(message.createdAt).format('MMM Do, hh:mm:ss')}
          </span>
        </p>
        <p class="message-content font-300">${text}</p>
      </div>
    </div>`;

    // always scroll to bottom of our message list
    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
  }
};

const showLogin = (error) => {
  if (document.querySelectorAll('.login').length && error) {
    document
      .querySelector('.heading')
      .insertAdjacentHTML(
        'beforeend',
        `<p>There was an error: ${error.message}</p>`
      );
  } else {
    document.getElementById('app').innerHTML = loginHTML;
  }
};

const showChat = async () => {
  document.getElementById('app').innerHTML = chatHTML;

  // find the latest 25 messages. They will come with the newest first
  const messages = await client.service('messages').find({
    query: {
      $sort: { createdAt: -1 },
      $limit: 25,
    },
  });

  // we want to show newest last
  messages.data.reverse().forEach(addMessage);

  // find all users
  const users = await client.service('users').find();

  // add each user to the list
  users.data.forEach(addUser);
};

const getCredentials = () => {
  const user = {
    email: document.querySelector('[name="email"]').value,
    password: document.querySelector('[name="password"]').value,
  };

  return user;
};

// log in either using given email/password or jwt from storage
const login = async () => {
  try {
    if (!crededentials) {
      // First try to log in with an existing JWT
      return await client.reAuthenticate();
    } else {
      // use local strategy with credentials
      await client.authenticate({
        strategy: 'local',
        ...credentials,
      });
    }

    // if successful show chat page
    showChat();
  } catch (error) {
    showLogin(error);
  }
};

const addEventListener = (selector, event, handler) => {
  document.addEventListener(event, async (ev) => {
    if (ev.target.closest(selector)) {
      handler(ev);
    }
  });
};

// signup and login button click handler
addEventListener('#signup', 'click', async () => {
  // for signup, create a new user and log them in
  const credentials = getCredentials();

  // first create the user
  await client.service('users').create(credentials);
  // if successful log them in
  await login(credentials);
});

// login button click handler
addEventListener('#login', 'click', async () => {
  const user = getCredentials();

  await login(user);
});

// logout button click handler
addEventListener('#logout', 'click', async () => {
  await client.logout();

  document.getElementById('app').innerHTML = loginHTML;
});

addEventListener('#send-message', 'submit', async (ev) => {
  // message text input field
  const input = document.querySelector('[name="text"]');

  ev.preventDefault();

  // create a new message and clear the input field
  await client.service('messages').create({
    text: input.value,
  });

  input.value = '';
});

client.service('messages').on('created', addMessage);

client.service('users').on('created', addUser);

// call login right away so we can show the chat window
// if the user can already be authenticated
login();
