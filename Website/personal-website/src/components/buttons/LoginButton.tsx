import { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import {
  googleLogout,
  useGoogleLogin,
  type TokenResponse,
} from "@react-oauth/google";

import { Button, LinkButton } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import { CurrentUserCookieInfo } from "../../helperFunctions/cookieManagement";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified: boolean;
}

/** Registers the account with the API. Unchanged contract. */
function registerUser(googleId: string) {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
    method: "PUT",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: googleId }),
  })
    .then((response) => response.json())
    .catch((err) => console.error("Could not register the account", err));
}

function GoogleSignIn({ onDone }: { onDone: () => void }) {
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [, setCookie] = useCookies(["profile"]);
  const [status, setStatus] = useState<"idle" | "working" | "failed">("idle");

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setStatus("working");
      setToken(codeResponse);
    },
    onError: () => setStatus("failed"),
  });

  useEffect(() => {
    if (!token) return;
    axios
      .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token.access_token}`, {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          Accept: "application/json",
        },
      })
      .then((res) => {
        setCookie(
          "profile",
          [res.data.id, res.data.email, res.data.given_name, res.data.picture, res.data.verified_email],
          { path: "/", maxAge: 60 * 60 * 48 }
        );
        return registerUser(res.data.id);
      })
      .then(onDone)
      .catch(() => setStatus("failed"));
  }, [token, setCookie, onDone]);

  return (
    <div className="flex flex-col gap-3">
      {/* <p className="text-sm text-ink-muted">
        Pure Media reads your public subscription list. It never posts, comments
        or changes anything on your YouTube account.
      </p> */}
      <Button
        variant="primary"
        size="lg"
        onClick={() => login()}
        disabled={status === "working"}
        className="text-lg"
      >
        {status === "working" ? "Signing in..." : "Continue with Google"}
      </Button>
      {status === "failed" ? (
        <p className="text-[13px] text-danger">
          Google did not complete the sign in. Close this and try again.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Offline sign in. Skips the Google popup and the googleapis.com call so the
 * app can be developed with no network. Gated behind NEXT_PUBLIC_USE_MOCK_AUTH;
 * see .env.example.
 */
const DEV_USER: UserInfo = {
  id: "dev-user-1",
  email: "dev@example.com",
  name: "Dev User",
  picture: "https://picsum.photos/seed/dev-user/100",
  verified: true,
};

function DevSignIn({ onDone }: { onDone: () => void }) {
  const [, setCookie] = useCookies(["profile"]);

  const devSignIn = () => {
    setCookie(
      "profile",
      [DEV_USER.id, DEV_USER.email, DEV_USER.name, DEV_USER.picture, DEV_USER.verified],
      { path: "/", maxAge: 60 * 60 * 48 }
    );
    registerUser(DEV_USER.id).finally(onDone);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">
        Mock auth is on, so this signs in as a local fixture account without
        contacting Google.
      </p>
      <Button className="text-lg" variant="primary" size="lg" onClick={devSignIn}>
        Sign in as Dev User
      </Button>
    </div>
  );
}

export function useSignedIn() {
  const [cookies] = useCookies(["profile"]);
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setSignedIn(cookies.profile !== null && cookies.profile !== undefined);
  }, [cookies]);
  return signedIn;
}

export function signOut(setCookie: (name: "profile", value: unknown, options: object) => void) {
  googleLogout();
  setCookie("profile", null, { path: "/" });
}

export default function LoginButton({ size = "lg" }: { size?: "md" | "lg" }) {
  const [open, setOpen] = useState(false);
  const signedIn = useSignedIn();
  const useMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "1";
  const profile = CurrentUserCookieInfo();

  if (signedIn) {
    return (
      <LinkButton href="/custom-youtube" variant="primary" size={size}>
        {profile?.name ? `Open your subscriptions` : "Open Pure Media"}
      </LinkButton>
    );
  }

  return (
    <>
      <Button variant="primary" size={size} onClick={() => setOpen(true)}>
        Sign in
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Sign in"
        // description="Your subscriptions, tags and queue are stored against your Google account."
        size="md"
      >
        {useMockAuth ? (
          <DevSignIn onDone={() => setOpen(false)} />
        ) : (
          <GoogleSignIn onDone={() => setOpen(false)} />
        )}
      </Modal>
    </>
  );
}
