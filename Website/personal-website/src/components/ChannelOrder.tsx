import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { guidGenerator, VideoBox } from "./VideoBox";

export default function OrderByChannel() {
  const [responseVideoData, setResponseVideoData] = useState<any []>([]);
  const [responseChannelData, setResponseChannelData] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const currentUserGoogleId = CurrentUserId();

  var wd = 360  // 480
  var ht = wd/480*270  // 270
  var embedLink = "/custom-youtube/";

  var finalRow = []; 

  useEffect(() => {
    // http://localhost:5000/
    // https://anwarkader.com/
    fetch(`https://anwarkader.com/api/videos/${currentUserGoogleId.toString()}`, {method: 'GET', credentials: 'include'})
      .then(response => response.json())
      .then(data => {
        setResponseVideoData(data);
        setIsLoadingVideos(false);
      })
  }, [])

  useEffect(() => {
    // http://localhost:5000/
    // https://anwarkader.com/
    fetch(`https://anwarkader.com/api/channels/${currentUserGoogleId.toString()}`, {method: 'GET', credentials: 'include'})
      .then(response => response.json())
      .then(data => {
        setResponseChannelData(data);
        setIsLoadingChannels(false);
      })
  }, [])

  if (isLoadingChannels || isLoadingVideos) {
    return ["Loading..."]
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
        <VideoBox key={guidGenerator()} includeDate={false} width={wd} fullVideoDetails={responseVideoData[i][j]}/>
      )
    }
    finalRow.push(
      <div key={guidGenerator()} className="my-5 grid text-left gap-x-2 lg:grid-cols-4 md:grid-cols-2"> 
        {currRow} 
      </div>
    );
  }
  return finalRow;
}