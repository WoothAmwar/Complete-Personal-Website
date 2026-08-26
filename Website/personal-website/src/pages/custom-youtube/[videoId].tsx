import { useRouter } from "next/router";

import { SetStateAction, useEffect, useRef, useState } from "react";
// import "video.js/dist/video-js.css";

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

  const ytPlayerRef = useRef<any>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [videoDone, setVideoDone] = useState<boolean>(false);
  
  var embedLink = "https://www.youtube.com/embed/";
  var videoId = router.query.videoId?.toString();

  const RESIZE_MULTIPLIER = 0.96;
  const [dims, setDims] = useState<{ wd: number, ht: number }>({ wd: 0, ht: 0 });
  useEffect(() => {
    const updateDims = () => {
      setDims({
        wd: Math.floor(window.innerWidth * RESIZE_MULTIPLIER),
        ht: Math.floor(window.innerHeight * RESIZE_MULTIPLIER),
      });
    };
    updateDims();
    // Makes the dims responsive 
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  const currentUserGoogleId = CurrentUserId();
  useEffect(() => {
    var foundTitle = false;
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
              {/* <CustomPlayerBtn
                selected={selectedIndex === 2}
                onClick={() => handleClick(2)}
              >
                Custom
              </CustomPlayerBtn> */}
            </ButtonGroup>
          </ThemeProvider>
        </div>
      </main>
    );
  };

  useEffect(() => {
    if (selectedIndex !== 1 || !videoId) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const createPlayer = () => {
      if (cancelled) return;
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
      let done = false;
      ytPlayerRef.current = new (window as any).YT.Player('player', {
        height: dims.ht || 450,
        width: dims.wd || 800,
        videoId: videoId,
        playerVars: {
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
            setDuration(event.target.getDuration());
            pollId = setInterval(() => {
              if (ytPlayerRef.current) {
                setCurrentTime(ytPlayerRef.current.getCurrentTime());
              }
            }, 1000);
          },
          onStateChange: (event: any) => {
            if (event.data == (window as any).YT.PlayerState.PLAYING && !done) {
              done = true;
            }
            else if (event.data == (window as any).YT.PlayerState.ENDED) {
              setVideoDone(true);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      const previousCallback = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
    // dims is deliberately excluded: resizing the window should resize the existing
    // player rather than destroy/recreate it and restart playback.
  }, [selectedIndex, videoId]);

  useEffect(() => {
    if (!dims.wd || !dims.ht) return;
    ytPlayerRef.current?.setSize(dims.wd, dims.ht);
  }, [dims.wd, dims.ht]);

  if (typeof videoId === "undefined") {
    return (
      <div>
        <p>Is Not Working</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{webVidTitle}</title>
      </Head>
      {/* <div className="m-3">
        <SelectPlayerOptionsBtns />
      </div> */}
      <div className="bg-black">
      {selectedIndex == 1 ? (
        <div className="grid justify-center text-center mb-4">
          <div id="player"></div>
          <div className="mt-3">{videoDone ? "Video has Finished" : null} </div>
        </div>
      ) : (
        <div className="m-auto mt-20 w-8/12">
          <YT_Video embedID={videoId} />
        </div>
      )}
      </div>
    </>

    // <div className="m-auto mt-20 w-8/12">
    //     <YT_Video embedID={videoId} />
    // </div>
  );
}
