import { useState, useEffect, useRef } from "react";
import Link from "next/link";
// import Image from "next/image";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { guidGenerator, VideoBox } from "./VideoBox";
import { ManageShowTag } from "./buttons/ManageChannelTags";
import { useQuery } from "@tanstack/react-query";


const fetchChannels = async (currentUserGoogleId: string) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels`, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "x-google-id": currentUserGoogleId,
    },
  });
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
};

export default function OrderByChannel(props: { 
  channelsToInclude: string[], 
  responseVideoData: Array<any>, isLoadingVideos: boolean, 
  pageSize?: number }) {
  const currentUserGoogleId = CurrentUserId();
  const pageSize = props.pageSize ?? 5; // number of channels per load

  const { data: responseChannelData, isLoading: isLoadingChannels } = useQuery({
    queryKey: ['channels', currentUserGoogleId],
    queryFn: () => fetchChannels(currentUserGoogleId.toString()),
  });

  const [filteredVideoData, setFilteredVideoData] = useState<any[]>([]);
  const [filteredChannelData, setFilteredChannelData] = useState<any[]>([]);

  var wd = 360; // 480
  var ht = (wd / 480) * 270; // 270

  useEffect(() => {
    console.log("INIT:", props);
  })
  const [visibleChannels, setVisibleChannels] = useState(Math.min(pageSize, filteredChannelData.length));
  useEffect(() => {
    setVisibleChannels(Math.min(pageSize, filteredChannelData.length));
  }, [pageSize, filteredChannelData.length]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setVisibleChannels(prev => Math.min(prev + pageSize, filteredChannelData.length));
      }
    }, { rootMargin: '400px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredChannelData.length, filteredVideoData.length, pageSize, props.isLoadingVideos, isLoadingChannels]);

  useEffect(() => {
    if (props.responseVideoData) {
      setFilteredVideoData(props.responseVideoData);
    }
  }, [props.responseVideoData]);

  useEffect(() => {
    if (responseChannelData) {
      setFilteredChannelData(responseChannelData);
    }
  }, [responseChannelData]);

  useEffect(() => {
    if (props.channelsToInclude[0] === "None") {
      if (responseChannelData) setFilteredChannelData(responseChannelData);
      if (props.responseVideoData) setFilteredVideoData(props.responseVideoData);
    } else if (props.channelsToInclude.length > 0) {
      var tempFilteredVideoData: any[] = [];
      var tempFilteredChannelData: any[] = [];

      if (props.responseVideoData && responseChannelData) {
        for (let i = 0; i < props.responseVideoData.length; i++) {
          if (props.channelsToInclude.indexOf(responseChannelData[i]["channelNames"]) != -1) {
            tempFilteredChannelData.push(responseChannelData[i]);
            tempFilteredVideoData.push(props.responseVideoData[i]);
          }
        }
      }

      setFilteredChannelData(tempFilteredChannelData);
      setFilteredVideoData(tempFilteredVideoData);
    }
  }, [props.channelsToInclude, responseChannelData, props.responseVideoData]);

  if (props.channelsToInclude.length === 0) {
    return (
      <div className="font-bold text-2xl text-center">
        No Channels With The Selected Tag
      </div>
    );
  }

  if (isLoadingChannels || props.isLoadingVideos) {
    return ["Loading..."];
  }

  if (!props.responseVideoData || !responseChannelData || filteredVideoData.length === 0 || filteredChannelData.length === 0) {
    return ["No data available"];
  }


  let finalRow: JSX.Element[] = [];
  // console.log("V:", filteredChannelData);
  for (let i = 0; i < Math.min(visibleChannels, filteredChannelData.length); i++) {
    let currRow = [];
    // console.log("T:", i);
    // console.log("TB:", filteredChannelData[i]);
    currRow.push(
      <div key={filteredChannelData[i]["channelNames"]} className="text-left flex">
        <ManageShowTag channelName={filteredChannelData[i]["channelNames"]} />
        <div>
          {/* <Image */}
          <img
            src={filteredChannelData[i]["channelImages"]}
            alt="Channel Image"
            width={wd / 2 - 30}
            height={ht / 2 - 30}
            style={{ objectFit: "cover" }}
          />
          <p className="font-['Helvetica'] text-2xl font-semibold">
            {filteredChannelData[i]["channelNames"]}
          </p>
          <p>{filteredVideoData[i]?.length ?? 0}</p>
        </div>
      </div>
    );
    for (let j = 0; j < filteredVideoData[i].length; j++) {
      currRow.push(
        <VideoBox
          key={filteredVideoData[i][j]["videoId"]}
          includeDate={false}
          fullVideoDetails={filteredVideoData[i][j]}
        />
      );
    }
    finalRow.push(
      <div
        key={filteredChannelData[i]["channelNames"] + "-row"}
        className="my-5 grid text-left gap-x-2 lg:grid-cols-4 md:grid-cols-2"
      >
        {currRow}
      </div>
    );
  }
  const hasMore = visibleChannels < filteredChannelData.length;
  return (
    <>
      {finalRow}
      {hasMore && (
        <div className="my-6 flex justify-center">
          <button className="px-4 py-2 rounded-md bg-neutral-800" onClick={() => setVisibleChannels(v => Math.min(v + pageSize, filteredChannelData.length))}>Load more</button>
        </div>
      )}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </>
  );
}
