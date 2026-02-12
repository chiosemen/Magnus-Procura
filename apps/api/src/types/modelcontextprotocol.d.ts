declare module '@modelcontextprotocol/sdk/client/index.js' {
  export interface Client {
    connect: (...args: unknown[]) => Promise<unknown>;
  }

  export const Client: {
    new (...args: unknown[]): Client;
  };
}
