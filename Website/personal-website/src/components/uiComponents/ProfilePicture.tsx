import { UserIcon } from "@heroicons/react/20/solid";

type ProfilePictureProps = {
  imageLink: string | undefined;
  imageSize: number;
};

/** Falls back to a neutral placeholder rather than an error string. */
export default function ProfilePicture({ imageLink, imageSize }: ProfilePictureProps) {
  if (!imageLink) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-pill border border-line-subtle bg-inset text-ink-muted"
        style={{ width: imageSize, height: imageSize }}
        aria-hidden="true"
      >
        <UserIcon style={{ width: imageSize * 0.45, height: imageSize * 0.45 }} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="shrink-0 rounded-pill border border-line-subtle object-cover"
      style={{ width: imageSize, height: imageSize }}
      src={imageLink}
      alt=""
      width={imageSize}
      height={imageSize}
    />
  );
}
