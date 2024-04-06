import ChannelNameData from "../../../../YoutubeData/automaticChannelNameInfo.json";
import ChannelImageData from "../../../../YoutubeData/automaticChannelImageInfo.json";
import VideoIds from "../../../../YoutubeData/automaticVideoIdInfo.json";
import VideoImageData from "../../../../YoutubeData/automaticVideoThumbnailInfo.json";
import VideoTitleData from "../../../../YoutubeData/automaticVideoTitleInfo.json";

// String
export function ChannelNameFileData(idx) {
    return ChannelNameData["names"][idx]
}

// String
export function ChannelImageFileData(idx) {
    return ChannelImageData["channelImages"][idx]
}

// List
export function VideoFileData(idx) {
    return VideoIds["videoIds"][idx]
}

// List
export function VideoImageFileData(idx) {
    return VideoImageData["videoThumbnails"][idx]
}

// List
export function VideoTitleFileData(idx) {
    return VideoTitleData["videoTitles"][idx]
}