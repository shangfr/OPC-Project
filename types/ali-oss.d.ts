declare module 'ali-oss' {
  interface OSSConfig {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
  }
  
  interface PutOptions {
    name: string;
    content: Buffer;
  }
  
  class Client {
    constructor(config: OSSConfig);
    put(name: string, content: Buffer, options?: { headers?: { 'Content-Type'?: string } }): Promise<any>;
  }
  
  export default Client;
}
