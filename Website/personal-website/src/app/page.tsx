import Link from "next/link";
import "./globals.css";

// import YoutubeHomepage from "../pages/YtHomepage";
// import About from "../pages/About";

export default function Home() {

  return (
    <ul>
      <li>
        <Link href="/test"> Tester </Link>
      </li>
      <li>
        <Link href="/about"> About </Link>
      </li>
      <li>
        <Link href="/custom-youtube"> Youtube Homepage </Link>
      </li>
    </ul>
  )
}
