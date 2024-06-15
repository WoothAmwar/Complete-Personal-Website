import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";

import OrderByTime from "../components/UploadOrder";

function getFullDate() {
  const dt = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  let hour = dt.getHours();
  let isAM = true;
  if (hour == 0) {
    hour = 12;
    isAM = true;
  }
  else if (hour > 12) {  // P.M.
    hour -= 12;
    isAM = false;
  }
  else if (hour < 12) {
    isAM = true;
  }
  const minute = dt.getMinutes();
  const day = days[dt.getDay()];
  const date = dt.getDate();
  const month = months[dt.getMonth()];
  const year = dt.getFullYear();

  return day+", "+month+" "+date+", "+year+", at "+hour+":"+(minute<10 ? "0"+minute : minute)+" "+(isAM ? "AM" : "PM");
}

function isUpdateTime() {
  const dt = new Date();

  if ((dt.getHours() == 11) && (dt.getMinutes() == 29) && (dt.getSeconds() <= 52)) {
    return true;
  }
  return false;
}

function isResetTime() {
  const dt = new Date();

  if ((dt.getHours() == 23) && (dt.getMinutes() == 1) && (dt.getSeconds() == 1)) {
    return true;
  }
  return false;
}

var msg = "Loading...";
export default function Test() {

  const [message, setMessage] = useState("Loading...");
  const [isTime, setIsTime] = useState("NOT NOW");
  const [date, setFullDate] = useState("Loading...");

  var ranFunction = false;
  useEffect(() => {
    setInterval(() => {

      if (isUpdateTime() && (!ranFunction)) {  // if it is time to update and you haven't already ran the function
        setIsTime("NOW");
        ranFunction = true;

        // http://py-flask-env.eba-mk5qapv6.us-east-2.elasticbeanstalk.com
        // http://localhost:5000
        // anwarkader.com
        fetch("https://anwarkader.com/api/home")
          .then(response => response.json())
          .then(data => {
            // setMessage(data.py_data);
            msg = data.py_data;
          })

      } else if (isResetTime()) {
        ranFunction = false;
      } 
    
      setFullDate(getFullDate());
      setMessage(msg);
    }, 1000)
  }, [])
  // console.log("MSG:", message);


  return (
    <main className="flex flex-col items-center">
      <h2 className="text-center font-semibold text-lg py-4">
        Get Started with Test Place for Youtube 2.0 9:50
      </h2>

      <div>
        <p>{date}</p> 
        <p>{message}</p>
        <p>{isTime}</p>
      </div>


    </main>
  );
}
