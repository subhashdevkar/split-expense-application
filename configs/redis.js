import Redis from "ioredis";

const redis = new Redis({
  maxRetriesPerRequest: null,
  // host: process.env.REDIS_HOST,
  // port: parseInt(process.env.REDIS_PORT),
});
//   {
//   host: process.env.REDIS_HOST,
//   port: process.env.REDIS_PORT,
// }
redis.on("error", (err) => console.log("redis error:", err));
redis.on("connect", () => console.log("Redis connected"));
export default redis;
