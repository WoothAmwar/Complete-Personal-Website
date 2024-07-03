import { useState, useEffect } from 'react';
import Link from "next/link";
import "../../app/globals.css"


export default function TrackerPage() {

  const [message, setMessage] = useState("Loading...");

  // Fetch the information every second
  useEffect(() => {
    setInterval(() => {
      fetch("https://anwarkader/api/tracker")
      .then(response => response.json())
      .then(data => {
        setMessage(data.web_chapter);
      })
    }, 1000)

  }, [])


  return (
    <main className="flex flex-col items-center">
      <h2 className="text-center font-semibold text-lg py-4">
        Get Started with Test Place for Web Tracker 1.0 
      </h2>

      <div>
        <p>{message}</p>
      </div>

    </main>
  );
}
