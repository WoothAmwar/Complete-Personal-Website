import { Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, Transition } from "@headlessui/react";

import {
  ChevronDownIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/20/solid";
import { motion } from "motion/react";

import { CurrentUserCookieInfo, useMounted } from "@/helperFunctions/cookieManagement";
import { useTheme, type ThemePreference } from "@/components/theme/ThemeProvider";
import { cx } from "@/components/ui/primitives";

/** Always visible. These are the two surfaces the product is used from daily. */
const PRIMARY_LINKS = [
  { href: "/custom-youtube", label: "Youtube" },
  { href: "/tracker", label: "Tracker" },
];

/** Everything else lives behind More, along with the appearance control. */
const SECONDARY_LINKS = [
  { href: "/dashboard", label: "Dashboard", hint: "Profile, keys, favorites" },
  { href: "/custom-youtube/scheduler", label: "Update schedule", hint: "How often channels refresh" },
  { href: "/about", label: "About", hint: "Setup guides and features" },
];

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  Icon: typeof SunIcon;
}> = [
  { value: "system", label: "System", Icon: ComputerDesktopIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "relative rounded-control px-3 py-2 text-sm font-medium transition-colors duration-200 ease-pm",
        active ? "text-ink" : "text-ink-muted hover:text-ink"
      )}
    >
      {label}
      {active ? (
        // Shared layout id, so the marker slides between links rather than
        // blinking. It is the only motion in the nav and it says where you are.
        <motion.span
          layoutId="nav-active"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="absolute inset-x-2 -bottom-px h-0.5 rounded-pill bg-accent"
        />
      ) : null}
    </Link>
  );
}

function AppearanceControl() {
  const { preference, setPreference } = useTheme();

  return (
    <div className="px-2 pb-2 pt-1">
      <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        Appearance
      </p>
      <div className="flex items-center gap-1 rounded-control bg-inset p-1">
        {THEME_OPTIONS.map(({ value, label, Icon }) => {
          const selected = preference === value;
          return (
            <button
              key={value}
              onClick={() => setPreference(value)}
              aria-pressed={selected}
              className={cx(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[7px] px-2 py-1.5 text-[12px] font-medium",
                "transition-colors duration-200 ease-pm",
                selected
                  ? "bg-surface text-ink shadow-sm"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  const secondaryActive = SECONDARY_LINKS.some((link) => isActive(pathname, link.href));

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={cx(
          "inline-flex items-center gap-1 rounded-control px-3 py-2 text-sm font-medium",
          "transition-colors duration-200 ease-pm",
          secondaryActive ? "text-ink" : "text-ink-muted hover:text-ink"
        )}
      >
        More
        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 -translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 -translate-y-1"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-surface border border-line-subtle bg-elevated shadow-lg focus:outline-none">
          <div className="p-1.5">
            {SECONDARY_LINKS.map((link) => (
              <Menu.Item key={link.href}>
                {({ active }) => (
                  <Link
                    href={link.href}
                    className={cx(
                      "block rounded-control px-3 py-2 transition-colors duration-150",
                      active ? "bg-hovered" : "bg-transparent"
                    )}
                  >
                    <span
                      className={cx(
                        "block text-sm font-medium",
                        isActive(pathname, link.href) ? "text-accent" : "text-ink"
                      )}
                    >
                      {link.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-ink-muted">
                      {link.hint}
                    </span>
                  </Link>
                )}
              </Menu.Item>
            ))}
          </div>
          <div className="border-t border-line-subtle bg-surface">
            <AppearanceControl />
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function AccountBadge() {
  const profile = CurrentUserCookieInfo();
  const mounted = useMounted();

  // Read during render rather than copied into state by an effect: the profile
  // is derived data, and mirroring it into state is what makes the render loop
  // possible. Cookies are client-only, so the first paint stays neutral and
  // keeps a same-height placeholder to avoid a jump when it fills in.
  if (!mounted) {
    return <span className="h-9 w-20" aria-hidden="true" />;
  }

  const mountedProfile = profile;

  if (!mountedProfile) {
    return (
      <Link
        href="/"
        className="rounded-control px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        Homepage
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2 rounded-pill py-1 pl-1 pr-3 transition-colors duration-200 ease-pm hover:bg-hovered"
      title={`Signed in as ${mountedProfile.email}`}
    >
      {mountedProfile.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mountedProfile.picture}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-pill border border-line-subtle object-cover"
        />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-pill bg-accent-soft text-[12px] font-semibold text-accent">
          {mountedProfile.name?.slice(0, 1).toUpperCase() ?? "?"}
        </span>
      )}
      <span className="hidden text-sm font-medium text-ink sm:inline">
        {mountedProfile.name}
      </span>
    </Link>
  );
}

export default function NavigationBar() {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <nav className="nav-surface sticky top-0 z-40 border-b border-nav-line">
      <div className="mx-auto flex h-16 max-w-content items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center rounded-control py-2 pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-name-only.png"
            alt="Pure Media"
            width={132}
            height={46}
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex flex-1 items-center gap-0.5">
          {PRIMARY_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(pathname, link.href)}
            />
          ))}
          <MoreMenu pathname={pathname} />
        </div>

        <Link href="https://github.com/WoothAmwar/Complete-Personal-Website" className="px-2" target="_blank" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" className="fill-current" viewBox="0 0 256 256">
            <path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24A40,40,0,0,0,8,136a8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48A8,8,0,0,0,80,73.83a43.81,43.81,0,0,1,.79-33.58,43.88,43.88,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.87,43.87,0,0,1,32.32-20.06A43.81,43.81,0,0,1,192,73.83a8.09,8.09,0,0,0,1,7.65A41.72,41.72,0,0,1,200,104Z">
            </path>
          </svg>
        </Link>

        <AccountBadge />
      </div>
    </nav>
  );
}
