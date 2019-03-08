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

export async function getDb() {
  const orbit = await initOrbit();
  if (!app.threaddb) {
    app.threaddb = await orbit.log('threads');
    await app.threaddb.load();
  }
  return app.threaddb;
}

export async function makeThread(author: string, title: string) {
  const db = await getDb();
  return db.add({ author: author, title: title }).then(() => {
    console.log(`thread ${author}:${title} added to ipfs store`);
  });
}

function iteratorThread(e) {
  const hash = e.hash;
  const data: IThreadData = e.payload.value;
  const author = data.author;
  const title = data.title;
  if (!app.threads.getByHash(hash)) {
    const thread = new Thread(hash, author, title);
    app.threads.add(thread);
    //subscribeComments(thread);
  }
}

function loadThreads(db) {
  const options = { limit: -1, gt: undefined };
  if (app.maxthreadhash) {
    options.gt = app.maxthreadhash;
  }
  const items = db.iterator(options).collect();
  if (items.length > 0) {
    app.maxthreadhash = items[items.length - 1].hash;
    items.map(iteratorThread);
  }
  m.redraw();
}

export async function subscribeThreads() {
  const db = await getDb();
  loadThreads(db);
  db.events.on('write', (addr) => {
    console.log('write to: ', addr);
    loadThreads(db);
  });
}

// --------
// Comments
// --------

interface ICommentData {
  author: string;
  comment: string;
}

export async function createCommentDb(thread: Thread): Promise<Store> {
  const db = await initOrbit();
  return db.create(`thread.${thread.hash}`, 'log', {
    write: ['*'],
  });
}

export async function makeComment(thread: Thread, author: string, comment: string): Promise<void> {
  const db = await initOrbit();
  const log = await db.log(`thread.${thread.hash}`);
  return log.add({ author: author, comment: comment }).then(() => {
    console.log('comment added to ipfs store');
  });
}

export async function subscribeComments(thread: Thread) {
  const db = await initOrbit();
  const hash = thread.hash;
  db.log(`thread.${hash}`).then((log: EventStore<ICommentData>) => {
    log.events.on('replicated', () => {
      const items = log.iterator({ limit: -1 }).collect().map((e) => {
        const hash = e.hash;
        const data = e.payload.value;
        const comment = data.comment;
        const author = data.author;
        thread.addComment(hash, author, comment);
      });
      console.log('got items: ', items);
    });
  });
}
