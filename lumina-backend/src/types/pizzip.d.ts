declare module 'pizzip' {
  interface PizZipFile {
    asText(): string;
    asNodeBuffer(): Buffer;
  }

  export default class PizZip {
    constructor(data: Buffer);
    file(path: string): PizZipFile | null;
  }
}
