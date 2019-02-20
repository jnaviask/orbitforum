import * as IPFS from 'ipfs';
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

function initOrbit(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (ORBITDB) {
      resolve(ORBITDB);
    }
    const ipfs = new IPFS({ EXPERIMENTAL: { pubsub: true }});
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
  const db = await orbit.open('/orbitdb/QmeovgZ6JeneF2qASACwbmPFK8KEwzCGxLF8fZGNrpLoF6/threads', {
    create: false,
    overwrite: false,
    replicate: true,
    localOnly: false,
  });
  console.log(db);
  db.events.on('write', () => {
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
