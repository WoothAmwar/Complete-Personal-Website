import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";


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

    var wd = 360  // 480
    var ht = wd / 480 * 270  // 270
    var embedLink = "/custom-youtube/";

    useEffect(() => {
        // http://localhost:5000/
        // https://anwarkader.com/
        fetch(`https://anwarkader.com/api/videos/${currentUserGoogleId.toString()}`, {method: 'GET', credentials: 'include'})
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
            // <div>
            //   <p>#{i} - {uploadDict[parseInt(uploadKeys[i])]}</p>
            //   <p>{uploadKeys[i]}</p>
            // </div>
            <Link key={i} className="m-2" href={embedLink.concat(uploadDict[parseInt(uploadKeys[i])]["videoId"])}>
                <img src={uploadDict[parseInt(uploadKeys[i])]["videoThumbnail"]} alt="Thumbnail" className="border-2 rounded-sm" width={wd} height={ht} />
                <p className="font-semibold text-2x1">{uploadDict[parseInt(uploadKeys[i])]["videoTitle"]}</p>
                <p className="font-['Garamond'] text-slate-300 text-2x1">Uploaded: {uploadDict[parseInt(uploadKeys[i])]["uploadDate"].substr(0, 10)}</p>
            </Link>
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