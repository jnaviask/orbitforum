export abstract class Hashable {
  public readonly hash: string;
}

export class Store<T extends Hashable> {
  private _store: T[];
  private _storeHash: { [hash: string]: T };

  constructor() {
    this._store = [];
    this._storeHash = {};
  }
  public add(t: T): Store<T> {
    this._store.push(t);
    this._storeHash[t.hash] = t;
    return this;
  }
  public getAll(): T[] {
    return this._store;
  }
  public getByHash(hash: string): T {
    return this._storeHash[hash];
  }
  public remove(t: T): Store<T> {
    const index = this._store.indexOf(t);
    if (index > -1) {
      this._store.splice(index, 1);
    }
    return this;
  }
  public clear(): void {
    this._store = [];
    this._storeHash = {};
  }
  public size(): number {
    return this._store.length;
  }
}
