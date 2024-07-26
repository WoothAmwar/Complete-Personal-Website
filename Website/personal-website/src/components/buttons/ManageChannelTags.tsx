import Link from "next/link";
import "@/app/globals.css";

import { useState, useEffect, useRef, JSX, memo } from "react";

import axios from "axios";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from '@mui/material/TextField';


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


export const ManageShowTag = memo(function ManageChannelTags(props: { channelName: any }) {
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

    const handleOpenDeleteTag = (tagName: string) => {
        setOpenDeleteModal(true);
        setDeleteTagName(tagName);
    }


    const handleChangeText = (event: any) => {
        setNewTagText(event.target.value);
    };


    const createNewTag = async () => {
        console.log(newTagText);
        const db_text = newTagText.charAt(0).toUpperCase() + newTagText.slice(1);
        try {
            // http://localhost:5000/
            // https://anwarkader.com/
            const response = await fetch(`http://localhost:5000/api/channels/tags/${currentUserGoogleId.toString()}`, {
                method: 'PUT',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
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
            console.log("Tag named", db_text, "added");

            setChannelTags(prevTotalTags => [...prevTotalTags, data["data"]]);
            console.log(data["data"], "versus", data["data"].toString());
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
            const response = await fetch(`http://localhost:5000/api/channels/tags/${currentUserGoogleId.toString()}`, {
                method: 'DELETE',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: { tagName } })
            })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();

            console.log("DEL DATA:", data);
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
        fetch(`http://localhost:5000/api/channels/channelWithTags/${currentUserGoogleId.toString()}/${props.channelName.toString()}`, { method: 'GET', credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                const raw_data = JSON.parse(data["data"]);
                var tag_list = [];
                for (var i = 0; i < raw_data.length; i++) {
                    tag_list.push(raw_data[i]);
                }
                console.log("Setting Channel Tags:", tag_list);
                setChannelTags(tag_list);
                // console.log("Setting Tags for", props.channelName.toString());
            })

    }, [numTotalTags])

    // Getting All Tag Options
    useEffect(() => {
        // http://localhost:5000/
        // https://anwarkader.com/
        console.log("Got all tag options for channel")
        fetch(`http://localhost:5000/api/channels/tags/${currentUserGoogleId.toString()}`, { method: 'GET', credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                // console.log(data);
                setTotalTagOptions(JSON.parse(data["data"]));
                // if (numTotalTags != JSON.parse(data["data"]).length) {
                //     setNumTotalTags(JSON.parse(data["data"]).length)
                // }
            })
    }, [open, numTotalTags])

    // function ListTags(props: { googleID: any, channelName: any, tagOptions: String[], currentTags: String[] }) {

    const add_to_favorite = async (tagName: string) => {
        console.log("Add this:", tagName);
        try {
            // http://localhost:5000/
            // https://anwarkader.com/
            const response = await fetch(`http://localhost:5000/api/channels/channelWithTags/${currentUserGoogleId}/${props.channelName}`, {
                method: 'PUT',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: { tagName } }),
            });

            // Check if response is ok (status in the range 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Adding", data);
            if (data["data"][0] != -1) {
                setChannelTags(prevTags => [...prevTags, data["data"][0]]);
            }
            return data;
        } catch (err) {
            console.error("Error adding favorite", err);
            return null;
        }
    };

    const delete_from_favorite = async (tagName: string) => {
        console.log("Delete this:", tagName);
        try {
            // http://localhost:5000/
            // https://anwarkader.com/
            const response = await fetch(`http://localhost:5000/api/channels/channelWithTags/${currentUserGoogleId}/${props.channelName}`, {
                method: 'DELETE',
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: { tagName } }),
            });

            // Check if response is ok (status in the range 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Delete dta:", data);
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

    const ListItem: React.FC<{ tagName: any }> = ({ tagName }) => {
        return (
            <div className="grid grid-cols-2">
                <div>
                    {currentChannelTags.includes(tagName) ? (
                        <button onClick={() => delete_from_favorite(tagName)}>
                            <p>{tagName} Already Added</p>
                        </button>
                    ) : (
                        <button onClick={() => add_to_favorite(tagName)}>
                            <p>{tagName} Not Added</p>
                        </button>
                    )}
                </div>
                <div>
                    <button onClick={() => handleOpenDeleteTag(tagName)}>Delete Tag: {tagName}</button>
                    <Modal
                        open={openDeleteTagModal}
                        onClose={handleDeleteModalClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Box sx={style} className="rounded-3xl">
                            <Typography id="modal-modal-title" variant="h4" component="h1" className="p-5">
                                Tags
                            </Typography>

                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                Are You Sure You Want to Delete the Tag
                            </Typography>
                            <div className="font-bold italic">{deleteTagName}</div>
                            <div className="grid grid-cols-2">
                                <button onClick={() => { handleDeleteModalClose(); delete_from_favorite(deleteTagName); delete_tag(deleteTagName);}}>Yes</button>
                                <button onClick={handleDeleteModalClose}>Cancel</button>
                            </div>

                        </Box>
                    </Modal>
                </div>
            </div>
        )
    };


    // function ManageTagsModal(props: { googleID: any, channelName: any, tagOptions: String[], currentTags: String[] }) {


    return (
        <div>
            <Button variant="contained"
                sx={{
                    "&.MuiButtonBase-root:hover": {
                        bgcolor: "#1e40af"
                    }
                }} className="rounded-lg bg-black text-white font-['Garamond'] font-semibold text-md" onClick={handleOpen}
            >
                {currentChannelTags.join(" ")}
            </Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style} className="rounded-3xl">
                    <Typography id="modal-modal-title" variant="h4" component="h1" className="p-5">
                        Tags
                    </Typography>

                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        Modal Info
                    </Typography>

                    <div>
                        <p>Name: {props.channelName}</p>
                        <p>All Tags: {allTagOptions}</p>
                        <p>Channel Tags: {currentChannelTags.join(" ")}</p>
                    </div>

                    <div>
                        {allTagOptions.map((tagName, index) => (
                            <div key={index}>
                                <ListItem tagName={tagName} />
                            </div>
                        ))}
                        <div className="grid grid-cols-2 row-span-1 mt-2">
                            <TextField InputProps={{
                                style: { color: '#e7e5e4' }
                            }} size="small" id="outlined-basic" label="New Tag Name" variant="outlined" value={newTagText} onChange={handleChangeText} color="primary" focused />
                            <Button onClick={createNewTag}>Make New Tag</Button>
                        </div>
                    </div>

                </Box>
            </Modal>
        </div>
    );
});

