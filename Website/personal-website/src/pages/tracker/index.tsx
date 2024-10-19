import { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import "../../app/globals.css"

import Button from "@mui/material/Button";
import TextField from '@mui/material/TextField';

import { CurrentUserId } from "@/helperFunctions/cookieManagement";

const extractedVideoId = (full_url: string): string => {
  // https://www.youtube.com/watch?v=szgs2_VxUow
  const split_url = full_url.split("=");
  const default_yt_url = split_url.at(0);
  const video_id = split_url.at(1);

  if (default_yt_url?.includes("https://www.youtube.com/watch?v") == false || video_id == undefined) {
    return ""
  }
  return video_id
}

interface TrackedVideoInfo {
  id: string,
  category: string,
  videoID: string,
  videoTitle: string,
  videoThumbnail: string
}

export default function TrackerPage() {

  // const [message, setMessage] = useState("Loading...");
  const [newUrlText, setNewUrlText] = useState("");

  const currentUserGoogleID = CurrentUserId();
  const [allVideoInfo, setAllVideoInfo] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState<Boolean>(true);

  const handleChangeUrlText = useCallback((event: any) => {
    setNewUrlText(event.target.value);
  }, []);

  const addVideoByURL = async () => {
    if (extractedVideoId(newUrlText) == "") {
      console.log("Unable to, not valid URL");
      return;
    }

    try {
      // http://localhost:5000/
    // https://anwarkader.com/
      const response = await fetch(`https://anwarkader.com/api/tracker/${currentUserGoogleID}/trackedVideo/${extractedVideoId(newUrlText)}`, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: "Filler" }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data != "None") {
        setAllVideoInfo(prevVideoInfo => [...prevVideoInfo, data]);
      }
      setNewUrlText("");
      return true;
    } catch (err) {
      console.error("Error adding tracked video", err);
      return null;
    }
  }

  // Fetch the information every second
  // useEffect(() => {
  //   setInterval(() => {
  //     fetch("https://anwarkader.com/api/tracker")
  //       .then(response => response.json())
  //       .then(data => {
  //         // console.log(data);
  //         setMessage(data.web_chapter);
  //       })
  //   }, 1000)
  // }, [])

  const fetchVideoInfo = useCallback(async () => {
    try {
      var full_video_info:TrackedVideoInfo[] = [];
      // http://localhost:5000/
      // https://anwarkader.com/
      const response = await fetch(`https://anwarkader.com/api/tracker/${currentUserGoogleID}/trackedVideo`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
      });
      const data = await response.json();
      if (data) {
        // setAllVideoInfo(data);
        for (var videoIdx in data) {
          full_video_info.push(data[videoIdx]);
        }
      }
      setAllVideoInfo(full_video_info);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching video info:", error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideoInfo();
  }, [fetchVideoInfo]);

  const SingleLink_YT = (props: { video_info: TrackedVideoInfo }) => {
    const currentUserGoogleID = CurrentUserId();
    
    const removeTrackedVideo = async (videoID: string) => {
      try {
        // http://localhost:5000/
        // https://anwarkader.com/
        const response = await fetch(`https://anwarkader.com/api/tracker/${currentUserGoogleID}/trackedVideo/${videoID}`, {
          method: 'DELETE',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: "Filler" }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data == "None") {
          console.log("Error: Has not been deleted");
          return -1;
        }
        setAllVideoInfo(prevVideoInfo => prevVideoInfo.filter(video => video.videoID !== videoID));
        setNewUrlText("");
      } catch (err) {
        console.error("Error removing tracked video", err);
        return null;
      }
    }
  
    return (
      <div className="grid grid-cols-1 grid-rows-2 grid-flow-col">
        <div>
          <Link key={props.video_info.videoThumbnail} href={"/custom-youtube/".concat(props.video_info.videoID)}>
            <img src={props.video_info.videoThumbnail} alt="Video Thumbnail" width="100%" height="100%" />
          </Link>
        </div>
        <div className="mt-2 text-center">
          <Link key={props.video_info.videoThumbnail} href={"/custom-youtube/".concat(props.video_info.videoID)}>
            <div className="h-1/2 font-['Garamond'] lg:text-lg md:text-md text-sm text-blue-400 border-2 border-blue-400 rounded-lg p-2 pt-0 tracking-tighter line-clamp-4">
              {props.video_info.videoTitle}
            </div>
          </Link>
          <button onClick={() => removeTrackedVideo(props.video_info.videoID)} className="mt-1 font-['Garamond'] text-lg text-red-400 align-content-center border-2 border-red-400 rounded-lg w-full">
            Remove
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div>
        <h2 className="text-center font-semibold text-lg py-4">
          Getting Youtube Tracker 1.0 Ready
        </h2>
      </div>
    )
  }
  return (
    <main className="flex flex-col items-center">
      <h2 className="text-center font-semibold text-lg py-4">
        Get Started with Test Place for Web Tracker 1.0
      </h2>

      <div className="my-2 mx-4 grid lg:grid-cols-5 md:grid-cols-3 grid-cols-2 gap-x-4">
        {allVideoInfo.map((video_info, index) => (
          <div key={index}>
            <SingleLink_YT video_info={video_info} />
          </div>
        ))}
      </div>
      <div className="my-2 lg:w-1/4 md:w-1/2 w-5/6 grid grid-cols-3 grid-rows-1">
        <TextField fullWidth InputProps={{
          style: { color: '#e7e5e4' }
        }} className="col-span-2" size="small" id="outlined-basic" label="Youtube Video URL" variant="outlined" value={newUrlText} onChange={handleChangeUrlText} color="primary" focused />
        <Button onClick={addVideoByURL}>Add YT Video URL</Button>
      </div>

    </main>
  );
}
