const bs58 = require('bs58')

class ThreadComment {
  public author: string;
  public text: string;
  public hash: string;
  constructor(hash: string, author: string, text: string) {
    this.author = author;
    this.text = text;
    this.hash = hash;
  }
}

export class Thread {
  public author: string;
  public title: string;
  public hash: string;
  public b58hash: string;
  public comments: ThreadComment[];

  constructor(hash: string, author: string, title: string) {
    this.author = author;
    this.title = title;
    this.hash = hash;
    const buf = new Buffer(hash, 'base64');
    this.b58hash = bs58.encode(buf);
    this.comments = [];
  }

  public addComment(hash, author, text) {
    this.comments.push(new ThreadComment(hash, author, text));
  }
}
