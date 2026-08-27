import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

import { cx } from "./primitives";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Shown under the label in the open list, never in the closed button. */
  hint?: string;
  disabled?: boolean;
}

/**
 * A single-choice dropdown, styled to match the rest of the product.
 *
 * Used where the option list is a fixed vocabulary but too long or too
 * consequential for a segmented control.
 */
export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ReadonlyArray<SelectOption<T>>;
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={cx("relative", className)}>
        <Listbox.Label className="sr-only">{label}</Listbox.Label>
        <Listbox.Button
          className={cx(
            "flex h-10 w-full items-center justify-between gap-2 rounded-control border border-line",
            "bg-surface px-3 text-left text-sm font-medium text-ink",
            "transition-colors duration-200 ease-pm hover:border-line-strong"
          )}
        >
          <span className="truncate">{selected?.label ?? label}</span>
          <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
        </Listbox.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute left-0 z-30 mt-2 max-h-72 w-full min-w-[13rem] overflow-y-auto pm-scroll rounded-surface border border-line-subtle bg-elevated py-1 shadow-lg focus:outline-none">
            {options.map((option) => (
              <Listbox.Option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={({ active, disabled }) =>
                  cx(
                    "flex cursor-pointer items-start justify-between gap-2 px-3 py-2",
                    active && "bg-hovered",
                    disabled && "cursor-not-allowed opacity-40"
                  )
                }
              >
                {({ selected: isSelected }) => (
                  <>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">
                        {option.label}
                      </span>
                      {option.hint ? (
                        <span className="mt-0.5 block text-[12px] text-ink-muted">
                          {option.hint}
                        </span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}
