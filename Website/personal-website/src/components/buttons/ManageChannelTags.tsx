import { Fragment, useMemo, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { CheckIcon, PlusIcon, TrashIcon } from "@heroicons/react/20/solid";

import { CurrentUserId } from "../../helperFunctions/cookieManagement";
import { Modal } from "@/components/ui/Modal";
import {
  Button,
  IconButton,
  INPUT_CLASS,
  TagChip,
  cx,
} from "@/components/ui/primitives";
import {
  TAG_HUES,
  addTagToChannel,
  createTag,
  deleteTag,
  hueClass,
  removeTagFromChannel,
  setTagColor,
  useChannelTags,
  useTagColors,
  useTagInvalidator,
  useTags,
} from "@/components/youtube/tagData";

/** Swatch grid for picking a tag's hue. */
function ColorPicker({
  tagName,
  current,
  onPick,
}: {
  tagName: string;
  current: string | undefined;
  onPick: (hue: string) => void;
}) {
  return (
    <Menu as="div" className="relative">
      <Menu.Button
        aria-label={`color for ${tagName}`}
        title={`color for ${tagName}`}
        className={cx(
          "h-5 w-5 rounded-pill border border-line-strong transition-transform duration-150 hover:scale-110",
          hueClass(current)
        )}
      />
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-20 mt-2 w-[13.5rem] rounded-surface border border-line-subtle bg-elevated p-2 shadow-lg focus:outline-none">
          <div className="grid grid-cols-6 gap-1.5">
            {TAG_HUES.map((hue) => (
              <Menu.Item key={hue}>
                {({ active }) => (
                  <button
                    type="button"
                    aria-label={hue}
                    title={hue}
                    onClick={() => onPick(hue)}
                    className={cx(
                      "h-6 w-6 rounded-pill border transition-transform duration-150",
                      hueClass(hue),
                      current === hue
                        ? "border-ink ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg-elevated)]"
                        : "border-line-strong",
                      active && "scale-110"
                    )}
                  />
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

function TagRow({
  tagName,
  hue,
  applied,
  onToggle,
  onRecolor,
  onRequestDelete,
}: {
  tagName: string;
  hue: string | undefined;
  applied: boolean;
  onToggle: () => void;
  onRecolor: (hue: string) => void;
  onRequestDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-control px-2 py-1.5 transition-colors hover:bg-hovered">
      <ColorPicker tagName={tagName} current={hue} onPick={onRecolor} />

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={applied}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
      >
        <span className="truncate text-sm text-ink">{tagName}</span>
        <span
          className={cx(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
            applied
              ? "border-accent bg-accent text-accent-contrast"
              : "border-line bg-surface text-transparent"
          )}
          aria-hidden="true"
        >
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
      </button>

      <IconButton label={`Delete the ${tagName} tag`} size="sm" onClick={onRequestDelete}>
        <TrashIcon className="h-4 w-4" />
      </IconButton>
    </div>
  );
}

/**
 * The tag strip that sits next to a channel, plus the dialog behind it.
 *
 * Reading and writing go through the shared hooks in tagData.ts, so opening
 * this on ten channels costs one color fetch, not ten.
 */
export function ManageShowTag({ channelName }: { channelName: string }) {
  const googleId = CurrentUserId();
  const invalidate = useTagInvalidator(googleId);

  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagError, setNewTagError] = useState<string | null>(null);

  const { data: allTags } = useTags(googleId);
  const { data: colors } = useTagColors(googleId, allTags);
  const { data: channelTags } = useChannelTags(googleId, channelName);

  const applied = useMemo(() => new Set(channelTags ?? []), [channelTags]);

  const toggleTag = async (tagName: string) => {
    try {
      if (applied.has(tagName)) {
        await removeTagFromChannel(googleId, channelName, tagName);
      } else {
        await addTagToChannel(googleId, channelName, tagName);
      }
    } catch (err) {
      console.error("Could not change the channel tags", err);
    } finally {
      invalidate();
    }
  };

  const recolor = async (tagName: string, hue: string) => {
    try {
      await setTagColor(googleId, tagName, hue);
    } catch (err) {
      console.error("Could not change the tag color", err);
    } finally {
      invalidate();
    }
  };

  const submitNewTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const created = await createTag(googleId, name);
      if (!created) {
        setNewTagError("A tag with that name already exists.");
        return;
      }
      await addTagToChannel(googleId, channelName, created);
      setNewTagName("");
      setNewTagError(null);
    } catch (err) {
      console.error("Could not create the tag", err);
      setNewTagError("The tag could not be created. Try again.");
    } finally {
      invalidate();
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await removeTagFromChannel(googleId, channelName, pendingDelete);
      await deleteTag(googleId, pendingDelete);
    } catch (err) {
      console.error("Could not delete the tag", err);
    } finally {
      setPendingDelete(null);
      invalidate();
    }
  };

  const visible = channelTags ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((tagName) => (
          <TagChip key={tagName} name={tagName} hue={colors?.[tagName]} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cx(
            "inline-flex items-center gap-1 rounded-pill border border-dashed border-line px-2 py-1",
            "text-[12px] font-medium text-ink-muted transition-colors duration-200 ease-pm",
            "hover:border-line-strong hover:text-ink"
          )}
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {visible.length === 0 ? "Add a tag" : "Edit"}
        </button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Tags for ${channelName}`}
        description="Tick a tag to apply it. Click a color dot to recolor the tag everywhere it is used."
      >
        <div className="flex max-h-[46vh] flex-col gap-0.5 overflow-y-auto pm-scroll pr-1">
          {(allTags ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              No tags yet. Create the first one below.
            </p>
          ) : (
            (allTags ?? []).map((tagName) => (
              <TagRow
                key={tagName}
                tagName={tagName}
                hue={colors?.[tagName]}
                applied={applied.has(tagName)}
                onToggle={() => toggleTag(tagName)}
                onRecolor={(hue) => recolor(tagName, hue)}
                onRequestDelete={() => setPendingDelete(tagName)}
              />
            ))
          )}
        </div>

        <form
          className="mt-4 border-t border-line-subtle pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitNewTag();
          }}
        >
          <label htmlFor="new-tag" className="text-[13px] font-medium text-ink">
            New tag
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="new-tag"
              className={INPUT_CLASS}
              value={newTagName}
              placeholder="Longform"
              onChange={(event) => {
                setNewTagName(event.target.value);
                setNewTagError(null);
              }}
            />
            <Button type="submit" variant="secondary" disabled={!newTagName.trim()}>
              Create
            </Button>
          </div>
          {newTagError ? (
            <p className="mt-1.5 text-[12px] text-danger">{newTagError}</p>
          ) : (
            <p className="mt-1.5 text-[12px] text-ink-muted">
              New tags are applied to {channelName} straight away.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={`Delete the ${pendingDelete ?? ""} tag`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button variant="primary" onClick={confirmDelete}>
              Delete tag
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          This removes the tag from every channel that uses it. The channels
          themselves are not affected.
        </p>
      </Modal>
    </>
  );
}
