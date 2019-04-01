const IPFS = require('ipfs');
const OrbitDB = require('orbit-db');
import { Thread } from '../models/thread';
import { Store } from '../models/stores';
import { User } from 'models/user';
import { write } from 'fs';

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

const MASTER_MULTIADDR = '/ip4/18.224.5.129/tcp/4003/ws/ipfs/QmXowghbaSpMu9esJGZy18nNjKnovmpaB1bUKg6hbvCzPW';
let ORBITDB = null;
function initOrbit(isMaster: boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    if (ORBITDB) {
      resolve(ORBITDB);
      return;
    }
    const ipfs = new IPFS(ipfsOptions);
    // AWS box
    ipfs.bootstrap.add(MASTER_MULTIADDR);
    ipfs.on('error', (err) => {
      reject(err);
    });
    ipfs.on('ready', async () => {
      if (!isMaster) {
        await ipfs.swarm.connect(MASTER_MULTIADDR);
      }
      console.log('orbitdb ready');
      ORBITDB = new OrbitDB(ipfs);
      resolve(ORBITDB);
    });
  });
}

const dbAccess = {
  // Give write access to everyone
  write: ['*']
};

interface IThreadData {
  author: string;
  title: string;
}

interface ICommentData {
  author: string;
  comment: string;
}

interface IUserData {
  name: string;
  provider: string;
  signature: string;
}

class EventlogDatabase<T> {
  private db = null;
  private dbName: string;
  private maxHash: string = null;
  private writeHandler: (hash: string, item: T) => Promise<void>;
  private writeFinishedHandler: () => void;
  private address: string;
  private isMaster: boolean;

  // these data members allow us to synchronize actions based on refreshes,
  // which happen according to database events. The intent of this is to permit
  // a flow where we create a user then are notified when the created user
  // has been added to the corresponding store.

  // has an item recently been added to the db?
  private isRefreshPending: boolean;

  // a promise resolved when the db refresh has completed
  private pendingRefresh: Promise<void>;

  // a function that resolves above promise
  private resolvePendingRefresh: () => void;

  constructor(
    dbName: string,
    isMaster: boolean,
    writeHandler: (hash: string, item: T) => Promise<void>,
    writeFinishedHandler: () => void,
    address?: string
  ) {
    this.dbName = dbName;
    this.isMaster = isMaster;
    this.writeHandler = writeHandler;
    this.writeFinishedHandler = writeFinishedHandler;
    this.address = address;
    this.isRefreshPending = true;
    this.pendingRefresh = null;
  }

  public getAddress() {
    return this.address;
  }

  public getPendingRefresh() {
    if (this.isRefreshPending) {
      this.pendingRefresh = new Promise((resolve, reject) => {
        this.resolvePendingRefresh = () => {
          this.isRefreshPending = false;
          resolve();
        };
      });
      return this.pendingRefresh;
    } else {
      this.pendingRefresh = null;
      this.resolvePendingRefresh = null;
      return Promise.resolve();
    }
  }

  public async add(obj: T): Promise<void> {
    this.isRefreshPending = true;
    const db = await this.getDb();
    // TODO: Make this await?
    return db.add(obj).then(() => {
      // console.log('updated ipfs store');
    });
  }

  public async refresh() {
    const db = await this.getDb();
    const options = { limit: -1, gt: undefined };
    if (this.maxHash) {
      options.gt = this.maxHash;
    }
    const items = db.iterator(options).collect();
    let writes = [];
    if (items && items.length > 0) {
      this.maxHash = items[items.length - 1].hash;
      const writePromises = items.map(async (e) => {
        return await this.writeHandler(e.hash, e.payload.value);
      });
      writes = await Promise.all(writePromises);
    }
    if (this.pendingRefresh) {
      this.resolvePendingRefresh();
    }
    return writes;
  }

  public async close() {
    return await this.db.close();
  }

  public async getDb() {
    const orbit = await initOrbit(this.isMaster);
    if (!this.db) {
      const createNew = !this.address;
      if (createNew) {
        this.db = await orbit.eventlog(this.dbName, dbAccess);
      } else {
        const address = `/orbitdb/${this.address}/${this.dbName}`;
        if (!OrbitDB.isValidAddress(address)) {
          throw new Error('invalid address');
        }
        this.db = await orbit.eventlog(address, dbAccess);
      }

      // install event handlers
      this.db.events.on('write', async (addr) => {
        const items = await this.refresh();
        console.log(`write received, found ${items.length} new items`);
        this.writeFinishedHandler();
      });
      this.db.events.on('replicated', async (addr) => {
        const items = await this.refresh();
        console.log(`replicated database ${addr} with peer, found ${items.length} new threads`);
        this.writeFinishedHandler();
      });
      this.db.events.on('closed', (addr) => {
        console.log(`database ${addr} has closed`);
      });

      await this.db.load();
      if (createNew) {
        this.address = this.db.address.root;
        console.log(`created new db with address: ${this.address}`);
      } else {
        console.log(`got existing db with address: ${this.db.id}`);
      }
    }
    return this.db;
  }
}

function commentWriteHandler(thread: Thread, hash: string, data: ICommentData) {
  const comment = data.comment;
  const author = data.author;
  thread.addComment(hash, author, comment);
}

async function threadWriteHandler(hash: string, data: IThreadData) {
  const author = data.author;
  const title = data.title;
  let thread = this.threadStore.getByHash(hash);
  if (!thread) {
    thread = new Thread(hash, author, title);
    this.threadStore.add(thread);
    // TODO: consider moving this elsewhere, perhaps a separate comments
    // store rather than attaching each to the thread
    this.commentDbs[thread.hash] = new EventlogDatabase(
      `forum.comments.${thread.b58hash}`,
      this.isMaster,
      commentWriteHandler.bind(this, thread),
      this.writeFinishedHandler,
      this.getAddress()
    );
    await this.commentDbs[thread.hash].refresh();
  }
}

function userWriteHandler(hash: string, data: IUserData) {
  let user = this.userStore.getByHash(data.name);
  if (!user) {
    user = new User(hash, data.name, data.provider, data.signature);
    this.userStore.add(user);
  }
}

export class ForumDatabase {
  public readonly threadStore = new Store<Thread>();
  public readonly userStore = new Store<User>();

  private readonly commentDbs: { [hash: string]: EventlogDatabase<ICommentData> } = {};
  private readonly writeFinishedHandler: () => void;
  private readonly isMaster: boolean;

  private threadDb: EventlogDatabase<IThreadData>;
  private userDb: EventlogDatabase<IUserData>;
  private address: string;

  constructor(isMaster: boolean, writeFinishedHandler: () => void, address?: string) {
    this.isMaster = isMaster;
    this.writeFinishedHandler = writeFinishedHandler;
    this.address = address;
    this.commentDbs = {};
  }

  public async init() {
    this.userDb = new EventlogDatabase(
      'forum.user',
      this.isMaster,
      userWriteHandler.bind(this),
      this.writeFinishedHandler,
      this.address
    );

    // init the first db to get the global address, if needed
    await this.userDb.getDb();
    if (!this.address) {
      this.address = this.userDb.getAddress();
    }
    this.threadDb = new EventlogDatabase(
      'forum.threads',
      this.isMaster,
      threadWriteHandler.bind(this),
      this.writeFinishedHandler,
      this.address,
    );

    // populate the dbs
    await this.userDb.refresh();
    await this.threadDb.refresh();
  }

  public getAddress(): string {
    return this.address;
  }

  public async createThread(author: string, title: string) {
    const threadObj: IThreadData = { author: author, title: title };
    return this.threadDb.add(threadObj).then(() => {
      // console.log(`thread ${author}:${title} added to ipfs store`);
      return this.threadDb.getPendingRefresh();
    });
  }

  public async createComment(thread: Thread, author: string, comment: string): Promise<void> {
    const db = this.commentDbs[thread.hash];
    if (!db) {
      throw new Error('thread does not exist');
    }
    const commentObj: ICommentData = { author: author, comment: comment };
    return db.add(commentObj).then(() => {
      // console.log(`comment ${author}:${comment} added to ipfs store`);
      return db.getPendingRefresh();
    });
  }

  public async createUser(name: string, provider: string) {
    // names must be unique, we use them as store hashes to confirm
    if (this.userStore.getByHash(name)) {
      throw new Error('user already exists');
    }
    const userObj: IUserData = { name: name, provider: provider, signature: 'n/a' };
    return this.userDb.add(userObj).then(() => {
      // console.log(`user ${name} added to ipfs store`);
      return this.userDb.getPendingRefresh();
    });
  }
}
