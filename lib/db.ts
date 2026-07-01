import mongoose from 'mongoose';

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: Cached | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = { bufferCommands: false };

    let uri = process.env.MONGODB_URI;

    // Fall back to an in-memory MongoDB when no real server is configured.
    // This lets the app run out of the box without provisioning a database.
    if (!uri) {
      throw new Error("MONGODB_URI is missing in .env");
    }
    cached!.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export default connectDB;
