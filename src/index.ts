import { server } from './server';


server.listen().then(({ url }: any) => {
  console.log(`🚀 Server ready at ${url}`);
});