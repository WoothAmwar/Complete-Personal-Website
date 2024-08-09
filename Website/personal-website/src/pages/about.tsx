import React, { useEffect, useState } from "react";
import "../app/globals.css";

import { CookiesProvider, useCookies } from 'react-cookie'

export default function About() {


  return (
    <CookiesProvider>
      <div className="mx-4">
        <div className="text-3xl text-center"> About this Project </div>
        <div className="mx-32">
          <div className="text-lg">
            <p>
              YouTube Without Ads <br /> Add Tags to Channels <br /> Updated Once a Day at 3:30 UTC
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
          </div>
        </div>
      </div>
    </CookiesProvider>
  );
}
