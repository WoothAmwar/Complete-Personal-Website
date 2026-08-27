import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";

import { cx } from "@/components/ui/primitives";
import { hueClass, useTagColors, useTags } from "./tagData";

const ALL = "None";

/**
 * Narrows the feed to one tag.
 *
 * Tags arrive alphabetically and each carries its own color dot, so the menu
 * matches the chips on the channel rows exactly. "All channels" is first
 * because it is the state you return to.
 */
export function TagFilter({
  googleId,
  selected,
  onSelect,
}: {
  googleId: string;
  selected: string;
  onSelect: (tag: string) => void;
}) {
  const { data: tags, isLoading, isError } = useTags(googleId);
  const { data: colors } = useTagColors(googleId, tags);

  const active = selected !== ALL;
  const label = active ? selected : "All channels";

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className={cx(
          "inline-flex h-9 items-center gap-2 rounded-control border px-3 text-[13px] font-medium",
          "transition-colors duration-200 ease-pm",
          active
            ? "border-accent bg-accent-soft text-ink"
            : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
        )}
      >
        {active ? (
          <span
            className={cx("h-2 w-2 rounded-pill", hueClass(colors?.[selected]))}
            aria-hidden="true"
          />
        ) : null}
        <span className="max-w-[10rem] truncate">{label}</span>
        <ChevronDownIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
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
        <Menu.Items className="absolute left-0 z-30 mt-2 max-h-80 w-60 origin-top-left overflow-y-auto pm-scroll rounded-surface border border-line-subtle bg-elevated py-1 shadow-lg focus:outline-none">
          <Menu.Item>
            {({ active: hovered }) => (
              <button
                onClick={() => onSelect(ALL)}
                className={cx(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] text-ink",
                  hovered && "bg-hovered"
                )}
              >
                All channels
                {selected === ALL ? (
                  <CheckIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                ) : null}
              </button>
            )}
          </Menu.Item>

          <div className="my-1 border-t border-line-subtle" />

          {isLoading ? (
            <p className="px-3 py-2 text-[13px] text-ink-muted">Loading tags...</p>
          ) : isError ? (
            <p className="px-3 py-2 text-[13px] text-danger">Tags could not be loaded.</p>
          ) : (tags ?? []).length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-ink-muted">
              No tags yet. Add one from a channel row.
            </p>
          ) : (
            (tags ?? []).map((tag) => (
              <Menu.Item key={tag}>
                {({ active: hovered }) => (
                  <button
                    onClick={() => onSelect(tag)}
                    className={cx(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink",
                      hovered && "bg-hovered"
                    )}
                  >
                    <span
                      className={cx("h-2.5 w-2.5 shrink-0 rounded-pill", hueClass(colors?.[tag]))}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{tag}</span>
                    {selected === tag ? (
                      <CheckIcon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    ) : null}
                  </button>
                )}
              </Menu.Item>
            ))
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
