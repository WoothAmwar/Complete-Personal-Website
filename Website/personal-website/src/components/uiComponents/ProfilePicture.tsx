
type ProfilePictureProps = {
    imageLink: string | undefined,
    imageSize: number;
};

export default function ProfilePicture({imageLink, imageSize}: ProfilePictureProps) {
    if (imageLink === undefined) {
        return (
            <p>Image not Found</p>
        )
    }
    return (
        <img style={{
            borderRadius: "50%",
            width: imageSize,
            height: imageSize,
            display: "block"
          }} src={imageLink} alt="user image" width="40em"/>
    )
}