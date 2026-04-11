import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI as string

// Cache connection across hot-reloads in dev and across requests in prod
declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined
}

async function getClient(): Promise<MongoClient> {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri)
    await global._mongoClient.connect()
  }
  return global._mongoClient
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  return client.db(process.env.MONGODB_DB || 'portfolio')
}
