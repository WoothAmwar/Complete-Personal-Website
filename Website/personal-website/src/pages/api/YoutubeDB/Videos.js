// import { MongoClient } from 'mongodb';

// export default async function videoHandler(req, res) {
//   if (req.method === 'GET') {
//     const client = new MongoClient(process.env.MONGODB_URI);

//     try {
//       await client.connect();
//       const database = client.db('youtube'); // prod-yt/youtube

//       const collection = database.collection('channels'); // prod-yt/youtube/channels
//       const videos = database.collection('videos'); // prod-yt/youtube/videos
//       const result = await collection.find({}).toArray();
      
//       if (result) {
//         // Getting the unique Channel IDs
//         // TODO - check if the channelID is in the list of upload schedule for the specific user
//         var channelIdSet = new Set();
//         for (let index = 0; index < result.length; index++) {
//           channelIdSet.add(result[index]["channelId"]);
//         }
//         // Iterate through all Channel IDs and return json object
//         var vidSeparateID = [];
//         for (let item of channelIdSet) {
//           vidSeparateID.push(await videos.find({"channelId": item}).toArray())
//         }
//         res.status(201).json({ message: 'Data gotten successfully!', data: vidSeparateID});
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
