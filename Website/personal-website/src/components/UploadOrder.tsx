import { useState, useEffect, useMemo, useRef } from 'react';
import Link from "next/link";
import "../app/globals.css";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { guidGenerator, VideoBox } from "./VideoBox";
import { useQuery } from "@tanstack/react-query";


/**
 * Finds the number of milliseconds that passed from the video release date to present moment
 * @param time1 String - the Date, from the database, that the video was relased
 * @returns String - The number of milliseconds since the video was uploaded
 */
function time_difference(time1: string) {
    var vidTime = new Date(Date.parse(time1));
    return (Date.now() - vidTime.getTime());
}

const fetchVideos = async(currentUserGoogleId: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos`, 
        {
            method: 'GET', 
            // credentials: 'include',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleId.toString()
            }
        }
    );
    if (!response.ok) {
        throw new Error("Network response was not ok for fetch videos in UploadOrder");
    }
    return response.json();
}

export default function OrderByTime(props: { pageSize?: number }) {
    const currentUserGoogleId = CurrentUserId();
    const pageSize = props.pageSize ?? 12;

    const { data: responseVideoData, isLoading } = useQuery({
        queryKey: ['videos', currentUserGoogleId],
        queryFn: () => fetchVideos(currentUserGoogleId.toString()),
    });

    const sortedVideos = useMemo(() => {
        if (!responseVideoData) return [] as any[];
        const flat: any[] = [];
        for (let i = 0; i < responseVideoData.length; i++) {
            for (let j = 0; j < responseVideoData[i].length; j++) {
                flat.push(responseVideoData[i][j]);
            }
        }
        flat.sort((a, b) => new Date(b["uploadDate"]).getTime() - new Date(a["uploadDate"]).getTime());
        return flat;
    }, [responseVideoData]);

    const [visibleCount, setVisibleCount] = useState(pageSize);
    useEffect(() => { setVisibleCount(pageSize); }, [pageSize, sortedVideos.length]);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!sentinelRef.current) return;
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + pageSize, sortedVideos.length));
            }
        }, { rootMargin: '400px' });
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [sortedVideos.length, pageSize]);

    if (isLoading) return <div>Loading...</div>;
    if (!sortedVideos || sortedVideos.length === 0) return <div>No videos available</div>;

    const items = sortedVideos.slice(0, visibleCount).map((details: any) => (
        <VideoBox key={details["videoId"]} includeDate={true} fullVideoDetails={details} />
    ));

    const hasMore = visibleCount < sortedVideos.length;

    return (
        <>
            {items}
            {hasMore && (
                <div className="my-6 flex justify-center">
                    <button className="px-4 py-2 rounded-md bg-neutral-800" onClick={() => setVisibleCount(v => Math.min(v + pageSize, sortedVideos.length))}>Load more</button>
                </div>
            )}
            {hasMore && <div ref={sentinelRef} className="h-1" />}
        </>
    );
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
