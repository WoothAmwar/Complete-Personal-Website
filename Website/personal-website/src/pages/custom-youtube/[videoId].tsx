import { useRouter } from 'next/router'
import "../../app/globals.css"


export default function VideoScreen() {
    const router = useRouter();
    var embedLink = "//www.youtube.com/embed/"
    var videoId = router.query.videoId?.toString();

    var wd = 1230  // 480
    var ht = wd/480*270  // 270

    if (typeof videoId === "undefined") {
        return (
            <div>
                <p>Is Not Working</p>
            </div>
        )
    }

    return (
        <div className="grid justify-center text-center">
            <iframe width={wd.toString()} height={ht.toString()} src={embedLink.concat(videoId)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;\">
            </iframe>
        </div>
    );
}