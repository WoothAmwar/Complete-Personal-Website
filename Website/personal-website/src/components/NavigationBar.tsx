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

        <AccountBadge />
      </div>
    </nav>
  );
}
