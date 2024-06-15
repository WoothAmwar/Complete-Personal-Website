import { useState } from 'react';

export default async function fetchVideoData() {
    try { 
      console.log("PYTHON DID THAT")
      const response = await fetch('http://py-flask-env.eba-mk5qapv6.us-east-2.elasticbeanstalk.com/api/home');
      if (response) {
          const fullRes = await response.json();
          setPythonData(fullRes);
      } else {
          const data = await response.json();
          alert('Something went wrong!' + JSON.stringify(data));
      }
    }
    catch (err) {
      console.log("Error fetching video data from mongodb", err);
    }

  }