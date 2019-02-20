import { default as IPFS } from 'ipfs';
import { default as OrbitDB } from 'orbit-db';
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

function initOrbit(): OrbitDB {
  if (ORBITDB) {
    return ORBITDB;
  }
  const ipfs = new IPFS({});
  ORBITDB = new OrbitDB(ipfs);
  return ORBITDB;
}

interface IThreadData {
  author: string;
  title: string;
}

function subscribeThreads(): void {
  const db = initOrbit();
  db.eventlog<IThreadData>('threads').then((log: EventStore<IThreadData>) => {
    log.events.on('replicated', () => {
      console.log('replicated threads');
      const items = log.iterator({ limit: -1 }).collect().map((e) => {
        const data = e.payload.value;
        const author = data.author;
        const title = data.title;
        const hash = '' + hashCode(author + title);
        if (!THREADS[hash]) {
          THREADS[hash] = subscribeComments(hash);
        }
      });
    });
  });
}

function subscribeComments(hash: string): void {
  const db = initOrbit();
  db.eventlog(`thread.${hash}`).then((log) => {
    log.events.on('replicated', () => {
      console.log(`replicated comments for ${hash}`);
    });
  });
}

subscribeThreads();
