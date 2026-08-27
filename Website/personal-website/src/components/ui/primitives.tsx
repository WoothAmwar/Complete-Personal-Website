import Link from "next/link";
import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ==========================================================================
   Button
   Three variants, three sizes. Every combination is contrast-checked against
   the surface it sits on in both themes.
   ========================================================================== */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
  secondary: "bg-inset text-ink border border-line-subtle hover:bg-hovered hover:border-line",
  ghost: "bg-transparent text-ink-muted hover:bg-hovered hover:text-ink",
  danger: "bg-transparent text-danger border border-line-subtle hover:border-danger",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-control font-medium " +
  "transition-[background-color,border-color,color,transform] duration-200 ease-pm " +
  "active:translate-y-px disabled:pointer-events-none " +
  "disabled:!bg-inset disabled:!text-ink-muted disabled:!border-line-subtle";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={cx(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    />
  );
});

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
}

export function LinkButton({
  href,
  variant = "secondary",
  size = "md",
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cx(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Square button for a single icon. Always needs an accessible label. */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, size = "md", className, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cx(
          "inline-flex items-center justify-center rounded-control text-ink-soft",
          "transition-colors duration-200 ease-pm hover:bg-hovered hover:text-ink",
          "disabled:pointer-events-none disabled:opacity-40",
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

/* ==========================================================================
   Surface
   The one container in the product. Cards are used only where elevation says
   something true; elsewhere prefer spacing and a single hairline.
   ========================================================================== */

export function Surface({
  className,
  children,
  as: As = "div",
}: {
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article" | "aside";
}) {
  return (
    <As
      className={cx(
        "rounded-surface border border-line-subtle bg-surface",
        className
      )}
    >
      {children}
    </As>
  );
}

/* ==========================================================================
   SegmentedControl
   Replaces dropdowns wherever there are two or three mutually exclusive
   options, so the current choice and the alternatives are visible at once.
   ========================================================================== */

export interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  segments: ReadonlyArray<Segment<T>>;
  value: T;
  onChange: (next: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        "inline-flex items-center gap-1 rounded-control border border-line-subtle bg-inset p-1",
        className
      )}
    >
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <button
            key={segment.value}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(segment.value)}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-[7px] font-medium",
              "transition-colors duration-200 ease-pm",
              size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]",
              selected
                ? "bg-surface text-ink shadow-sm"
                : "text-ink-muted hover:text-ink"
            )}
          >
            {segment.icon}
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}

/* ==========================================================================
   Feedback states
   ========================================================================== */

/** Skeleton shaped like the thing it stands in for, not a spinner. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx("pm-skeleton rounded-control", className)}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 border-t border-line-subtle py-16">
      <p className="font-display text-xl font-semibold tracking-tight text-ink">{title}</p>
      <p className="max-w-prose text-[15px] leading-relaxed text-ink-muted">{body}</p>
      {action}
    </div>
  );
}

export function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-danger py-2 pl-5">
      <p className="text-sm font-semibold text-danger">{title}</p>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">{body}</p>
    </div>
  );
}

/* ==========================================================================
   Page scaffolding
   ========================================================================== */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-4">
      <div>
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-[-0.03em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-prose text-[14px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/* ==========================================================================
   Form field
   Label above the control, helper below. No placeholder-as-label.
   ========================================================================== */

export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const INPUT_CLASS =
  "w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-muted transition-colors duration-200 ease-pm " +
  "hover:border-line-strong focus:border-accent focus:outline-none " +
  "focus-visible:outline-none disabled:opacity-50";

/* ==========================================================================
   Tag chip
   Channel tags store a Tailwind hue name in the database. The chip renders
   that hue as a dot and keeps the label in the product's own type color, so
   eighteen possible hues never fight the page for attention.
   ========================================================================== */

export function TagChip({
  name,
  hue,
  onClick,
  selected,
  className,
}: {
  name: string;
  hue?: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) {
  const dot = hue ? `bg-${hue}-400` : "bg-line-strong";
  const content = (
    <>
      <span className={cx("h-2 w-2 shrink-0 rounded-pill", dot)} aria-hidden="true" />
      <span className="truncate">{name}</span>
    </>
  );

  const base = cx(
    "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[12px] font-medium",
    "transition-colors duration-200 ease-pm",
    selected
      ? "border-accent bg-accent-soft text-ink"
      : "border-line-subtle bg-inset text-ink-soft",
    onClick && "hover:border-line-strong hover:text-ink",
    className
  );

  if (!onClick) {
    return <span className={base}>{content}</span>;
  }
  return (
    <button type="button" onClick={onClick} className={base} aria-pressed={selected}>
      {content}
    </button>
  );
}
