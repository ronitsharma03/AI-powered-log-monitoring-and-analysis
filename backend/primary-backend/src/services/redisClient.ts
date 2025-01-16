import { createClient } from "redis";

const client = createClient();
export async function redisConnect() {
  try {
    if (!client.isOpen) {
      await client.connect();
      console.log("Redis client connected successfully!");
    }
    return client;
  } catch (error) {
    console.log(`Error connecting to redis: ${error}`);
    throw new Error(`Error: ${error}`);
  }
}

export { client as redisClient };
