const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
import { Thread } from '../models/thread';
import { ThreadsStore } from '../models/stores';

const ipfsOptions = {
  start: true,
  EXPERIMENTAL: {
    pubsub: true
  },
  relay: {
    enabled: true, // enable circuit relay dialer and listener
    hop: {
      enabled: true // enable circuit relay HOP (make this node a relay)
    }
  },
  pubsub: true
};

const dbAccess = {
  // Give write access to everyone
  write: ['*']
};

const MASTER_MULTIADDR = '/ip4/18.224.5.129/tcp/4003/ws/ipfs/QmXowghbaSpMu9esJGZy18nNjKnovmpaB1bUKg6hbvCzPW';

interface IThreadData {
  author: string;
  title: string;
}

interface ICommentData {
  author: string;
  comment: string;
}

export class ForumDatabase {
  public readonly threadStore: ThreadsStore = new ThreadsStore();

  private orbitDb = null;
  private threadDb = null;
  private maxThreadHash = null;
  private readonly commentDbs: object = {};
  private readonly maxCommentHash: object = {};
  private commentHandler: () => void;
  private threadHandler: () => void;
  private address: string;
  private isMaster: boolean;

  constructor(isMaster: boolean, threadHandler: () => void, commentHandler: () => void, address?: string) {
    this.isMaster = isMaster;
    this.threadHandler = threadHandler;
    this.commentHandler = commentHandler;
    this.address = address;
  }

  public getAddress(): string {
    return this.address;
  }

  public async drop(thread?: Thread) {
    if (!thread) {
      // drop everything
      for (const commentdb of Object.values(this.commentDbs)) {
        await commentdb.drop();
      }
      for (const addr of Object.keys(this.commentDbs)) {
        delete this.commentDbs[addr];
      }
      for (const addr of Object.keys(this.maxCommentHash)) {
        delete this.maxCommentHash[addr];
      }
      await this.threadDb.drop();
      this.threadDb = null;
      thread.comments = [];
      this.commentHandler();
    } else {
      await this.commentDbs[thread.hash].drop();
      delete this.commentDbs[thread.hash];
      this.maxThreadHash = null;
      this.threadStore.clear();
      this.threadHandler();
    }
  }

  public async makeThread(author: string, title: string) {
    const db = await this.getThreadDb();
    const threadObj: IThreadData = { author: author, title: title };
    return db.add(threadObj).then(() => {
      console.log(`thread ${author}:${title} added to ipfs store`);
    });
  }

  public async initThreads(): Promise<Thread[]> {
    const db = await this.getThreadDb();
    const options = { limit: -1, gt: undefined };
    if (this.maxThreadHash) {
      options.gt = this.maxThreadHash;
    }
    const items = db.iterator(options).collect();
    if (items.length > 0) {
      this.maxThreadHash = items[items.length - 1].hash;
    }
    const threads: Array<Promise<Thread>> = items.map(async (e) => {
      const hash = e.hash;
      const data: IThreadData = e.payload.value;
      const author = data.author;
      const title = data.title;
      let thread = this.threadStore.getByHash(hash);
      if (!thread) {
        thread = new Thread(hash, author, title);
        this.threadStore.add(thread);
        await this.initComments(thread);
      }
      return thread;
    });
    return Promise.all(threads);
  }

  public async makeComment(thread: Thread, author: string, comment: string): Promise<void> {
    const db = await this.getCommentsDb(thread);
    const commentObj: ICommentData = { author: author, comment: comment };
    return db.add(commentObj).then(() => {
      console.log(`comment ${author}:${comment} added to ipfs store`);
    });
  }

  public async initComments(thread: Thread): Promise<ICommentData[]> {
    const db = await this.getCommentsDb(thread);
    const options = { limit: -1, gt: undefined };
    if (this.maxCommentHash[thread.hash]) {
      options.gt = this.maxCommentHash[thread.hash];
    }
    const items = db.iterator(options).collect();
    if (items.length > 0) {
      this.maxCommentHash[thread.hash] = items[items.length - 1].hash;
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

  private initOrbit(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.orbitDb) {
        resolve(this.orbitDb);
        return;
      }
      const ipfs = new IPFS(ipfsOptions);
      // AWS box
      ipfs.bootstrap.add('/ip4/18.224.5.129/tcp/4003/ws/ipfs/QmXowghbaSpMu9esJGZy18nNjKnovmpaB1bUKg6hbvCzPW');
      ipfs.on('error', (err) => {
        reject(err);
      });
      ipfs.on('ready', async () => {
        if (!this.isMaster) {
          await ipfs.swarm.connect(MASTER_MULTIADDR);
        }
        console.log('orbitdb ready');
        this.orbitDb = new OrbitDB(ipfs);
        resolve(this.orbitDb);
      });
    });
  }

  private async getThreadDb() {
    const orbit = await this.initOrbit();
    if (!this.threadDb) {
      const createNew = !this.address;
      if (createNew) {
        this.threadDb = await orbit.eventlog('forum.threads', dbAccess);
      } else {
        // TODO: debug why this address doesn't work
        const address = `/orbitdb/${this.address}/forum.threads`;
        if (!OrbitDB.isValidAddress(address)) {
          throw new Error('invalid address');
        }
        this.threadDb = await orbit.eventlog(address, dbAccess);
      }

      // install event handler
      this.threadDb.events.on('write', async (addr) => {
        const threads = await this.initThreads();
        console.log('invoking thread handler');
        this.threadHandler();
      });
      this.threadDb.events.on('replicated', async (addr) => {
        const threads = await this.initThreads();
        console.log(`replicated database ${addr} with peer`);
        this.threadHandler();
      });
      this.threadDb.events.on('closed', (addr) => {
        console.log(`database ${addr} has closed`);
      });

      await this.threadDb.load();
      if (createNew) {
        this.address = this.threadDb.address.root;
        console.log(`created new forum with address: ${this.address}`);
      } else {
        console.log(`got existing forum with address: ${this.threadDb.id}`);
      }
    }
    return this.threadDb;
  }

  private async getCommentsDb(thread: Thread) {
    const orbit = await this.initOrbit();
    if (!this.commentDbs[thread.hash]) {
      // we need to use the base-58 hash here, because orbitdb only accepts b58
      // strings as database names.
      const logName = `forum.comments.${thread.b58hash}`;
      this.commentDbs[thread.hash] = await orbit.eventlog(logName, dbAccess);

      this.commentDbs[thread.hash].events.on('write', async (addr) => {
        const comments = await this.initComments(thread);
        console.log('invoking comment handler');
        this.commentHandler();
      });
      this.commentDbs[thread.hash].events.on('replicated', async (addr) => {
        const comments = await this.initComments(thread);
        console.log(`replicated database ${addr} with peer`);
        this.commentHandler();
      });
      this.commentDbs[thread.hash].events.on('closed', (addr) => {
        console.log(`database ${addr} has closed`);
      });

      await this.commentDbs[thread.hash].load();
    }
    return this.commentDbs[thread.hash];
  }
}
