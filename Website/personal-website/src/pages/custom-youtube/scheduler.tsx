import { useState, useEffect, useRef, Fragment } from 'react';
import Link from "next/link";
import "../../app/globals.css";
import Image from 'next/image';

import {
    CurrentUserCookieInfo, CurrentUserId
} from "@/helperFunctions/cookieManagement";


import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';

import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { styled } from '@mui/system';

import { blue, yellow, cyan } from '@mui/material/colors';

const updateBtnTheme = createTheme({
    palette: {
        primary: {
            main: blue[500],
        },
        secondary: {
            main: blue[700],
        },
    },
});

const selectBtnTheme = createTheme({
    palette: {
        primary: {
            main: cyan["A100"],
        },
        secondary: {
            main: cyan[400],
        },
    },
});

const submitBtnTheme = createTheme({
    palette: {
        primary: {
            main: blue[700],
        },
        secondary: {
            main: blue[900],
        },
    },
});

const CustomSchedBtn = styled(Button)((props: { selected: boolean }) => ({
    backgroundColor: props.selected ? updateBtnTheme.palette.secondary.main : updateBtnTheme.palette.primary.main,
    color: props.selected ? updateBtnTheme.palette.secondary.contrastText : updateBtnTheme.palette.primary.contrastText,
    '&:hover': {
        backgroundColor: props.selected ? updateBtnTheme.palette.secondary.dark : updateBtnTheme.palette.primary.dark,
    },
}));

const CustomSubmitSchedBtn = styled(Button)(() => ({
    backgroundColor: submitBtnTheme.palette.primary.main,
    color: submitBtnTheme.palette.primary.contrastText,
    '&:hover': {
        backgroundColor: submitBtnTheme.palette.primary.dark,
    },
}));

const scheduleBtnOptions = ['Add to Daily', 'Add to Weekly', 'Add to Monthly', 'Remove from Schedule'];
const dbBtnOptions = ['daily', 'weekly', 'monthly', 'unassigned']


export default function Scheduler() {
    const [selectedButton, setSelectedButton] = useState(1);
    const [dailyChannelData, setDailyChannelData] = useState([]);
    const [weeklyChannelData, setWeeklyChannelData] = useState([]);
    const [monthlyChannelData, setMonthlyChannelData] = useState([]);
    const [unassignedChannelData, setUnassignedChannelData] = useState([]);
    var items = [dailyChannelData, weeklyChannelData, monthlyChannelData, unassignedChannelData];

    const [doingOperation, setInOperation] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const currentUserGoogleId = CurrentUserId();

    const wd = 120;  // 480
    const ht = wd / 480 * 270;
    const numSelectorCols = 2;

    const handleScheduleButtonClick = (buttonNumber: number) => {
        setSelectedButton(buttonNumber);
        setInOperation(true);
        setSelectedChannels([]);
    };

    const selectingChannel = (channelName: string) => {
        if (selectedChannels.includes(channelName)) {
            selectedChannels.splice(selectedChannels.indexOf(channelName), 1)
            setSelectedChannels(selectedChannels);
        }
        else {
            setSelectedChannels(selectedChannels.concat([channelName]));
        }
    };


    const SubmitSplitButton = (props: { schedulePageIndex: number, selectedChannels: string[] }) => {
        const [open, setOpen] = useState(false);
        const anchorRef = useRef<HTMLDivElement>(null);
        const [selectedIndex, setSelectedIndex] = useState(-1);

        const currentUserGoogleID = CurrentUserId();

        const handleClick = async () => {
            console.info(`You clicked ${scheduleBtnOptions[selectedIndex]}`);
            console.log(props.selectedChannels);

            try {
                
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/${dbBtnOptions[selectedIndex]}`, {
                    method: 'PUT',
                    mode: 'cors',
                    // credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-google-id': currentUserGoogleId.toString()
                    },
                    body: JSON.stringify({ data: props.selectedChannels, location: dbBtnOptions[selectedIndex] }),
                });
        
                // Check if response is ok (status in the range 200-299)
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
                const data = await response.json();
                console.log("DTA", data);
                return data;
                
            } catch (err) {
                console.error("Error moving info to daily", err);
                return null;
            }
        };

        const handleMenuItemClick = (
            event: React.MouseEvent<HTMLLIElement, MouseEvent>,
            index: number,
        ) => {
            setSelectedIndex(index);
            setOpen(false);
        };

        const handleToggle = () => {
            setOpen((prevOpen) => !prevOpen);
        };

        const handleClose = (event: Event) => {
            if (
                anchorRef.current &&
                anchorRef.current.contains(event.target as HTMLElement)
            ) {
                return;
            }

            setOpen(false);
        };
        return (
            <Fragment >
                <ButtonGroup
                    variant="contained"
                    ref={anchorRef}
                    aria-label="Button group with a nested menu"
                >
                    {(selectedIndex == -1) ? (
                        <div className="border-2 border-blue-500 p-3">Select an Option</div>
                    ) : (
                        <Button onClick={handleClick}>{scheduleBtnOptions[selectedIndex]}</Button>
                    )}
                    <Button
                        size="small"
                        aria-controls={open ? 'split-button-menu' : undefined}
                        aria-expanded={open ? 'true' : undefined}
                        aria-label="select merge strategy"
                        aria-haspopup="menu"
                        onClick={handleToggle}
                    >
                        <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
                <Popper
                    sx={{
                        zIndex: 1,
                    }}
                    open={open}
                    anchorEl={anchorRef.current}
                    role={undefined}
                    transition
                    disablePortal
                >
                    {({ TransitionProps, placement }) => (
                        <Grow
                            {...TransitionProps}
                            style={{
                                transformOrigin:
                                    placement === 'bottom' ? 'center top' : 'center bottom',
                            }}
                        >
                            <Paper>
                                <ClickAwayListener onClickAway={handleClose}>
                                    <MenuList id="split-button-menu" autoFocusItem>
                                        {scheduleBtnOptions.map((option, index) => (
                                            <MenuItem
                                                key={option}
                                                selected={index === selectedIndex}
                                                onClick={(event) => handleMenuItemClick(event, index)}
                                                disabled={props.schedulePageIndex == index}
                                            >
                                                {option}
                                            </MenuItem>
                                        ))}
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
            </Fragment>
        );
    }

    useEffect(() => {
        const fetchUpdateChannels = async (category: string) => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/channels/${category}`, { 
                    method: 'GET', 
                    mode: 'cors',
                    // credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-google-id': currentUserGoogleId.toString()
                    } });
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const data = await response.json();
                // console.log(category,":",data);
                return data;
            }
            catch (error) {
                console.error(`Error getting ${category} channels`, error);
                return null;
            }
        };

        const fetchAll = async () => {
            const [tempLoadedDaily, tempLoadedWeekly, tempLoadedMonthly, tempLoadedUnassigned] = await Promise.all([
                fetchUpdateChannels("daily"),
                fetchUpdateChannels("weekly"),
                fetchUpdateChannels("monthly"),
                fetchUpdateChannels("unassigned"),
            ]);
            setDailyChannelData(tempLoadedDaily);
            setWeeklyChannelData(tempLoadedWeekly);
            setMonthlyChannelData(tempLoadedMonthly);
            setUnassignedChannelData(tempLoadedUnassigned);
            setIsLoading(false);
        }
        // console.log("Fetched all info for user");
        setInOperation(false);
        fetchAll();
    }, [doingOperation])

    if (isLoading) {
        return (
            <div className="text-center font-bold text-2xl">
                Loading Update Schedule Information...
            </div>
        );
    }

    return (
        <main className="">
            <div className="grid justify-items-end mx-5 mt-4">
                <ThemeProvider theme={updateBtnTheme}>
                    <ButtonGroup variant="contained" aria-label="Basic button group">
                        <CustomSchedBtn
                            selected={selectedButton === 1}
                            onClick={() => handleScheduleButtonClick(1)}
                        >
                            Daily
                        </CustomSchedBtn>
                        <CustomSchedBtn
                            selected={selectedButton === 2}
                            onClick={() => handleScheduleButtonClick(2)}
                        >
                            Weekly
                        </CustomSchedBtn>
                        <CustomSchedBtn
                            selected={selectedButton === 3}
                            onClick={() => handleScheduleButtonClick(3)}
                        >
                            Monthly
                        </CustomSchedBtn>
                        <CustomSchedBtn
                            selected={selectedButton === 4}
                            onClick={() => handleScheduleButtonClick(4)}
                        >
                            None
                        </CustomSchedBtn>
                    </ButtonGroup>
                </ThemeProvider>
            </div>

            <div className="grid sm: place-content-center lg:grid-cols-2 lg:justify-items-center border-4 border-stone-200 rounded-lg p-4 mx-5 my-4">
                <ThemeProvider theme={selectBtnTheme}>
                    <FormGroup>
                        {items[selectedButton - 1].slice(0, Math.floor(items[selectedButton - 1].length / numSelectorCols)).map((element: any, index: number) => (
                            <div key={index + selectedButton * 100} className="w-full my-2">
                                <FormControlLabel control={<Checkbox sx={{ color: "whitesmoke" }} onChange={() => { selectingChannel(element["channelNames"]) }} />}
                                    label={
                                        <div className="grid grid-rows-1 grid-flow-col w-full gap-x-2">
                                            <Image src={element["channelImages"]} alt="Channel Image" width={wd / 2} height={ht / 2} />
                                            <div className="font-['Helvetica'] text-xl font-semibold place-content-center">
                                                {element["channelNames"]}
                                            </div>
                                        </div>
                                    } />
                            </div>
                        ))}
                    </FormGroup>

                    <FormGroup>
                        {items[selectedButton - 1].slice(Math.floor(items[selectedButton - 1].length / numSelectorCols)).map((element: any, index: number) => (
                            <div key={index + selectedButton * 100} className="w-full my-2">
                                <FormControlLabel control={<Checkbox sx={{ color: "whitesmoke" }} onChange={() => { selectingChannel(element["channelNames"]) }} />}
                                    label={
                                        <div className="grid grid-rows-1 grid-flow-col w-full gap-x-2">
                                            <Image src={element["channelImages"]} alt="Channel Image" width={wd / 2} height={ht / 2} />
                                            <div className="font-['Helvetica'] text-xl font-semibold place-content-center">
                                                {element["channelNames"]}
                                            </div>
                                        </div>
                                    } />
                            </div>
                        ))}
                    </FormGroup>
                </ThemeProvider>
            </div>
            <div className="grid justify-items-center mx-5 my-4">
                {/* {selectedChannels.length > 0} */}
                <SubmitSplitButton schedulePageIndex={selectedButton - 1} selectedChannels={selectedChannels} />
            </div>
        </main>
    );
}
