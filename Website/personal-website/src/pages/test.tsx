import { useState, useEffect } from 'react';
import Link from "next/link";
import "../app/globals.css";

import OrderByTime from "../components/UploadOrder";

import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { CookiesProvider, useCookies } from 'react-cookie';

import { CurrentUserCookieInfo } from "../helperFunctions/cookieManagement";

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

// function LoginUser() {
//   const [user, setUser] = useState(null);
//   const [profile_cookie, setCookie] = useCookies(['profile']);
//   const [userProfile, setUserProfile] = useState(null);

//   const login = useGoogleLogin({
//     onSuccess: (codeResponse) => setUser(codeResponse),
//     onError: (error) => console.log('Login Failed:', error)
//   });

//   useEffect(() => {
//     if (user) {
//       axios
//         .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
//           headers: {
//             Authorization: `Bearer ${user.access_token}`,
//             Accept: 'application/json'
//           }
//         })
//         .then((res) => {
//           setCookie('profile', [
//             res.data.id,
//             res.data.email,
//             res.data.given_name,
//             res.data.picture,
//             res.data.verified_email
//           ], { path: '/' });
//         })
//         .catch((err) => console.log(err));
//     }
//   }, [user, setCookie]);

//   useEffect(() => {
//     if (profile_cookie.profile) {
//       const userProfile = CurrentUserCookieInfo(undefined);
//       setUserProfile(userProfile);
//     }
//   }, [profile_cookie]);

//   const logOut = () => {
//     googleLogout();
//     setCookie('profile', null, { path: '/' });
//     setUserProfile(null);
//   };

//   return (
//     <CookiesProvider>
//       <div>
//         <h2>React Google Login</h2>
//         <br />
//         <br />
//         {userProfile ? (
//           <div>
//             <img src={userProfile.picture} alt="user image" />
//             <h3>User Logged in</h3>
//             <p>Name: {userProfile.name}</p>
//             <p>Email Address: {userProfile.email}</p>
//             <br />
//             <br />
//             <button onClick={logOut}>Log out</button>
//           </div>
//         ) : (
//           <button onClick={() => login()}>Sign in with Google 🚀 </button>
//         )}
//       </div>
//     </CookiesProvider>
//   );
// }

var msg = "Loading...";
export default function Test() {

  // const [message, setMessage] = useState("Loading...");
  const [date, setFullDate] = useState("Loading...");

  useEffect(() => {
    setInterval(() => {
    
      setFullDate(getFullDate());
    }, 1000)
  }, [])


  return (
    <main className="flex flex-col items-center">
      <h2 className="text-center font-semibold text-lg py-4">
        Get Started with Test Place for Youtube 2.0
      </h2>

      <div>
        <p>{date}</p> 
        <div className="lg:text-green-400 md:text-yellow-400 sm:text-red-400 text-orange-300">
          Large screen has green text, medium screen has yellow text, small screen has red text, anything else has orange text
        </div>

      </div>

    </main>
  );
}
