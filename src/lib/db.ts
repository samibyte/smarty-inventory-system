import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import type { Database } from "@/types";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "smart_inventory";
const LEGACY_DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), "data", "db.json");
const COLLECTION_NAME = "app_state";
const DOC_ID = "singleton";

const defaultDb: Database = {
  users: [],
  categories: [],
  products: [],
  orders: [],
  restockQueue: [],
  activityLogs: [],
  meta: { orderCounter: 1000 },
};

declare global {
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClient(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global.mongoClientPromise) {
      const client = new MongoClient(MONGODB_URI);
      global.mongoClientPromise = client.connect();
    }
    return global.mongoClientPromise;
  }

  return new MongoClient(MONGODB_URI).connect();
}

function getDefaultDbCopy(): Database {
  return JSON.parse(JSON.stringify(defaultDb)) as Database;
}

function readLegacyDbFromFile(): Database | null {
  try {
    if (!fs.existsSync(LEGACY_DB_PATH)) {
      return null;
    }
    const raw = fs.readFileSync(LEGACY_DB_PATH, "utf-8");
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

export async function readDb(): Promise<Database> {
  try {
    const client = await getMongoClient();
    const collection = client
      .db(MONGODB_DB_NAME)
      .collection<Database & { _id: string }>(COLLECTION_NAME);

    const stored = await collection.findOne({ _id: DOC_ID });
    if (stored) {
      const { _id: _ignored, ...data } = stored;
      return data;
    }

    const seeded = readLegacyDbFromFile() ?? getDefaultDbCopy();
    await collection.updateOne(
      { _id: DOC_ID },
      { $set: seeded },
      { upsert: true },
    );
    return seeded;
  } catch {
    return getDefaultDbCopy();
  }
}

export async function writeDb(data: Database): Promise<void> {
  const client = await getMongoClient();
  const collection = client
    .db(MONGODB_DB_NAME)
    .collection<Database & { _id: string }>(COLLECTION_NAME);
  await collection.updateOne({ _id: DOC_ID }, { $set: data }, { upsert: true });
}
