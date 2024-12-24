import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { guidGenerator, VideoBox } from "./VideoBox";


/**
 * Finds the number of milliseconds that passed from the video release date to present moment
 * @param time1 String - the Date, from the database, that the video was relased
 * @returns String - The number of milliseconds since the video was uploaded
 */
function time_difference(time1: string) {
    var vidTime = new Date(Date.parse(time1));
    return (Date.now() - vidTime.getTime());
}

export default function OrderByTime() {
    const [responseVideoData, setResponseVideoData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const currentUserGoogleId = CurrentUserId();

    var finalData = [];
    var uploadDict: { [key: number]: {videoId: string, videoTitle: string, videoThumbnail: string, uploadDate: string} } = {};

    var wd = 420  // 480

    useEffect(() => {
        // http://localhost:5000/
        // https://anwarkader.com/
        // https://anwarkader.com/api/videos/${currentUserGoogleId.toString()}
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos`, 
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
            setResponseVideoData(data);
            setIsLoading(false);
          })
      }, [])

    if (isLoading) {
        return (
            <div>Loading...</div>
        )
    }

    for (let i = 0; i < responseVideoData.length; i++) {
        for (let j = 0; j < responseVideoData[i].length; j++) {
            uploadDict[time_difference(responseVideoData[i][j]["uploadDate"])] = responseVideoData[i][j];
        }
    }
    var uploadKeys = Object.keys(uploadDict);
    uploadKeys.sort(compareVidDescending);

    for (var i = 0; i < uploadKeys.length; i++) {
        finalData.push(
            <VideoBox key={guidGenerator()} includeDate={true} fullVideoDetails={uploadDict[parseInt(uploadKeys[i])]}/>
        );
    }

    return finalData;
}


/**
 * Comparison function, sort in descending order (newest on top/first)
 * @param v1 String - value from time_difference for video 1
 * @param v2 String - value from time_difference for video 2
 * @returns Integer to describe which of the two was larger
 */
function compareVidDescending(v1: string, v2: string) {
    var a = parseInt(v1);
    var b = parseInt(v2);

    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}

/**
 * Comparison function, sort in ascending order (oldest on top/first)
 * @param v1 String - value from time_difference for video 1
 * @param v2 String - value from time_difference for video 2
 * @returns Integer to describe which of the two was larger
 */
function compareVidAscending(v1: string, v2: string) {
    var a = parseInt(v1);
    var b = parseInt(v2);

    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}