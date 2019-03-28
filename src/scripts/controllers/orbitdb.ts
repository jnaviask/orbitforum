import * as m from 'mithril';
const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
import app from 'state';
import { EventStore } from 'orbit-db-eventstore';
import { Thread } from 'models/thread';
import { Store } from 'orbit-db-store';

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
};

export function initOrbit(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (app.orbitdb) {
      resolve(app.orbitdb);
      return;
    }
    const ipfs = new IPFS(ipfsOptions);
    ipfs.on('error', (err) => {
      reject(err);
    });
    ipfs.on('ready', () => {
      console.log('orbitdb ready');
      app.orbitdb = new OrbitDB(ipfs);
      resolve(app.orbitdb);
    });
  });
}

// -------
// Threads
// -------

interface IThreadData {
  author: string;
  title: string;
}

export async function getThreadDb() {
  const orbit = await initOrbit();
  if (!app.threaddb) {
    app.threaddb = await orbit.eventlog('forum.threads');
    await app.threaddb.load();
  }
  return app.threaddb;
}

export async function makeThread(author: string, title: string) {
  const db = await getThreadDb();
  return db.add({ author: author, title: title }).then(() => {
    console.log(`thread ${author}:${title} added to ipfs store`);
  });
}

function loadThreads(db) {
  const options = { limit: -1, gt: undefined };
  if (app.maxthreadhash) {
    options.gt = app.maxthreadhash;
  }
  const items = db.iterator(options).collect();
  if (items.length > 0) {
    app.maxthreadhash = items[items.length - 1].hash;
    items.map((e) => {
      const hash = e.hash;
      const data: IThreadData = e.payload.value;
      const author = data.author;
      const title = data.title;
      if (!app.threads.getByHash(hash)) {
        const thread = new Thread(hash, author, title);
        app.threads.add(thread);
        subscribeComments(thread);
      }
    });
  }
  m.redraw();
}

export async function subscribeThreads() {
  const db = await getThreadDb();
  loadThreads(db);
  db.events.on('write', (addr) => {
    console.log('write to: ', addr);
    loadThreads(db);
  });
}

// --------
// Comments
// --------

export async function getCommentsDb(thread: Thread) {
  const orbit = await initOrbit();
  if (!app.commentdbs[thread.hash]) {
    // we need to use the base-58 hash here, because orbitdb only accepts b58
    // strings as database names.
    const logName = `forum.comments.${thread.b58hash}`;
    app.commentdbs[thread.hash] = await orbit.eventlog(logName);
    await app.commentdbs[thread.hash].load();
  }
  return app.commentdbs[thread.hash];
}

interface ICommentData {
  author: string;
  comment: string;
}

export async function makeComment(thread: Thread, author: string, comment: string): Promise<void> {
  const db = await getCommentsDb(thread);
  const commentObj: ICommentData = { author: author, comment: comment };
  return db.add(commentObj).then(() => {
    console.log(`comment ${author}:${comment} added to ipfs store`);
  });
}

export async function loadComments(db, thread: Thread) {
  const options = { limit: -1, gt: undefined };
  if (app.maxcommenthash[thread.hash]) {
    options.gt = app.maxcommenthash[thread.hash];
  }
  const items = db.iterator(options).collect();
  if (items.length > 0) {
    app.maxcommenthash[thread.hash] = items[items.length - 1].hash;
    items.map((e) => {
      const hash = e.hash;
      const data: ICommentData = e.payload.value;
      const comment = data.comment;
      const author = data.author;
      thread.addComment(hash, author, comment);
      m.redraw();
    });
  }
}

export async function subscribeComments(thread: Thread) {
  const db = await getCommentsDb(thread);
  loadComments(db, thread);
  db.events.on('write', (addr) => {
    console.log('write to: ', addr);
    loadComments(db, thread);
  });
}
