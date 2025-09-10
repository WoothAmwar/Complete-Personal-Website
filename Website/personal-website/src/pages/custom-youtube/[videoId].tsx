import { useRouter } from "next/router";
import "../../app/globals.css";

import { SetStateAction, useEffect, useRef, useState } from "react";
import "video.js/dist/video-js.css";

import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { styled } from "@mui/system";

import { red } from "@mui/material/colors";

import Head from "next/head";

import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { channel } from "diagnostics_channel";

const initialOptions = {
  controls: true,
  fluid: true,
  controlBar: {
    volumePanel: {
      inline: false,
    },
  },
};

function YT_Video(props: { embedID: string }) {
  const videoNode = useRef<HTMLVideoElement | null>(null);
  const player = useRef<any>(null);
  const initialized = useRef(false);

  useEffect(() => {
    let disposed = false;
    (async () => {
      if (!videoNode.current || initialized.current) return;
      initialized.current = true; // prevent duplicate initialization
      const videojs = (await import("video.js")).default;
      // await import("videojs-youtube");
      if (disposed) return;
      player.current = videojs(videoNode.current, {
        ...initialOptions,
        sources: [
          { type: "video/youtube", src: "https://www.youtube.com/watch?v=" + props.embedID },
        ],
      }).ready(function () {
        // Player Ready
      });
    })();

    return () => {
      disposed = true;
      if (player.current) {
        player.current.dispose();
      }
    };
  }, [props.embedID]);

  return (
    <div>
      <video ref={videoNode} className="video-js" />
    </div>
  );
}

const updateBtnTheme = createTheme({
  palette: {
    primary: {
      main: red[500],
    },
    secondary: {
      main: red[700],
    },
  },
});

const CustomPlayerBtn = styled(Button)((props: { selected: boolean }) => ({
  backgroundColor: props.selected
    ? updateBtnTheme.palette.secondary.main
    : updateBtnTheme.palette.primary.main,
  color: props.selected
    ? updateBtnTheme.palette.secondary.contrastText
    : updateBtnTheme.palette.primary.contrastText,
  "&:hover": {
    backgroundColor: props.selected
      ? updateBtnTheme.palette.secondary.dark
      : updateBtnTheme.palette.primary.dark,
  },
}));

export default function VideoScreen() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [webVidTitle, setWebVidTitle] = useState("Video");
  var embedLink = "https://www.youtube.com/embed/";
  var videoId = router.query.videoId?.toString();

  // var wd = 1230  // 480
  // var wd = screen.availWidth * 0.98
  // var ht = wd / 480 * 270  // 270
  const [dims, setDims] = useState<{ wd: number, ht: number }>({ wd: 0, ht: 0 });
  useEffect(() => {
    const updateDims = () => {
      let multiplier = 0.84;
      let ht = window.screen.availHeight * multiplier;
      let wd = (ht / 9) * 16;
      while (wd > window.screen.availWidth * 0.99) {
        multiplier -= 0.01;
        ht = window.screen.availHeight * multiplier;
        wd = (ht / 9) * 16;
      }
      setDims({ wd: Math.floor(wd), ht: Math.floor(ht) });
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  const currentUserGoogleId = CurrentUserId();
  useEffect(() => {
    var foundTitle = false;
    // http://localhost:5000/
    // https://anwarkader.com/
    // https://anwarkader.com/api/videos/${currentUserGoogleId.toString()}
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos`, 
        {
            method: 'GET', 
            // credentials: 'include',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleId.toString()
              }
        })
      .then(response => response.json())
      .then(data => {
        data.forEach((channelinfo: any[]) => {
          channelinfo.forEach(videoinfo => {
            if (videoinfo.videoId == videoId) {
              setWebVidTitle(videoinfo?.videoTitle);
              foundTitle = true;
            }
          })
        });
      })
    if (!foundTitle) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracker`, 
        {
            method: 'GET', 
            // credentials: 'include',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleId.toString()
              }
        })
      .then(response => response.json())
      .then(data => {
        data.forEach((videoinfo: { videoID: string | undefined; videoTitle: SetStateAction<string>; }) => {
          if (videoinfo?.videoID == videoId) {
            setWebVidTitle(videoinfo?.videoTitle);
            foundTitle = true;
          }
        });
      })
    }
  }, [currentUserGoogleId, videoId])

  if (typeof videoId === "undefined") {
    return (
      <div>
        <p>Is Not Working</p>
      </div>
    );
  }

  const SelectPlayerOptionsBtns = () => {
    const handleClick = (buttonNumber: number) => {
      console.info(`You clicked index${buttonNumber}`);
      setSelectedIndex(buttonNumber);
    };

    return (
      <main>
        <div className="grid justify-items-end mx-5 mt-4">
          <ThemeProvider theme={updateBtnTheme}>
            <ButtonGroup variant="contained" aria-label="Basic button group">
              <CustomPlayerBtn
                selected={selectedIndex === 1}
                onClick={() => handleClick(1)}
              >
                Youtube
              </CustomPlayerBtn>
              <CustomPlayerBtn
                selected={selectedIndex === 2}
                onClick={() => handleClick(2)}
              >
                Custom
              </CustomPlayerBtn>
            </ButtonGroup>
          </ThemeProvider>
        </div>
      </main>
    );
  };
  
  return (
    <>
      <Head>
        <title>{webVidTitle}</title>
      </Head>
      <div className="m-3">
        <SelectPlayerOptionsBtns />
      </div>
      {selectedIndex == 1 ? (
        <div className="grid justify-center text-center mb-4">
          <iframe
            width = {dims.wd || 800}
            height={dims.ht || 450}
            src={embedLink.concat(videoId)}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
        </div>
      ) : (
        <div className="m-auto mt-20 w-8/12">
          <YT_Video embedID={videoId} />
        </div>
      )}
    </>

    // <div className="m-auto mt-20 w-8/12">
    //     <YT_Video embedID={videoId} />
    // </div>
  );
}
