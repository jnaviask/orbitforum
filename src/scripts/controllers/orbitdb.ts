import * as IPFS from 'ipfs';
const OrbitDB = require('orbit-db')
import app from 'state';
import { EventStore } from 'orbit-db-eventstore';
import { Thread } from 'models/thread';
import { Store } from 'orbit-db-store';

export function initOrbit(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (app.orbitdb) {
      resolve(app.orbitdb);
    }
    const ipfs = new IPFS({ EXPERIMENTAL: { pubsub: true }});
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

export async function makeThread(addr, author: string, title: string) {
  const orbit = await initOrbit();
  const db = await orbit.eventlog(addr);
  return db.add({ author: author, title: title }).then(() => {
    console.log('thread added to ipfs store');
  });
}

export async function subscribeThreads() {
  const orbit = await initOrbit();
  console.log(orbit);
  // const db = await orbit.create('threads', 'eventlog', { });
  const db = await orbit.open('/orbitdb/QmeovgZ6JeneF2qASACwbmPFK8KEwzCGxLF8fZGNrpLoF6/threads', {
    create: false,
    overwrite: false,
    replicate: true,
    localOnly: false,
  });
  console.log(db);
  db.events.on('write', () => {
    console.log('write');
    const items = db.iterator({ limit: -1 }).collect().map((e) => {
      const data: IThreadData = e.payload.value;
      const author = data.author;
      const title = data.title;
      if (!app.threads.getByAuthorTitle(author, title)) {
        const thread = new Thread(author, title);
        app.threads.add(thread);
        subscribeComments(thread);
      }
    });
  });
  app.threaddb = db.address;
  return db.address;
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
  return db.create(`thread.${thread.hash}`, 'eventlog', {
    write: ['*'],
  });
}

export async function makeComment(thread: Thread, author: string, comment: string): Promise<void> {
  const db = await initOrbit();
  const log = await db.eventlog(`thread.${thread.hash}`);
  return log.add({ author: author, comment: comment }).then(() => {
    console.log('comment added to ipfs store');
  });
}

export async function subscribeComments(thread: Thread) {
  const db = await initOrbit();
  const hash = thread.hash;
  db.eventlog(`thread.${hash}`).then((log: EventStore<ICommentData>) => {
    log.events.on('replicated', () => {
      const items = log.iterator({ limit: -1 }).collect().map((e) => {
        const data = e.payload.value;
        const comment = data.comment;
        const author = data.author;
        thread.addComment(author, comment);
      });
      console.log('got items: ', items);
    });
  });
}
