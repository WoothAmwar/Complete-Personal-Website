import Link from "next/link";
import NavigationBar from "@/components/NavigationBar";
// import Image from 'next/image';

import { useState, useEffect } from "react";

import { GoogleOAuthProvider, TokenResponse } from "@react-oauth/google";
import { CookiesProvider, useCookies } from "react-cookie";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";


import {
    CurrentUserCookieInfo
} from "../../helperFunctions/cookieManagement";

// import YoutubeHomepage from "../pages/YtHomepage";
// import About from "../pages/About";

const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    height: 600,
    bgcolor: "white",
    color: "black",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4
};

interface UserInfo {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified: boolean;
}

function GoogleSignIn() {
    const [user, setUser] = useState<TokenResponse | null>(null);
    const [profile_cookie, setCookie] = useCookies(["profile"]);
    const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
    const userInfo = CurrentUserCookieInfo();

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            setUser(codeResponse);
        },
        onError: (error) => console.log("Login Failed:", error),
    });

    useEffect(() => {
        if (user) {
            axios
                .get(
                    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                            Accept: "application/json",
                        },
                    }
                )
                .then((res) => {
                    setCookie(
                        "profile",
                        [
                            res.data.id,
                            res.data.email,
                            res.data.given_name,
                            res.data.picture,
                            res.data.verified_email,
                        ],
                        {
                            path: "/",
                            maxAge: 60 * 60 * 48  // 48 hours in seconds
                        }

                    );
                    console.log("User ID:", res.data.id);
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`,
                        {
                            method: 'PUT',
                            mode: 'cors',
                            // credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ data: res.data.id }),
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log("Added", data);
                        })
                        .catch(err => console.error("Error adding google id of channel", err));
                })
                .catch((err) => console.log(err));
        }
    }, [user, setCookie]);

    useEffect(() => {
        // if (profile_cookie.profile) {
        setUserProfile(userInfo);

    }, [profile_cookie]);

    const logOut = () => {
        googleLogout();
        setCookie("profile", null, { path: "/" });
        setUserProfile(null);
    };

    return (
        <CookiesProvider>
            <div>
                {userProfile ? (
                    <div className="grid grid-cols-3 place-content-end">
                        <div className="justify-self-center col-span-1 place-content-center">
                            {userProfile?.picture && (
                                // <Image
                              <img src={userProfile.picture} alt="user image" width={40} height={40} />
                            )}
                        </div>
                        <div className="col-span-2">
                            <button onClick={logOut} className="w-full h-12 border-2 border-black rounded-full">
                                Log out
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => login()} className="w-full h-12 border-2 border-black rounded-full">🚀 Sign in with Google  </button>
                )}
            </div>
        </CookiesProvider>
    );
}

// Dev-only sign-in that skips the Google OAuth popup and the googleapis.com/oauth2 call, so the
// app can be signed into fully offline. Gated behind NEXT_PUBLIC_USE_MOCK_AUTH; see .env.example.
const DEV_USER: UserInfo = {
    id: "dev-user-1",
    email: "dev@example.com",
    name: "Dev User",
    picture: "https://picsum.photos/seed/dev-user/100",
    verified: true,
};

function DevSignIn() {
    const [, setCookie] = useCookies(["profile"]);
    const userInfo = CurrentUserCookieInfo();
    const [userProfile, setUserProfile] = useState<UserInfo | null>(userInfo);

    const devSignIn = () => {
        setCookie(
            "profile",
            [DEV_USER.id, DEV_USER.email, DEV_USER.name, DEV_USER.picture, DEV_USER.verified],
            { path: "/", maxAge: 60 * 60 * 48 }
        );
        setUserProfile(DEV_USER);

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
            method: 'PUT',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: DEV_USER.id }),
        }).catch(err => console.error("Error adding dev user id", err));
    };

    const logOut = () => {
        setCookie("profile", null, { path: "/" });
        setUserProfile(null);
    };

    return (
        <div>
            {userProfile ? (
                <div className="grid grid-cols-3 place-content-end">
                    <div className="justify-self-center col-span-1 place-content-center">
                        <img src={userProfile.picture} alt="user image" width={40} height={40} />
                    </div>
                    <div className="col-span-2">
                        <button onClick={logOut} className="w-full h-12 border-2 border-black rounded-full">
                            Log out
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={devSignIn} className="w-full h-12 border-2 border-black rounded-full">🧪 Dev Sign In</button>
            )}
        </div>
    );
}

function LoginModalButton() {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "1";

    return (
        <div>
            <Button variant="contained"
                sx={{
                    "&.MuiButtonBase-root:hover": {
                        bgcolor: "black"
                    }
                }} className="rounded-lg bg-black text-white font-['Garamond'] font-semibold text-md" onClick={handleOpen}>Log In</Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
            >
                <Box sx={style} className="rounded-3xl">
                    <Typography id="modal-modal-title" variant="h4" component="h1" className="p-5">
                        Log In
                    </Typography>

                    {useMockAuth ? <DevSignIn /> : <GoogleSignIn />}
                </Box>
            </Modal>
        </div>
    );
}

interface SingleLink {
    id: number,
    text: string,
    link: string
}

function NavigateLink(props: SingleLink) {
    return (
        <Link key={props.id} href={props.link}>
            <p className="font-['Garamond'] text-lg">{props.text}</p>
        </Link>
    );
}

export default function LoginButton() {
    const [signedIn, setSignedIn] = useState(false);
    const [cookies] = useCookies(['profile']);

    useEffect(() => {
        const userSignedIn = cookies.profile !== null && cookies.profile !== undefined;
        setSignedIn(userSignedIn);
    },
        [cookies]);

    return (
        <div>
            {signedIn ? (
                <div className="border border-4 rounded-md p-2 ">
                    <NavigateLink id={1} text="Go to Dashboard" link="/dashboard" />
                </div>
            ) : (
                <LoginModalButton />
            )}
        </div>
    );
}
