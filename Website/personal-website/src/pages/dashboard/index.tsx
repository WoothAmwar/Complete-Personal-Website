import { useState, useEffect } from 'react';
import Link from "next/link";
import "../../app/globals.css";
import { CookiesProvider, useCookies } from "react-cookie";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";

import {
    CurrentUserCookieInfo
} from "@/helperFunctions/cookieManagement";
import ProfilePicture from "@/components/uiComponents/ProfilePicture";


interface UserInfo {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified: boolean;
}

export default function Dashboard() {

    const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
    const [profile_cookie, setCookie] = useCookies(["profile"]);
    const userInfo = CurrentUserCookieInfo();

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
        <main className="grid grid-cols-5">
            <div className="col-span-1 gap-4 flex flex-col justify-center py-4">
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
                    <button onClick={logOut} className="w-full h-12 border-2 border-red-800 rounded-full">
                        <Link key={1} href="/">
                            <p className="font-['Garamond'] font-bold text-lg text-red-800">Log out</p>
                        </Link>
                    </button>
                </div>
            </div>
        </main>
    );
}
