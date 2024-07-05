import { useRouter } from 'next/router'
import "../../app/globals.css"

import { useEffect, useRef } from "react";

import videojs from "video.js";
import "videojs-youtube";
import "video.js/dist/video-js.css";
import Component from 'video.js/dist/types/component';


const initialOptions = {
    controls: true,
    fluid: true,
    controlBar: {
        volumePanel: {
            inline: false
        }
    }
};

function YT_Video(props:{embedID:string}) {
    const videoNode = useRef(null);
    const player = useRef<Component|null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (videoNode.current && !initialized.current) {
            initialized.current = true; //prevent duplicate initialization
            player.current = videojs(videoNode.current, {
                ...initialOptions,
                sources: [
                    {
                        type: "video/youtube",
                        src: "https://www.youtube.com/watch?v="+props.embedID
                    }
                ]
            }).ready(function () {
                console.log("Player Ready");
            });
        }
        //clear up player on dismount
        return () => {
            if (player.current) {
                player.current.dispose();
            }
        };
    }, [props.embedID]);

    return (
        <div>
            <video ref={videoNode} className="video-js" />
        </div>
    );
}


export default function VideoScreen() {
    const router = useRouter();
    var embedLink = "//www.youtube.com/embed/"
    var videoId = router.query.videoId?.toString();

    var wd = 1230  // 480
    var ht = wd / 480 * 270  // 270

    if (typeof videoId === "undefined") {
        return (
            <div>
                <p>Is Not Working</p>
            </div>
        )
    }

    return (
        // <div className="grid justify-center text-center">
        //     <iframe width={wd.toString()} height={ht.toString()} src={embedLink.concat(videoId)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;\">
        //     </iframe>
        // </div>
        <div className="m-auto mt-20 w-8/12">
            <YT_Video embedID={videoId} />
        </div>
    );
}