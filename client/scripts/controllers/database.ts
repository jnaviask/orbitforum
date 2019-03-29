const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
import { Thread } from '../models/thread';
import { ThreadsStore } from '../models/stores';

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
};

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
  private readonly commentDbs = {};
  private readonly maxCommentHash = {};
  private commentHandler: () => void;
  private threadHandler: () => void;
  private address: string;

  constructor(address: string, threadHandler: () => void, commentHandler: () => void, createNew?) {
    this.address = address;
    this.threadHandler = threadHandler;
    this.commentHandler = commentHandler;

    // install event handler
    this.getThreadDb(createNew).then((db) => {
      db.events.on('write', async (addr) => {
        const threads = await this.loadThreads();
        this.threadHandler();
      });
    });
    console.log('end of constructor');
  }

  public getAddress(): string {
    return this.address;
  }

  public async makeThread(author: string, title: string) {
    const db = await this.getThreadDb();
    return db.add({ author: author, title: title }).then(() => {
      console.log(`thread ${author}:${title} added to ipfs store`);
    });
  }

  public async loadThreads(): Promise<Thread[]> {
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
        db.events.on('write', async (addr) => {
          const comments = await this.loadComments(thread);
          console.log('invoking comment handler');
          this.commentHandler();
        });
        await this.loadComments(thread);
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

  public async loadComments(thread: Thread): Promise<ICommentData[]> {
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
      ipfs.on('error', (err) => {
        reject(err);
      });
      ipfs.on('ready', () => {
        console.log('orbitdb ready');
        this.orbitDb = new OrbitDB(ipfs);
        resolve(this.orbitDb);
      });
    });
  }

  private async getThreadDb(createNew?) {
    const orbit = await this.initOrbit();
    if (!this.threadDb) {
      if (createNew) {
        this.threadDb = await orbit.eventlog('forum.threads');
      } else {
        // TODO: debug why this address doesn't work
        this.threadDb = await orbit.eventlog(`/orbitdb/${this.address}/orbitdb/forum.threads`);
      }
      await this.threadDb.load();
      if (createNew) {
        this.address = this.threadDb.uid;
        console.log(`created new forum with address: ${this.address}`);
      } else {
        console.log(`got new forum with address: ${this.threadDb.uid}`);
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
      this.commentDbs[thread.hash] = await orbit.eventlog(logName);
      await this.commentDbs[thread.hash].load();
    }
    return this.commentDbs[thread.hash];
  }
}
