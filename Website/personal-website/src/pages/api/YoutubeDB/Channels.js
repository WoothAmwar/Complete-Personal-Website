// import { MongoClient } from 'mongodb';

// export default async function videoHandler(req, res) {
//   if (req.method === 'GET') {
//     const client = new MongoClient(process.env.MONGODB_URI);

//     try {
//       await client.connect();
//       const database = client.db('youtube'); // prod-yt/youtube

//       const collection = database.collection('channels'); // prod-yt/youtube/channels

//       const result = await collection.find({}).toArray();
//       // TODO - filter out result so only keeps the channels that are in the upload schedule for the signed-in user
      
//       if (result) {
//         res.status(201).json({ message: 'Data gotten successfully!', data: result});
//       } else {
//         res.status(404).json({ message: 'Data not found!' });
//       }
//     } catch (error) {
//       res.status(500).json({ message: 'Something went wrong!', data:req.query });
//     } finally {
//       await client.close();
//     }
//   } else {
//     res.status(405).json({ message: 'Method not allowed!' });
//   }
// }
