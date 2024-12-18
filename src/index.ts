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
