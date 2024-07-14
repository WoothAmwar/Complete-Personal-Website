import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";
import LoginButton from "@/components/buttons/LoginButton";
import Image from 'next/image';


interface SingleLink {
    id: number,
    text: string,
    link: string
}

function NavigateLink(props: SingleLink) {
    return (
        <Link key={props.id} className="py-2 mr-1 ml-1 bg-black border-2 rounded-lg" href={props.link}>
            <p className="font-['Garamond'] text-lg">{props.text}</p>
        </Link>
    );
}

export default function NavigationBar() {
    return (
        <div className="text-center bg-black">
            <div className="m-3 mt-5 grid grid-rows-1 grid-cols-5 grid-flow-col">
                <div className="grid grid-flow-col float:left col-span-1">
                    {/* <NavigateLink id={1} text="Logo" link="/" /> */}
                    <Link key={1} href={"/"}>
                        <img className="object-fill w-5/6 h-12" src="/logo-name-only.png"  alt="Logo Image" />
                    </Link>
                </div>
                <div className="grid grid-flow-col col-start-2 col-span-3">
                    <NavigateLink id={2} text="About" link="/about" />
                    <NavigateLink id={3} text="Youtube" link="/custom-youtube" />
                    <NavigateLink id={4} text="Test" link="/test" />
                </div>
                <div className="grid grid-flow-col float:right col-span-1">
                    <NavigateLink id={1} text="Dashboard" link="/dashboard" />
                </div>
            </div>

        </div>
    );
}
