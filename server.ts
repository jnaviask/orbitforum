const IPFS = require('ipfs')
const OrbitDB = require('orbit-db')
import { EventStore } from 'orbit-db-eventstore';

function hashCode(s: string): number {
  let hash = 0;
  if (s.length === 0) {
    return hash;
  }
  for (let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash;
}

const THREADS = {};
let ORBITDB = null;

const ipfsOptions = {
  EXPERIMENTAL: {
    pubsub: true
  }
};

function initOrbit(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (ORBITDB) {
      resolve(ORBITDB);
    }
    const ipfs = new IPFS(ipfsOptions);
    ipfs.on('error', (err) => {
      reject(err);
    });
    ipfs.on('ready', () => {
      ORBITDB = new OrbitDB(ipfs);
      resolve(ORBITDB);
    });
  });
}

interface IThreadData {
  author: string;
  title: string;
}

async function subscribeThreads() {
  const orbit = await initOrbit();
  const db = await orbit.log('/orbitdb/QmYUPrGcEkWceFyGRpfdMnQK9E2ZHjxzGnW5i8HbiQ35Uj/threads');
  await db.load();
  console.log(db.events);
  db.events.on('replicated', () => {
    console.log('replicated threads');
    const items = db.iterator({ limit: -1 }).collect().map((e) => {
      const data = e.payload.value;
      const author = data.author;
      const title = data.title;
      const hash = '' + hashCode(author + title);
      if (!THREADS[hash]) {
        //THREADS[hash] = subscribeComments(hash);
      }
    });
  });
}
/*
function subscribeComments(hash: string): void {
  const db = initOrbit();
  db.eventlog(`thread.${hash}`).then((log) => {
    log.events.on('replicated', () => {
      console.log(`replicated comments for ${hash}`);
    });
  });
}
*/
subscribeThreads();
