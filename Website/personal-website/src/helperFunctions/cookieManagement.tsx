import React, { useState, useEffect } from 'react';
import { CookiesProvider, useCookies } from 'react-cookie';

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified: boolean;
}


export function CurrentUserCookieInfo():UserInfo | null {
  const [profile_cookie] = useCookies(['profile']);

  if (profile_cookie.profile) {
    const json_cook : UserInfo = {
      id: profile_cookie.profile[0] ,
      email: profile_cookie.profile[1],
      name: profile_cookie.profile[2],
      picture: profile_cookie.profile[3],
      verified: profile_cookie.profile[4]
    };
    return json_cook;
  }
  return null;
}




