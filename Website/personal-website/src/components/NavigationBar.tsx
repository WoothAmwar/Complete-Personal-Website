import { useState, useEffect } from 'react';
import Link from "next/link";
import LoginButton from "@/components/buttons/LoginButton";
// import Image from 'next/image';


interface SingleLink {
    id: number,
    text: string,
    link: string
}

function NavigateLink(props: SingleLink) {
    return (
        <div className="p-2 mr-1 ml-1 bg-black border-2 rounded-lg">
            <Link key={props.id}  href={props.link}>
                <p className="text-lg">{props.text}</p>
            </Link>
        </div>
    );
}

export default function NavigationBar() {
    return (
        <nav className="bg-black w-full flex items-center shrink=0">
            <div className="flex-1 flex items-center min-w-1/4">
                {/* <NavigateLink id={1} text="Logo" link="/" /> */}
                <Link key={1} href={"/"}>
                {/* <Image */}
                    <img src="/logo-name-only.png" alt="Logo Image" width={148} height={52}/>
                </Link>
            </div>
            <div className="flex items-center gap-1">
                <NavigateLink id={2} text="About" link="/about" />
                <NavigateLink id={3} text="Youtube" link="/custom-youtube" />
                <NavigateLink id={5} text="Tracker" link="/tracker" />
                <NavigateLink id={1} text="Dashboard" link="/dashboard" />
            </div>
            {/* Following element created so the above can be centered */}
            <div className="flex-1 flex items-center justify-end">
            </div>
        </nav>
    );
}
