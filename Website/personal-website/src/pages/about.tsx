import React, { useEffect, useState } from "react";
import "../app/globals.css";

import { CookiesProvider, useCookies } from 'react-cookie'

export default function About() {
  const [channelTags, setChannelTags] = useState([]);

  useEffect(() => {
    const channelName = "Fundy";
    const currentUserGoogleId = "113385767862195154808";
    // http://localhost:5000/
    // https://anwarkader.com/
    // https://anwarkader.com/api/channels/channelWithTags/${currentUserGoogleId.toString()}/${props.channelName.toString()}
    // console.log("LAST:", props.channelName.toString());
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/channelWithTags/${channelName.toString()}`, 
        { 
            method: 'GET', 
            // credentials: 'include' 
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleId.toString()
            }
        })
        .then(response => response.json())
        .then(data => {
            // const raw_data = JSON.parse(data["data"]);
            console.log("DTA C.1:", data["data"]);
            // const raw_data = data;
            // var tag_list = [];
            // for (var i = 0; i < raw_data.length; i++) {
            //     tag_list.push(raw_data[i]);
            // }
            // console.log("Setting Channel Tags:", tag_list);
            setChannelTags(data["data"]);
            // console.log("Setting Tags for", props.channelName.toString());
        })

}, [])

  return (
    <CookiesProvider>
      <div className="mx-4">
        <div className="text-3xl text-center"> About this Project </div>
        <div className="md:mx-32 mx-4">
          <div className="text-lg">
            <p>
              YouTube Without Ads <br /> Add Tags to Channels <br /> Updated Once a Day at 3:30 UTC
              <br />{channelTags}
            </p>
            <p>
              Save YouTube videos with the Tracker <br /> Find Favorite Videos in your personal dashboard.
            </p>
          </div>

          <br />

          <div>
            <div className="text-2xl">How to Get an API Key</div>
            <ol className="list-decimal">
              <li>Go to <a className="text-blue-400" href={"https://console.cloud.google.com/"}> https://console.cloud.google.com/</a></li>
              <li>In the Search Bar, type <span className="text-gray-400">YouTube Data API</span> to find the YouTube Data API v3 API</li>
              <li>Click the <span className="text-gray-400">ENABLE</span> button</li>
              <li>You should be redirected to a new screen. On the Left Side there should be an option called <span className="text-gray-400">Credentials</span> Click on this option</li>
              <li>Near the top of the screen should be a button <span className="text-sky-600">+Create Credentials</span> Click on this option.</li>
              <li>When you click on this option, there should be an option called <span className="text-gray-400">API Key</span> Click on this option.</li>
              <li>There should be an API key that appears on screen. Copy this API key. If you ever need to retrieve this key, there should now be something called <span className="text-gray-400">API key 1</span> under API Keys in the credentials option, where you can find the API Key</li>
              <li>Take this API Key and enter it into your Dashboard on this website</li>
            </ol>
          </div>

          <br />

          <div>
            <div className="text-2xl">How to Get your YouTube Channel ID</div>
            <ol className="list-decimal">
              <li>Go to <a className="text-blue-400" href={"https://youtube.com"}>https://youtube.com</a></li>
              <li>Click on your Profile Picture to go to Settings, or use another method to get to your Account Settings</li>
              <li>There should be an option called <span className="text-gray-400">Advanced Settings</span> Click on this option</li>
              <li>Take this Channel ID and enter it into your Dashboard on this website</li>
            </ol>

            <div className="text-2xl">*IMPORTANT* Make Your Channel Subscriptions Public</div>
            <ol className="list-decimal">
              <li>Go to <a className="text-blue-400" href={"https://youtube.com"}>https://youtube.com</a></li>
              <li>Click on your Profile Picture to go to Settings, or use another method to get to your Account Settings</li>
              <li>There should be an option called <span className="text-gray-400">Privacy</span> Click on this option</li>
              <li>Turn off the option to <span className="text-gray-400">Keep all my subscriptions private</span> by clicking on the slider</li>
            </ol>
          </div>
        </div>
      </div>
    </CookiesProvider>
  );
}
