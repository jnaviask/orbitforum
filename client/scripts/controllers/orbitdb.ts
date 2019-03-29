const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
import { Thread } from '../models/thread';
import { ThreadsStore } from '../models/stores';

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
};

let ORBITDB = null;
let THREADDB = null;
let MAXTHREADHASH = null;
const COMMENTDBS = {};
const MAXCOMMENTHASH = {};
const THREADSTORE = new ThreadsStore();

let COMMENTHANDLER = null;

function initOrbit(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (ORBITDB) {
      resolve(ORBITDB);
      return;
    }
    const ipfs = new IPFS(ipfsOptions);
    ipfs.on('error', (err) => {
      reject(err);
    });
    ipfs.on('ready', () => {
      console.log('orbitdb ready');
      ORBITDB = new OrbitDB(ipfs);
      resolve(ORBITDB);
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

async function getThreadDb() {
  const orbit = await initOrbit();
  if (!THREADDB) {
    THREADDB = await orbit.eventlog('forum.threads');
    await THREADDB.load();
  }
  return THREADDB;
}

export async function makeThread(author: string, title: string) {
  const db = await getThreadDb();
  return db.add({ author: author, title: title }).then(() => {
    console.log(`thread ${author}:${title} added to ipfs store`);
  });
}

export async function loadThreads(): Promise<Thread[]> {
  const db = await getThreadDb();
  const options = { limit: -1, gt: undefined };
  if (MAXTHREADHASH) {
    options.gt = MAXTHREADHASH;
  }
  const items = db.iterator(options).collect();
  if (items.length > 0) {
    MAXTHREADHASH = items[items.length - 1].hash;
  }
  const threads: Array<Promise<Thread>> = items.map(async (e) => {
    const hash = e.hash;
    const data: IThreadData = e.payload.value;
    const author = data.author;
    const title = data.title;
    let thread = THREADSTORE.getByHash(hash);
    if (!thread) {
      thread = new Thread(hash, author, title);
      THREADSTORE.add(thread);
      await addCommentEventHandler(thread, COMMENTHANDLER);
      await loadComments(thread);
    }
    return thread;
  });
  return Promise.all(threads);
}

// --------
// Comments
// --------

async function getCommentsDb(thread: Thread) {
  const orbit = await initOrbit();
  if (!COMMENTDBS[thread.hash]) {
    // we need to use the base-58 hash here, because orbitdb only accepts b58
    // strings as database names.
    const logName = `forum.comments.${thread.b58hash}`;
    COMMENTDBS[thread.hash] = await orbit.eventlog(logName);
    await COMMENTDBS[thread.hash].load();
  }
  return COMMENTDBS[thread.hash];
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

async function loadComments(thread: Thread): Promise<ICommentData[]> {
  const db = await getCommentsDb(thread);
  const options = { limit: -1, gt: undefined };
  if (MAXCOMMENTHASH[thread.hash]) {
    options.gt = MAXCOMMENTHASH[thread.hash];
  }
  const items = db.iterator(options).collect();
  if (items.length > 0) {
    MAXCOMMENTHASH[thread.hash] = items[items.length - 1].hash;
  }
  return items.map((e) => {
    const hash = e.hash;
    const data: ICommentData = e.payload.value;
    const comment = data.comment;
    const author = data.author;
    thread.addComment(hash, author, comment);
    return data;
  });
}

async function addCommentEventHandler(thread, handler) {
  const db = await getCommentsDb(thread);
  db.events.on('write', async (addr) => {
    const comments = await loadComments(thread);
    console.log('invoking comment handler');
    handler(comments);
  });
}

export async function addEventHandlers(threadHandler, commentHandler) {
  const db = await getThreadDb();
  db.events.on('write', async (addr) => {
    const threads = await loadThreads();
    threadHandler(threads);
  });
  COMMENTHANDLER = commentHandler;
}

export function getThreadStore() {
  return THREADSTORE;
}
