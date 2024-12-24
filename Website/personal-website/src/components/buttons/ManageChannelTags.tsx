import Link from "next/link";
import "@/app/globals.css";

import { useState, useEffect, useRef, JSX, Fragment, memo, useMemo, useCallback } from "react";

import axios from "axios";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from '@mui/material/TextField';

import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';

import {
    CurrentUserId
} from "../../helperFunctions/cookieManagement";

// import YoutubeHomepage from "../pages/YtHomepage";
// import About from "../pages/About";

const style = {
    position: "absolute" as "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    height: 600,
    bgcolor: "#0f172a",
    color: "#e7e5e4",
    boxShadow: 24,
    p: 4
};

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

const getTailwindBgColor = (color: string, strengthNumber: number) => {
    return `bg-${color}-${strengthNumber}`;
}

function ChannelTagUI(tagNames: string[], updateVal: number, onButtonClick: () => void) {
    const [uiSymbols, setUISymbols] = useState<string[]>([" ", " ", " "]);
    const [uiBackgrounds, setUIBackgrouds] = useState<string[]>([]);
    const DEFAULT_BG = "bg-gray-900";
    const currentUserGoogleId = CurrentUserId();

    // TODO - X - Get the background information from the db for each uiSymbol
    useEffect(() => {
        var defaultSymbolValues: string[] = [" ", " ", " "];
        for (var i = 0; i < Math.min(tagNames.length, 3); i++) {
            // console.log("T:", tagNames, "\n TN:", tagNames[i])
            defaultSymbolValues[i] = tagNames[i].slice(0, 1);
        }
        setUIBackgrouds([]); // Reset the backgrounds

        const fetchColorPromises = tagNames.map(tagname =>
            // http://localhost:5000/
            // https://anwarkader.com/
            // https://anwarkader.com/api/channels/colorsOfTag/${currentUserGoogleId.toString()}/${tagname}
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/colorsOfTag/${tagname}`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'x-google-id': currentUserGoogleId.toString()
                  }
                // credentials: 'include'
            })
                .then(response => response.json())
                .then(data => ({
                    tagname,
                    // color: JSON.parse(data["data"])
                    color: data
                }))
        );

        Promise.all(fetchColorPromises)
            .then(results => {
                setUIBackgrouds(results.map(result => result.color));
                //console.log("Set colors for tags:", results);
            })
            .catch(error => {
                console.error("Error fetching tag colors:", error);
            });

        setUISymbols(defaultSymbolValues);

    }, [tagNames, updateVal])

    return (
        <div className="grid grid-cols-1 grid-rows-4 gap-y-1 text-center w-10">
            <div className={`border-2 border-gray-600 border-solid rounded-full place-self-center w-6 h-6 
                ${(uiSymbols[0] != " ") ? (getTailwindBgColor(uiBackgrounds[0], 400)) : (DEFAULT_BG)}`}>
                {uiSymbols[0]}
            </div>
            <div className={`border-2 border-gray-600 border-solid rounded-full place-self-center w-6 h-6
                ${(uiSymbols[1] != " ") ? (getTailwindBgColor(uiBackgrounds[1], 400)) : (DEFAULT_BG)}`}>
                {uiSymbols[1]}
            </div>
            <div className={`border-2 border-gray-600 border-solid rounded-full place-self-center w-6 h-6
                ${(uiSymbols[2] != " ") ? (getTailwindBgColor(uiBackgrounds[2], 400)) : (DEFAULT_BG)}`}>
                {uiSymbols[2]}
            </div>
            <div className="border-2 border-gray-600 border-solid rounded-full place-self-center w-6 h-6">
                <button onClick={onButtonClick} className="m-auto place-content-center text-slate-400 w-full h-full">
                    :
                </button>
            </div>

        </div>
    )
}

export function ManageShowTag(props: { channelName: any }) {
    const [currentChannelTags, setChannelTags] = useState<string[]>([]);
    const [allTagOptions, setTotalTagOptions] = useState<string[]>([]);
    const [numTotalTags, setNumTotalTags] = useState(-1);

    const currentUserGoogleId = CurrentUserId();

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [newTagText, setNewTagText] = useState("");

    const [openDeleteTagModal, setOpenDeleteModal] = useState(false);
    const [deleteTagName, setDeleteTagName] = useState("");
    const handleDeleteModalClose = () => setOpenDeleteModal(false);

    // Used only to update channelTagUI
    const [updateChannelTags, setUpdateChannelTags] = useState(0);

    const handleOpenDeleteTag = useCallback((tagName: string) => {
        setOpenDeleteModal(true);
        setDeleteTagName(tagName);
    }, []);


    const handleChangeText = useCallback((event: any) => {
        setNewTagText(event.target.value);
    }, []);


    const createNewTag = async () => {
        // console.log(newTagText);
        if (newTagText.length < 1) {
            return;
        }
        const db_text = newTagText.charAt(0).toUpperCase() + newTagText.slice(1);
        try {
            // http://localhost:5000/
            // https://anwarkader.com/
            // https://anwarkader.com/api/channels/tags/${currentUserGoogleId.toString()}
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/tags`, {
                method: 'PUT',
                mode: 'cors',
                // credentials: 'include',
                headers: {
                'Content-Type': 'application/json',
                'x-google-id': currentUserGoogleId.toString()
                },
                body: JSON.stringify({ data: { db_text } }),
            })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (data["data"] == -1) {
                return;
            }
            // console.log("Tag named", db_text, "added");

            setChannelTags(prevTotalTags => [...prevTotalTags, data["data"]]);
            // console.log(data["data"], "versus", data["data"].toString());
            setNumTotalTags(numTotalTags + 1);
            add_to_favorite(data["data"])
        }
        catch (err) {
            console.error("Error adding tag", err);
        }
    }

    const delete_tag = async (tagName: string) => {
        try {
            // http://localhost:5000/
            // https://anwarkader.com/
            // https://anwarkader.com/api/channels/tags/${currentUserGoogleId.toString()}
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/tags`, {
                method: 'DELETE',
                mode: 'cors',
                // credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-google-id': currentUserGoogleId.toString()
                },
                body: JSON.stringify({ data: { tagName } })
            })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            // console.log("DEL DATA:", data);
            setNumTotalTags(numTotalTags - 1);
            window.location.reload();
            return data;
        } catch (err) {
            console.error("Error deleting tag", err);
            return null;
        }
    }

    // Getting Current Channel Tags
    useEffect(() => {
        // http://localhost:5000/
        // https://anwarkader.com/
        // https://anwarkader.com/api/channels/channelWithTags/${currentUserGoogleId.toString()}/${props.channelName.toString()}
        // console.log("LAST:", props.channelName.toString());

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/channelWithTags/${props.channelName.toString()}`, 
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
                // console.log("DTA C.1:", data["data"]);
                // const raw_data = data;
                // var tag_list = [];
                // for (var i = 0; i < raw_data.length; i++) {
                //     tag_list.push(raw_data[i]);
                // }
                // console.log("Setting Channel Tags:", tag_list);
                setChannelTags(data["data"]);
                // console.log("Setting Tags for", props.channelName.toString());
            })
        // setChannelTags(["Gaming"]);

    }, [numTotalTags])

    // Getting All Tag Options
    useEffect(() => {
        // http://localhost:5000/
        // https://anwarkader.com/
        // https://anwarkader.com/api/channels/tags/${currentUserGoogleId.toString()}
        // console.log("Got all tag options for channel")
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/tags`, 
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
                // console.log("DTA 4.1:", data);
                setTotalTagOptions(data);
                // if (numTotalTags != JSON.parse(data["data"]).length) {
                //     setNumTotalTags(JSON.parse(data["data"]).length)
                // }
            })
    }, [open, numTotalTags])

    // function ListTags(props: { googleID: any, channelName: any, tagOptions: String[], currentTags: String[] }) {

    const add_to_favorite = async (tagName: string) => {
        // console.log("Add this:", tagName);
        try {
            // http://localhost:5000/
            // https://anwarkader.com/
            // https://anwarkader.com/api/channels/channelWithTags/${currentUserGoogleId}/${props.channelName}
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/channelWithTags/${props.channelName}`, {
                method: 'PUT',
                mode: 'cors',
                // credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-google-id': currentUserGoogleId.toString()
                },
                body: JSON.stringify({ data: { tagName } }),
            });

            // Check if response is ok (status in the range 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            // console.log("Adding", data);
            if (data[0] != -1) {
                setChannelTags(prevTags => [...prevTags, data[0]]);
            }
            return data;
        } catch (err) {
            console.error("Error adding favorite", err);
            return null;
        }
    };

    const delete_from_favorite = async (tagName: string) => {
        // console.log("Delete this:", tagName);
        try {
            // http://localhost:5000/
            // https://anwarkader.com/
            // https://anwarkader.com/api/channels/channelWithTags/${currentUserGoogleId}/${props.channelName}
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/channelWithTags/${props.channelName}`, {
                method: 'DELETE',
                mode: 'cors',
                // credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-google-id': currentUserGoogleId.toString()
                },
                body: JSON.stringify({ data: { tagName } }),
            });

            // Check if response is ok (status in the range 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            // console.log("Delete dta:", data);
            if (data["data"][0] != -1) {
                // var saved_channel_tags = currentChannelTags;
                // saved_channel_tags.splice(currentChannelTags.indexOf(tagName, 0), 1);
                // setChannelTags(saved_channel_tags);
                setChannelTags(prevTags => prevTags.filter(tag => tag !== tagName));
            }
            return data;
        } catch (err) {
            console.error("Error deleting favorite", err);
            return null;
        }
    };

    const TagColorSelectionDropdown = memo(function TagColDropDown(props: { tagName: string | any }) {
        const TAG_COLORS = [["red", "orange", "amber", "yellow", "lime", "green"], ["emerald", "teal",
            "cyan", "sky", "blue", "indigo"], ["violet", "purple", "fuchsia", "pink", "rose",
            "stone"]
        ]

        const [currentTagBG, setCurrentTagBG] = useState("");

        useEffect(() => {
            // TODO - X - get the color for the corresponding tag, saved as "gray", "red", etc. not "bg-gray-400"
            // const tagColor = "blue";
            // setCurrentTagBG(getTailwindBgColor(tagColor, 400));
            // http://localhost:5000/
            // https://anwarkader.com/
            // https://anwarkader.com/api/channels/colorsOfTag/${currentUserGoogleId.toString()}/${props.tagName}
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/colorsOfTag/${props.tagName}`, {
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
                    // setCurrentTagBG(getTailwindBgColor(JSON.parse(data["data"]), 400));
                    setCurrentTagBG(getTailwindBgColor(data, 400));
                    // console.log("Getting the color", data["data"], "for", props.tagName);
                })
        }, [props.tagName])

        const onTagColorClick = (color: string) => {
            // TODO - X - set the color of the corresponding tag in the db
            // console.log(`Change ${props.tagName.toString()} to ${getTailwindBgColor(color, 00)}-400`);
            // setCurrentTagBG(getTailwindBgColor(color, 400));

            // http://localhost:5000/
            // https://anwarkader.com/
            // https://anwarkader.com/api/channels/colorsOfTag/${currentUserGoogleId.toString()}/${props.tagName}
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/colorsOfTag/${props.tagName}`, {
                method: 'PUT',
                mode: 'cors',
                // credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'x-google-id': currentUserGoogleId.toString()
                },
                body: JSON.stringify({ data: { "tagColor": color } }),
            })
                .then(response => response.json())
                .then(data => {
                    // setCurrentTagBG(getTailwindBgColor(JSON.parse(data["data"]), 400));
                    setCurrentTagBG(getTailwindBgColor(data, 400));
                    setUpdateChannelTags(updateChannelTags + 1);
                    // console.log("Setting the color", data["data"], "for", props.tagName);
                })
        }

        return (
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button className={`border-2 border-gray-600 border-solid rounded-full place-self-center w-6 h-6 ${currentTagBG}`}>
                        <ChevronDownIcon className="-mr-1 h-5 w-5 text-zinc-950" aria-hidden="true" />
                    </Menu.Button>
                </div>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute start-0 z-10 my-2 w-28 h-48 rounded-md bg-gray-900 shadow-lg ring-1 ring-black ring-opacity-5 
                    grid grid-flow-row grid-cols-3 auto-rows-min flex justify-center
                    focus:outline-none">
                        {
                            TAG_COLORS.map((colorArray, arr_index) => (
                                <div className="col-span-1" key={arr_index}>
                                    {
                                        colorArray.map((tagColor, index) => (
                                            <Menu.Item key={index}>
                                                {({ active }) => (
                                                    <button
                                                        className={classNames(
                                                            active ? 'bg-gray-100 text-gray-400' : 'text-gray-200',
                                                            'block px-2 py-1 text-sm'
                                                        )}
                                                        onClick={() => onTagColorClick(tagColor)}
                                                    >
                                                        <div className={`border-2 border-gray-600 border-solid rounded-full place-self-center w-6 h-6 ${getTailwindBgColor(tagColor, 400)}`}>
                                                        </div>
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        ))
                                    }
                                </div>
                            ))
                        }
                    </Menu.Items>
                </Transition>
            </Menu>
        )
    }, (prevProps, nextProps) => {
        return prevProps.tagName === nextProps.tagName;
    });

    const ListItem: React.FC<{ tagName: any }> = memo(function SingularItem(props: { tagName:any }) {
        // const channelHasTag: Boolean = currentChannelTags.includes(tagName);
        const MemoizedTagColorDropdown = useMemo(() => (
            <TagColorSelectionDropdown tagName={props.tagName.toString()} />
        ), [props.tagName]);

        return (
            <div className="grid grid-cols-5 row-span-1 justify-items-stretch ml-4">
                <div>
                    {/* <TagColorSelectionDropdown tagName={tagName.toString()} /> */}
                    {MemoizedTagColorDropdown}
                </div>
                <div className="col-start-2 col-span-3">
                    <button className="grid grid-cols-3 w-full" onClick={() =>
                        (currentChannelTags.includes(props.tagName) ? (delete_from_favorite(props.tagName)) : (add_to_favorite(props.tagName)))}
                    >
                        <p className="text-left col-span-2">{props.tagName}</p>
                        <div>{(currentChannelTags.includes(props.tagName) ? (<CheckIcon />) : (""))}</div>
                    </button>
                </div>
                <div className="col-start-5 justify-self-end">
                    <button onClick={() => handleOpenDeleteTag(props.tagName)}>
                        {/* Delete Tag: {tagName} */}
                        <DeleteOutlineIcon />
                    </button>
                    <Modal
                        open={openDeleteTagModal}
                        onClose={handleDeleteModalClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Box sx={style} className="rounded-3xl">
                            <Typography id="modal-modal-title" variant="h4" component="h1" className="p-5">
                                Delete {deleteTagName}
                            </Typography>

                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                Are You Sure You Want to Delete the Tag
                            </Typography>
                            <div className="font-bold italic">{deleteTagName}</div>
                            <div className="grid grid-cols-2">
                                <button onClick={() => { handleDeleteModalClose(); delete_from_favorite(deleteTagName); delete_tag(deleteTagName); }}>Yes</button>
                                <button onClick={handleDeleteModalClose}>Cancel</button>
                            </div>

                        </Box>
                    </Modal>
                </div>
            </div>
        )
    });

    return (
        <div>
            {ChannelTagUI(currentChannelTags, updateChannelTags, handleOpen)}
            {/* <Button variant="contained"
                sx={{
                    "&.MuiButtonBase-root:hover": {
                        bgcolor: "#1e40af"
                    }
                }} className="rounded-lg bg-black text-white font-['Garamond'] font-semibold text-md" onClick={handleOpen}
            >
                {currentChannelTags.join(" ")}
            </Button> */}
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="rounded-3xl">
                    <Typography id="modal-modal-title" variant="h4" component="h1" className="p-5">
                        {props.channelName} Tags
                    </Typography>

                    {/* <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Modal Info
                    </Typography> */}

                    {/* <div>
                        <p>Name: {props.channelName}</p>
                        <p>All Tags: {allTagOptions}</p>
                        <p>Channel Tags: {currentChannelTags.join(" ")}</p>
                    </div> */}

                    <div className="h-4/6 overflow-y-auto scroll-smooth">
                        {allTagOptions.map((tagName, index) => (
                            <div key={index}>
                                <ListItem tagName={tagName} />
                            </div>
                        ))}
                        {/* <div className="grid grid-cols-2 row-span-1 mt-2">

                            <TextField InputProps={{
                                style: { color: '#e7e5e4' }
                            }} size="small" id="outlined-basic" label="New Tag Name" variant="outlined" value={newTagText} onChange={handleChangeText} color="primary" focused />
                            <Button onClick={createNewTag}>Make New Tag</Button>
                        </div> */}
                    </div>
                    <div className="grid grid-cols-2 row-span-1 mt-2">
                        <TextField InputProps={{
                            style: { color: '#e7e5e4' }
                        }} size="small" id="outlined-basic" label="New Tag Name" variant="outlined" value={newTagText} onChange={handleChangeText} color="primary" focused />
                        <Button onClick={createNewTag}>Make New Tag</Button>
                    </div>

                </Box>
            </Modal>
        </div>
    );
}

