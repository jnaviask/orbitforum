import { Thread } from './thread';

export class ThreadsStore {
  private _store: Thread[];
  private _storeHash: { [hash: string]: Thread };

  constructor() {
    this._store = [];
    this._storeHash = {};
  }
  public add(thread: Thread) {
    this._store.push(thread);
    this._storeHash[thread.hash] = thread;
  }
  public getAll() {
    return this._store;
  }
  public getByHash(hash: string) {
    return this._storeHash[hash];
  }
  public remove(thread: Thread) {
    const index = this._store.indexOf(thread);
    if (index > -1) {
      this._store.splice(index, 1);
    }
  }
  public clear() {
    this._store = [];
    this._storeHash = {};
  }
  public size() {
    return this._store.length;
  }
}
