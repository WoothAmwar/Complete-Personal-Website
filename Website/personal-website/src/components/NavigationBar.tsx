import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";

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
        <div className="m-3 grid grid-rows-1 grid-flow-col text-center">
            <NavigateLink id={1} text="Youtube" link="/custom-youtube" />
            <NavigateLink id={2} text="Test" link="/test" />
            <NavigateLink id={3} text="About" link="/about" />
        </div>
    );
}
