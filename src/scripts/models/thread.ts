export function hashCode(s: string): number {
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

class ThreadComment {
  public author: string;
  public text: string;
  constructor(author: string, text: string) {
    this.author = author;
    this.text = text;
  }
}

export class Thread {
  public author: string;
  public title: string;
  public hash: string;
  public comments: ThreadComment[];

  constructor(author: string, title: string) {
    this.author = author;
    this.title = title;
    // TODO: make this include a time as well
    this.hash = '' + hashCode(author + title);
    this.comments = [];
  }

  public addComment(author, text) {
    this.comments.push(new ThreadComment(author, text));
  }
}
