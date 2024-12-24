import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { guidGenerator, VideoBox } from "./VideoBox";
import { ManageShowTag } from './buttons/ManageChannelTags';

export default function OrderByChannel(props: { channelsToInclude: string[] }) {
  const [responseVideoData, setResponseVideoData] = useState<any[]>([]);
  const [responseChannelData, setResponseChannelData] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  const currentUserGoogleId = CurrentUserId();

  var wd = 360  // 480
  var ht = wd / 480 * 270  // 270
  var embedLink = "/custom-youtube/";

  var finalRow = [];
  var doFilter = false;

  useEffect(() => {
    // http://localhost:5000/
    // https://anwarkader.com/
    // https://anwarkader.com/api/videos/${currentUserGoogleId.toString()}
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos`, 
    { 
      method: 'GET', 
      // credentials: 'include' 
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'x-google-id': currentUserGoogleId.toString()
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log("DTA 13.1:", data);
        setResponseVideoData(data);
        setIsLoadingVideos(false);
      })
  }, [])

  useEffect(() => {
    // http://localhost:5000/
    // https://anwarkader.com/
    // https://anwarkader.com/api/channels/${currentUserGoogleId.toString()}
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels`, 
    { 
      method: 'GET', 
      // credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'x-google-id': currentUserGoogleId.toString()
      }
    })
      .then(response => response.json())
      .then(data => {
        setResponseChannelData(data);
        setIsLoadingChannels(false);
      })
  }, [])


  if (isLoadingChannels || isLoadingVideos || responseVideoData.length==0 || responseChannelData.length==0) {
    return ["Loading..."]
  }

  if (props.channelsToInclude.length === 0) {
    console.log("No Channels to Filter with", props.channelsToInclude);
    return (
      <div className="font-bold text-2xl text-center">
        No Channels With The Selected Tag
      </div>
    )
  } else if (props.channelsToInclude[0] === "None") {
    // console.log("No Channels to Filter with", props.channelsToInclude);
    doFilter = false;
  } else {
    doFilter = true;
  }

  // responseVideoData.length
  console.log("RV:", responseVideoData.length);
  const start_idx: number = 0;
  const page_amt: number = responseVideoData.length - start_idx; // responseVideoData.length - start_idx
  for (let i = start_idx; i < start_idx+page_amt; i++) {
    let currRow = [];
    if (!doFilter || (doFilter && (props.channelsToInclude.indexOf(responseChannelData[i]["channelNames"]) != -1))) {
      currRow.push(
        <div key={i+1} className="text-left flex">
          <ManageShowTag channelName={responseChannelData[i]["channelNames"]} />
          <div>
            <img src={responseChannelData[i]["channelImages"]} alt="Channel Image" width={wd / 2 - 30} height={ht / 2 - 30} />
            <p className="font-['Helvetica'] text-2xl font-semibold">{responseChannelData[i]["channelNames"]}</p>
            <p>{responseVideoData.length}</p>
          </div>
        </div>
      )
      for (let j = 0; j < responseVideoData[i].length; j++) {
        currRow.push(
          <VideoBox key={guidGenerator()} includeDate={false} fullVideoDetails={responseVideoData[i][j]} />
        )
      }
      finalRow.push(
        <div key={guidGenerator()} className="my-5 grid text-left gap-x-2 lg:grid-cols-4 md:grid-cols-2">
          {currRow}
        </div>
      );
    }
  }
  return finalRow;
}