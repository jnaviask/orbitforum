import IPFS from 'ipfs';
import { default as OrbitDB } from 'orbit-db';
import app from 'state';
import { EventStore } from 'orbit-db-eventstore';
import { Thread } from 'models/thread';
import { Store } from 'orbit-db-store';

export function initOrbit(): OrbitDB {
  if (app.orbitdb) {
    return app.orbitdb;
  }
  const ipfs = new IPFS({});
  app.orbitdb = new OrbitDB(ipfs);
  return app.orbitdb;
}

// -------
// Threads
// -------

interface IThreadData {
  author: string;
  title: string;
}

export function createThreadsDb(): Promise<Store> {
  const db = initOrbit();
  return db.create('threads', 'eventlog', {
    write: ['*'],
  });
}

export async function makeThread(author: string, title: string) {
  const db = initOrbit();
  const log = await db.eventlog<IThreadData>('threads');
  return log.add({ author: author, title: title }).then(() => {
    console.log('thread added to ipfs store');
  });
}

export function subscribeThreads(): void {
  const db = initOrbit();
  db.eventlog<IThreadData>('threads').then((log: EventStore<IThreadData>) => {
    log.events.on('replicated', () => {
      const items = log.iterator({ limit: -1 }).collect().map((e) => {
        const data = e.payload.value;
        const author = data.author;
        const title = data.title;
        if (!app.threads.getByAuthorTitle(author, title)) {
          const thread = new Thread(author, title);
          app.threads.add(thread);
        }
      });
      console.log('got items: ', items);
    });
  });
}

// --------
// Comments
// --------

interface ICommentData {
  author: string;
  comment: string;
}

export function createCommentDb(thread: Thread): Promise<Store> {
  const db = initOrbit();
  return db.create(`thread.${thread.hash}`, 'eventlog', {
    write: ['*'],
  });
}

export async function makeComment(thread: Thread, author: string, comment: string): Promise<void> {
  const db = initOrbit();
  const log = await db.eventlog<ICommentData>(`proposal.${thread.hash}`);
  return log.add({ author: author, comment: comment }).then(() => {
    console.log('comment added to ipfs store');
  });
}

export function subscribeComments(thread: Thread): void {
  const db = initOrbit();
  const hash = thread.hash;
  db.eventlog<ICommentData>(`proposal.${hash}`).then((log: EventStore<ICommentData>) => {
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
