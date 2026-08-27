import { Fragment, type ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";

import { IconButton, cx } from "./primitives";

/**
 * The product's one dialog. Headless UI handles focus trapping, escape and the
 * scroll lock; everything visual comes from the design tokens.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const width = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" }[size];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-[0.97] translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-[0.97]"
            >
              <Dialog.Panel
                className={cx(
                  "w-full overflow-hidden rounded-surface border border-line-subtle bg-elevated shadow-lg",
                  width
                )}
              >
                <div className="flex items-start justify-between gap-4 border-b border-line-subtle px-5 py-4">
                  <div>
                    <Dialog.Title className="font-display text-lg font-semibold text-ink">
                      {title}
                    </Dialog.Title>
                    {description ? (
                      <Dialog.Description className="mt-1 text-[13px] text-ink-muted">
                        {description}
                      </Dialog.Description>
                    ) : null}
                  </div>
                  <IconButton label="Close" size="sm" onClick={onClose}>
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>

                <div className="px-5 py-4">{children}</div>

                {footer ? (
                  <div className="flex items-center justify-end gap-2 border-t border-line-subtle bg-surface px-5 py-3">
                    {footer}
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
