declare module 'firebase-admin' {
  interface App {
    name: string;
  }
  interface Credential {}
  interface ServiceAccount {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  }
  interface Messaging {
    sendEachForMulticast(message: any): Promise<any>;
  }
  const apps: App[];
  function initializeApp(options?: any): App;
  function messaging(): Messaging;
  const credential: {
    cert(serviceAccount: ServiceAccount | string | object): Credential;
  };
  export { apps, initializeApp, messaging, credential };
  export default { apps, initializeApp, messaging, credential } as any;
}
