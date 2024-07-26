import { useRouter } from 'next/router'
import "../../app/globals.css"

import { useEffect, useRef, useState } from "react";

import videojs from "video.js";
import "videojs-youtube";
import "video.js/dist/video-js.css";
import Component from 'video.js/dist/types/component';

import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';


import { createTheme, ThemeProvider } from '@mui/material/styles';
import { styled } from '@mui/system';

import { red } from '@mui/material/colors';

const initialOptions = {
    controls: true,
    fluid: true,
    controlBar: {
        volumePanel: {
            inline: false
        }
    }
};

function YT_Video(props: { embedID: string }) {
    const videoNode = useRef(null);
    const player = useRef<Component | null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        if (videoNode.current && !initialized.current) {
            initialized.current = true; //prevent duplicate initialization
            player.current = videojs(videoNode.current, {
                ...initialOptions,
                sources: [
                    {
                        type: "video/youtube",
                        src: "https://www.youtube.com/watch?v=" + props.embedID
                    }
                ]
            }).ready(function () {
                console.log("Player Ready");
            });
        }
        //clear up player on dismount
        return () => {
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
    backgroundColor: props.selected ? updateBtnTheme.palette.secondary.main : updateBtnTheme.palette.primary.main,
    color: props.selected ? updateBtnTheme.palette.secondary.contrastText : updateBtnTheme.palette.primary.contrastText,
    '&:hover': {
        backgroundColor: props.selected ? updateBtnTheme.palette.secondary.dark : updateBtnTheme.palette.primary.dark,
    },
}));


export default function VideoScreen() {
    const router = useRouter();
    const [selectedIndex, setSelectedIndex] = useState(1);
    var embedLink = "//www.youtube.com/embed/"
    var videoId = router.query.videoId?.toString();

    // var wd = 1230  // 480
    // var wd = screen.availWidth * 0.98
    // var ht = wd / 480 * 270  // 270

    var multiplier = 0.84;
    var ht = screen.availHeight * multiplier;
    var wd = ht / 9 * 16;
    while (wd > screen.availWidth * 0.99) {
        multiplier -= 0.01;
        ht = screen.availHeight * multiplier;
        wd = ht / 9 * 16
    }

    if (typeof videoId === "undefined") {
        return (
            <div>
                <p>Is Not Working</p>
            </div>
        )
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
    }

    return (
        <>
            <div className="m-3">
                <SelectPlayerOptionsBtns />
            </div>
            {(selectedIndex == 1) ? (
                <div className="grid justify-center text-center mb-4">
                    
                    <iframe width={wd.toString()} height={ht.toString()} src={embedLink.concat(videoId)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share;\">
                    </iframe>
                </div>
            ) : (
                <div className="m-auto mt-20 w-8/12">
                    <YT_Video embedID={videoId} />
                </div>)}
        </>

        // <div className="m-auto mt-20 w-8/12">
        //     <YT_Video embedID={videoId} />
        // </div>
    );
}