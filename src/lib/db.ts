import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('Missing environment variable: MONGODB_URI')
}

// Cache connection across hot-reloads in dev and across requests in prod
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined
}

async function getClient(): Promise<MongoClient> {
  if (!global._mongoClient) {
    const client = new MongoClient(uri!)
    try {
      await client.connect()
    } catch (err) {
      // Don't cache a client that failed to connect
      await client.close().catch(() => {})
      throw err
    }
    global._mongoClient = client
  }
  return global._mongoClient
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  return client.db(process.env.MONGODB_DB || 'portfolio')
}
