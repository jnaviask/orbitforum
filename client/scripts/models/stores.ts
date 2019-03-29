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
}
