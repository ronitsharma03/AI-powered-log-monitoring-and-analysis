import { createClient } from "redis";

const client = createClient();
export async function redisConnect() {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log(`Redis client on worker connected successfully`);
    }
    return client;
  } catch (error) {
    console.log(`Error connecting to the redis client: ${error}`);
    throw new Error(`Error: ${error}`);
  }
}

export { client as redisClient };