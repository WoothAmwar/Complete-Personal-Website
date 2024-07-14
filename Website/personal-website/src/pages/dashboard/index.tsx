import { useState, useEffect } from 'react';
import Link from "next/link";
import "../../app/globals.css";
import { CookiesProvider, useCookies } from "react-cookie";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import {
    CurrentUserCookieInfo, CurrentUserId
} from "@/helperFunctions/cookieManagement";
import ProfilePicture from "@/components/uiComponents/ProfilePicture";
import { getFavoriteVideos, VideoBox } from "@/components/VideoBox";


interface UserInfo {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified: boolean;
}

const responsive = {
    desktop: {
        breakpoint: { max: 3000, min: 1024 },
        items: 3,
        slidesToSlide: 3 // optional, default to 1.
    },
    tablet: {
        breakpoint: { max: 1024, min: 464 },
        items: 2,
        slidesToSlide: 2 // optional, default to 1.
    },
    mobile: {
        breakpoint: { max: 464, min: 0 },
        items: 1,
        slidesToSlide: 1 // optional, default to 1.
    }
};

function FavoriteVideosDisplay(props: { currentUserGoogleID: string }) {
    const [videoInfo, setVideoInfo] = useState<any>();
    const getVideoInfo = async () => {
        try {
            const response = await getFavoriteVideos(props.currentUserGoogleID, false);
            setVideoInfo(response);
        } catch (err) {
            console.error("Error fetching video info", err);
        }
    }

    useEffect(() => {
        // console.log("DO");
        getVideoInfo();
    }, []);

    if (videoInfo == null) {
        return (
            <div>Loading...</div>
        )
    }

    return (
        <Carousel
            swipeable={true}
            draggable={false}
            showDots={true}
            responsive={responsive}
            ssr={true} // means to render carousel on server-side.
            infinite={true}
            autoPlay={false}
            keyBoardControl={true}
            customTransition="all .5"
            transitionDuration={500}
            containerClass="carousel-container"
            removeArrowOnDeviceType={["tablet", "mobile"]}
            dotListClass="custom-dot-list-style"
            itemClass="carousel-item-padding-40-px"
        >
            {videoInfo.map((element: any, index: number) => (
                <div key={index} className="mb-10 mx-2">
                    <VideoBox includeDate={false} width={480} fullVideoDetails={element} />
                </div>
            ))}
        </Carousel>
    );

}

export default function Dashboard() {

    const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
    const [profile_cookie, setCookie] = useCookies(["profile"]);
    const userInfo = CurrentUserCookieInfo();
    const currentUserGoogleID = CurrentUserId();

    useEffect(() => {
        if (userProfile === null) {
            setUserProfile(userInfo);
        }
    })

    const logOut = () => {
        googleLogout();
        setCookie("profile", null, { path: "/" });
        setUserProfile(null);
    };

    return (
        <main className="grid grid-cols-5 grid-rows-1 divide-x-2 divide-slate-800 gap-x-2">
            <div className="relative col-span-1 gap-4 flex flex-col py-4 h-screen">
                <div className="items-center place-self-center">
                    <ProfilePicture imageLink={userProfile?.picture} imageSize={100} />
                </div>

                <div className="text-lg font-semibold text-center">
                    <div>
                        Welcome, {userProfile?.name}
                    </div>
                    <div>
                        {userProfile?.email}
                    </div>
                </div>

                <div>
                    <button onClick={logOut} className="absolute inset-x-0 bottom-0 w-full h-12 border-2 border-red-800 rounded-full">
                        <Link key={1} href="/">
                            <p className="font-['Garamond'] font-bold text-lg text-red-800 ">Log out</p>
                        </Link>
                    </button>
                </div>
            </div>
            <div className="col-span-4 pl-2">
                <div className="font-bold text-4xl mb-3">
                    Favorite Videos
                </div>
                <div className="col-span-full">
                    <FavoriteVideosDisplay currentUserGoogleID={currentUserGoogleID} />
                </div>

                <div className="w-48 h-12 border-2 border-slate-800 rounded-full text-center place-content-center">
                    <Link key={1} href="/custom-youtube/scheduler">
                        <p className="font-['Garamond'] font-bold text-lg">YT Scheduler</p>
                    </Link>
                </div>
            </div>
        </main>
    );
}

