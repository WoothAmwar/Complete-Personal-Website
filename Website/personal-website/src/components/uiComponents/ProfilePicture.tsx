import Image from "next/image";

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
        <Image 
          style={{
            borderRadius: "50%",
            borderColor: "azure",
            borderWidth: "2px",
            display: "block"
          }}
          src={imageLink}
          alt="user image"
          width={imageSize}
          height={imageSize}
        />
    )
}
