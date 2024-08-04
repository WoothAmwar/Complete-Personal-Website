import Link from "next/link";
import "@/app/globals.css";
import NavigationBar from "@/components/NavigationBar";

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
                        { path: "/" }

                    );
                    console.log("User ID:", res.data.id);
                    // http://localhost:5000/
                    // https://anwarkader.com/
                    fetch(`https://anwarkader.com/api/users/googleID`,
                        {
                            method: 'PUT',
                            mode: 'cors',
                            credentials: 'include',
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
                            <img src={userProfile?.picture} alt="user image" width="40em" />
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

function LoginModalButton() {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

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

                    <GoogleSignIn />
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
                <div>
                    <NavigateLink id={1} text="Dashboard" link="/dashboard" />
                </div>
            ) : (
                <LoginModalButton />
            )}
        </div>
    );
}
