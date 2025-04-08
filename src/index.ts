
import * as dotenv from 'dotenv';

if (!process.env.HEROKU) {
  const envPath = process.env.NODE_ENV === 'development'
      ? '.env.development'
      : '.env.production';
  dotenv.config({ path: envPath });
}

import { startServer } from "./server"; // Import the startServer function from server.ts

async function start() {
  try {
    const server = await startServer();
    const port = process.env.PORT || 4000;
    server.listen({ port }, () => {
      console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
}

start();
