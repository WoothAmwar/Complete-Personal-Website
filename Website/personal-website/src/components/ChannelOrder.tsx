import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";

export default function OrderByChannel() {
  const [responseVideoData, setResponseVideoData] = useState<any []>([]);
  const [responseChannelData, setResponseChannelData] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  var wd = 360  // 480
  var ht = wd/480*270  // 270
  var embedLink = "/custom-youtube/";

  var finalRow = []; 

  
  useEffect(() => {
    async function fetchVideoData() {
      try { 
        console.log("DID THAT")
        const response = await fetch('/api/YoutubeDB/Videos', {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const fullRes = await response.json();
            setResponseVideoData(fullRes["data"]);
        } else {
            const data = await response.json();
            alert('Something went wrong!' + JSON.stringify(data));
        }
      }
      catch (err) {
        console.log("Error fetching video data from mongodb", err);
      }
      finally {
        setIsLoadingVideos(false);
      }
    }

    async function fetchChannelData() {
      try {
        console.log("DID THAT")
        const response = await fetch('/api/YoutubeDB/Channels', {
            method: 'GET',
            headers: {
            'Content-Type': 'application/json',
            },
        });
        if (response.ok) {
            const fullRes = await response.json();
            setResponseChannelData(fullRes["data"]);
        } else {
            const data = await response.json();
            alert('Something went wrong!' + JSON.stringify(data));
        }
      } catch (err) {
        console.log("Error fetching channels from mongodb", err);
      } finally {
        setIsLoadingChannels(false);
      }
    }

    fetchVideoData();
    fetchChannelData();
  }, []);

  if (isLoadingChannels || isLoadingVideos) {
    return ["Loading..."];
  }

  for (let i = 0; i < responseVideoData.length; i++) {
    let currRow = [];
    currRow.push(
      <div key={i} className="text-left">
        <img src={responseChannelData[i]["channelImages"]} alt="Channel Image" width={wd/2 - 30} height={ht/2 - 30} />
        <p className="font-['Helvetica'] text-2xl font-semibold">{responseChannelData[i]["channelNames"]}</p>
      </div>
    )
    for (let j = 0; j < responseVideoData[i].length; j++) {
      currRow.push(
        <Link key={i*3+j+1} className="mr-1 ml-1" href={embedLink.concat(responseVideoData[i][j]["videoId"])}>
          <img src={responseVideoData[i][j]["videoThumbnail"]} alt="Thumbnail" className="border-2 rounded-sm" width={wd} height={ht} />
          <p className="font-['Garamond'] text-2x1">{responseVideoData[i][j]["videoTitle"]}</p>
        </Link>
      )
    }
    finalRow.push(
      <div key={i} className="m-5 grid text-center lg:grid-cols-4 md:grid-cols-2"> 
        {currRow} 
      </div>
    );
  }
  return finalRow;
}