import { useState, useEffect } from 'react';
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { VideoBox } from './VideoBox';

export default function VideoQueue(props: {fullVideoDetails: Array<Array<any>>, isLoading: boolean}) {
    const currentUserGoogleId = CurrentUserId();
    const [queue_list, setQueueList] = useState<Array<string>>([]);
    const [queue, setQueue] = useState<Array<any>>([]);

    function match_list_to_vid() {
        const details_by_id = new Map<string, any>();
        props.fullVideoDetails.forEach(group => {
            group.forEach(details => {
                details_by_id.set(details["videoId"], details);
            });
        });

        setQueue([]);
        queue_list.forEach(vid_id => {
            const details = details_by_id.get(vid_id);
            if (details) {
                setQueue(prev => [...prev, details]);
            }
        });
    }

    useEffect(() => {
        if (!currentUserGoogleId) return;

        let cancelled = false;
        (async () => {
            const response = await fetch('/api/queue');
            if (!response.ok) return;
            const data = await response.json();
            if (!cancelled) setQueueList(data.queue_list);
        })();

        return () => { cancelled = true; };
    }, [currentUserGoogleId]);

    useEffect(() => {
        if (props.fullVideoDetails != null) {
            match_list_to_vid();
        }
    }, [queue_list, props.fullVideoDetails]);

    if (props.isLoading) {
        return (
            <div>
                Loading...
            </div>
        )
    }   

    return (
        <div className="flex flex-col gap-1 items-center justify-center border-y w-full">
            <div className="border-b w-full text-center">Next Video Queue </div>
            {/* <div>Key: {currentUserGoogleId}_queue</div>
            <h1 className="text-sm font-bold">Queue list: {queue_list.join(', ')}</h1> */}
            {queue.map((e) => {
                return (
                    <VideoBox 
                        key={e["videoId"]}
                        includeDate={false}
                        fullVideoDetails={e}
                        width={190}
                        includeInfo={false}
                    />
                )
            })}
        </div>
    )
}
