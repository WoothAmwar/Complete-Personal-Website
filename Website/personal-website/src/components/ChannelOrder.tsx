import { useState, useEffect } from "react";
import Link from "next/link";
import "../app/globals.css";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { guidGenerator, VideoBox } from "./VideoBox";
import { ManageShowTag } from "./buttons/ManageChannelTags";

export default function OrderByChannel(props: { channelsToInclude: string[], pageTabNumber: number, channelsPerPage: number }) {
  const [responseVideoData, setResponseVideoData] = useState<any[]>([]);
  const [responseChannelData, setResponseChannelData] = useState([]);
  const [filteredVideoData, setFilteredVideoData] = useState<any[]>([]);
  const [filteredChannelData, setFilteredChannelData] = useState([]);

  const [filteredChannelIndexes, setFilteredChannelIndexes] = useState<
    number[]
  >([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);

  const currentUserGoogleId = CurrentUserId();

  var wd = 360; // 480
  var ht = (wd / 480) * 270; // 270
  var embedLink = "/custom-youtube/";

  var finalRow = [];
  var doFilter = false;

  useEffect(() => {
    // http://localhost:5000/
    // https://anwarkader.com/
    // https://anwarkader.com/api/videos/${currentUserGoogleId.toString()}
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos`, {
      method: "GET",
      // credentials: 'include'
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-google-id": currentUserGoogleId.toString(),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("DTA 13.1:", data);
        setResponseVideoData(data);
        setFilteredVideoData(data);
        setIsLoadingVideos(false);
      });
    // }, [])

    // useEffect(() => {
    //   console.log("INCL:", props.channelsToInclude);
    // http://localhost:5000/
    // https://anwarkader.com/
    // https://anwarkader.com/api/channels/${currentUserGoogleId.toString()}
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels`, {
      method: "GET",
      // credentials: 'include',
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-google-id": currentUserGoogleId.toString(),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setResponseChannelData(data);
        setFilteredChannelData(data);
        setIsLoadingChannels(false);
      });
  }, []);

  useEffect(() => {
    if (props.channelsToInclude[0] === "None") {
      // console.log("No Channels to Filter with", props.channelsToInclude);
      console.log("DOING THE NONE FILTER");
      console.log(responseChannelData);
      if (filteredChannelData.length != responseChannelData.length) {
        setFilteredChannelData(responseChannelData);
        setFilteredVideoData(responseVideoData);
      }
      doFilter = false;
    } else if (props.channelsToInclude.length > 0) {
      doFilter = true;
      console.log("DOING THE FILTER", responseChannelData);

      var filteredDataIndexes: number[] = [];
      var tempFilteredVideoData: any[] = [];
      var tempFilteredChannelData: [] = [];

      if (props.channelsToInclude.length > 0) {
        // var filteredDataIndexes: number[] = [];
        // var filteredVideoData: any[] = [];
        // var filteredChannelData: [] = [];

        console.log("LEN:", props.channelsToInclude.length);
        for (let i = 0; i < responseVideoData.length; i++) {
          if (props.channelsToInclude.indexOf(responseChannelData[i]["channelNames"]) != -1) {
            filteredDataIndexes.push(i);

            tempFilteredChannelData.push(responseChannelData[i]);
            tempFilteredVideoData.push(responseVideoData[i]);
            // setFilteredChannelData(prevChannelData => [...prevChannelData, responseChannelData[i]]);
            // setFilteredVideoData(prevVideoData => [...prevVideoData, responseChannelData[i]]);
          }
        }

        setFilteredChannelIndexes(filteredDataIndexes);
        setFilteredChannelData(tempFilteredChannelData);
        setFilteredVideoData(tempFilteredVideoData);
      }
    }
  }, [props.channelsToInclude]);

  if (props.channelsToInclude.length === 0) {
    console.log("No Channels to Filter with", props.channelsToInclude);
    return (
      <div className="font-bold text-2xl text-center">
        No Channels With The Selected Tag
      </div>
    );
  }

  if (
    isLoadingChannels ||
    isLoadingVideos ||
    responseVideoData.length == 0 ||
    responseChannelData.length == 0 ||
    filteredVideoData.length == 0 || 
    filteredChannelData.length == 0
  ) {
    return ["Loading..."];
  }

  // responseVideoData.length
  console.log("RV:", responseVideoData.length);
  // const channels_per_page = 5;
  const start_idx: number = Math.min(Math.max(props.channelsPerPage * (props.pageTabNumber-1), 0), Math.max(filteredVideoData.length-props.channelsPerPage, 0));
  const page_amt: number = Math.min(filteredVideoData.length, props.channelsPerPage); // responseVideoData.length - start_idx
  console.log("RESPON C:", filteredChannelData, "\n |", start_idx, "::", page_amt);
  for (let i = start_idx; i < start_idx + page_amt; i++) {
    let currRow = [];
    // if (!doFilter || (doFilter && (props.channelsToInclude.indexOf(responseChannelData[i]["channelNames"]) != -1))) {
    currRow.push(
      <div key={i + 1} className="text-left flex">
        <ManageShowTag channelName={filteredChannelData[i]["channelNames"]} />
        <div>
          <img
            src={filteredChannelData[i]["channelImages"]}
            alt="Channel Image"
            width={wd / 2 - 30}
            height={ht / 2 - 30}
          />
          <p className="font-['Helvetica'] text-2xl font-semibold">
            {filteredChannelData[i]["channelNames"]}
          </p>
          <p>{filteredVideoData.length}</p>
        </div>
      </div>
    );
    for (let j = 0; j < filteredVideoData[i].length; j++) {
      currRow.push(
        <VideoBox
          key={guidGenerator()}
          includeDate={false}
          fullVideoDetails={filteredVideoData[i][j]}
        />
      );
    }
    finalRow.push(
      <div
        key={guidGenerator()}
        className="my-5 grid text-left gap-x-2 lg:grid-cols-4 md:grid-cols-2"
      >
        {currRow}
      </div>
    );
  }
  // }
  return finalRow;
}
