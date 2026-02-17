import { MongoClient, Db } from 'mongodb'
import {
  MONGO_USER,
  MONGO_SECRET,
  MONGO_URL,
  MONGO_DB,
} from '../config'

let client: MongoClient | null = null
let db: Db | null = null

export async function connectDb(): Promise<Db> {
  if (db) return db

  const uri = process.env.MONGODB_URI || `mongodb+srv://${MONGO_USER}:${MONGO_SECRET}${MONGO_URL}`
  client = new MongoClient(uri, {
    maxPoolSize: 5,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
  })

  await client.connect()
  db = client.db(MONGO_DB)
  console.log(`[DB] Connected to ${MONGO_DB}`)
  return db
}

export async function getDb(): Promise<Db> {
  if (!db) return connectDb()
  return db
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
