import { MongoClient } from 'mongodb'

const uri = process.env.MONGO_URI
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}

let client
let clientPromise

if (!process.env.MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function GET(req) {
  try {
    const client = await clientPromise
    const db = client.db('starlink')
    const speedData = await db.collection('speedData').find({}).toArray()
    return new Response(JSON.stringify(speedData), { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Failed to fetch data.' }), { status: 500 })
  }
}

export async function POST(req) {
  try {
    const data = await req.json()
    const { latitude, longitude, downloadSpeed, uploadSpeed, equipment, name } = data

    const newEntry = {
      location: latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : [0, 0],
      downloadSpeed: parseFloat(downloadSpeed),
      uploadSpeed: parseFloat(uploadSpeed),
      equipment,
      name: name.trim() || 'Elongated Muskrat',
      createdAt: new Date(),
    }

    const client = await clientPromise
    const db = client.db('starlink')
    const result = await db.collection('speedData').insertOne(newEntry)
    return new Response(JSON.stringify(newEntry), { status: 201 })
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Failed to submit data.' }), { status: 500 })
  }
}

// No changes required for backend to enforce single submission per session.
// Submission restrictions are managed on the frontend using sessionStorage.