export class User {
  public static isValidProvider(provider: string) {
    // TODO
    return true;
  }

  public readonly name: string;
  public readonly provider: string;
  public readonly signature: string;
  public readonly hash: string;
  public readonly orbitHash: string;
  private isAuthorized: boolean = false;

  constructor(hash: string, name: string, provider: string, signature: string) {
    if (!User.isValidProvider(provider)) {
      throw new Error('invalid provider');
    }
    this.name = name;
    this.hash = name;
    this.orbitHash = hash;
    this.provider = provider;
    this.signature = signature;
    this.authorize();
  }

  public getAuthorizationStatus() {
    return this.isAuthorized;
  }

  private async authorize() {
    // TODO
    this.isAuthorized = true;
    return true;
  }
}
