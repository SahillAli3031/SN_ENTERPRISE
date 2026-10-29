import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Eye, EyeOff, Pencil, Plus, RotateCcw, Trash, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createGalleryItem, deleteGalleryItem, fetchAllGallery, updateGalleryItem } from "../../api/gallery";
import { getErrorMessage } from "../../api/client";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { Spinner } from "../../components/ui/Spinner";
import { cn } from "../../lib/cn";
import type { GalleryCategory, GalleryItem } from "../../types";

const gallerySchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120, "Title is too long."),
  category: z.enum(["interior", "exterior", "commercial"], { message: "Choose a category." }),
  type: z.enum(["image", "video"], { message: "Choose image or video." }),
  imageUrl: z.string().trim().min(1, "An image URL is required.").max(1000, "The URL is too long."),
  videoUrl: z.string().max(1000, "The URL is too long."),
  alt: z.string().trim().min(3, "Alt text must be at least 3 characters.").max(300, "Alt text is too long."),
  published: z.boolean(),
});

type GalleryFormValues = z.infer<typeof gallerySchema>;

const fieldClasses =
  "w-full rounded-[6px] border border-line bg-ivory px-4 py-3 text-sm text-charcoal transition-colors placeholder:text-warm-gray/70 focus:border-forest focus:outline-none";

const categoryLabels: Record<GalleryCategory, string> = {
  interior: "Interior",
  exterior: "Exterior",
  commercial: "Commercial",
};

function toPayload(values: GalleryFormValues): Partial<GalleryItem> {
  return {
    title: values.title.trim(),
    category: values.category,
    type: values.type,
    imageUrl: values.imageUrl.trim(),
    videoUrl: values.videoUrl.trim(),
    alt: values.alt.trim(),
    published: values.published,
  };
}

interface GalleryFormModalProps {
  open: boolean;
  initial: GalleryItem | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: GalleryFormValues, editing: GalleryItem | null) => void;
}

function GalleryFormModal({ open, initial, busy, onClose, onSubmit }: GalleryFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: initial
      ? {
          title: initial.title,
          category: initial.category,
          type: initial.type,
          imageUrl: initial.imageUrl,
          videoUrl: initial.videoUrl ?? "",
          alt: initial.alt,
          published: initial.published,
        }
      : {
          title: "",
          category: "interior",
          type: "image",
          imageUrl: "",
          videoUrl: "",
          alt: "",
          published: true,
        },
    mode: "onTouched",
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-charcoal/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-form-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-xl bg-soft-white p-6 shadow-lift sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-warm-gray transition-colors hover:border-forest hover:text-forest"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <span className="eyebrow">Gallery</span>
        <h2 id="gallery-form-title" className="display-heading mt-4 text-2xl text-forest">
          {initial ? "Edit gallery item" : "Add gallery item"}
        </h2>
        <p className="mt-2 text-sm text-warm-gray">
          Items are added by image URL — the platform stores no files of its own.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit((values) => onSubmit(values, initial))}
          noValidate
        >
          <div>
            <label htmlFor="gallery-title" className="mb-2 block text-sm font-medium text-charcoal">
              Title
            </label>
            <input
              id="gallery-title"
              className={cn(fieldClasses, errors.title && "border-terracotta")}
              {...register("title")}
            />
            {errors.title ? (
              <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gallery-category" className="mb-2 block text-sm font-medium text-charcoal">
                Category
              </label>
              <select id="gallery-category" className={fieldClasses} {...register("category")}>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="commercial">Commercial</option>
              </select>
              {errors.category ? (
                <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                  {errors.category.message}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="gallery-type" className="mb-2 block text-sm font-medium text-charcoal">
                Media type
              </label>
              <select id="gallery-type" className={fieldClasses} {...register("type")}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              {errors.type ? (
                <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                  {errors.type.message}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="gallery-image-url" className="mb-2 block text-sm font-medium text-charcoal">
              Image URL
            </label>
            <input
              id="gallery-image-url"
              type="url"
              placeholder="https://…"
              className={cn(fieldClasses, errors.imageUrl && "border-terracotta")}
              {...register("imageUrl")}
            />
            {errors.imageUrl ? (
              <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                {errors.imageUrl.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="gallery-video-url" className="mb-2 block text-sm font-medium text-charcoal">
              Video URL <span className="font-normal text-warm-gray">(optional)</span>
            </label>
            <input
              id="gallery-video-url"
              type="url"
              placeholder="https://…"
              className={cn(fieldClasses, errors.videoUrl && "border-terracotta")}
              {...register("videoUrl")}
            />
            {errors.videoUrl ? (
              <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                {errors.videoUrl.message}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="gallery-alt" className="mb-2 block text-sm font-medium text-charcoal">
              Alt text
            </label>
            <input
              id="gallery-alt"
              className={cn(fieldClasses, errors.alt && "border-terracotta")}
              {...register("alt")}
            />
            {errors.alt ? (
              <p role="alert" className="mt-2 text-xs font-medium text-terracotta-dark">
                {errors.alt.message}
              </p>
            ) : null}
          </div>

          <label className="flex items-center gap-3 text-sm text-charcoal">
            <input type="checkbox" className="h-4 w-4 accent-forest" {...register("published")} />
            Published — visible on the public site
          </label>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-forest/35 px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || busy}
              className="rounded-full bg-forest px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {initial ? "Save changes" : "Add to gallery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** /admin/gallery — URL-based gallery CRUD with publish toggles. */
export function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<GalleryItem | null>(null);

  const load = useCallback(async () => {
    try {
      const galleryItems = await fetchAllGallery();
      setItems(galleryItems);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught, "We couldn't load the gallery. Please try again."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  const submitForm = (values: GalleryFormValues, target: GalleryItem | null) => {
    void (async () => {
      setBusyId(target?.id ?? "new");
      setError(null);
      try {
        if (target) await updateGalleryItem(target.id, toPayload(values));
        else await createGalleryItem(toPayload(values));
        setFormOpen(false);
        setEditing(null);
        await load();
      } catch (caught) {
        setError(getErrorMessage(caught, "The gallery item could not be saved. Please try again."));
      } finally {
        setBusyId(null);
      }
    })();
  };

  const togglePublished = async (item: GalleryItem) => {
    setBusyId(item.id);
    setError(null);
    try {
      await updateGalleryItem(item.id, { published: !item.published });
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "The gallery item could not be updated."));
    } finally {
      setBusyId(null);
    }
  };

  const removeItem = async (item: GalleryItem) => {
    setBusyId(item.id);
    setError(null);
    try {
      await deleteGalleryItem(item.id);
      await load();
    } catch (caught) {
      setError(getErrorMessage(caught, "The gallery item could not be deleted."));
    } finally {
      setBusyId(null);
      setConfirmTarget(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Content</span>
          <h1 className="display-heading mt-4 text-3xl text-forest sm:text-4xl">Gallery</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-warm-gray">
            Manage the portfolio shown on “Our Work”. Items are referenced by image URL — no file
            uploads.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-[0.72rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:bg-forest-dark"
        >
          <Plus size={15} aria-hidden="true" />
          Add image
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-[8px] border border-terracotta/40 bg-terracotta/10 p-4 text-sm text-terracotta-dark"
        >
          <CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-7">
        {items === null ? (
          <div className="flex justify-center py-16">
            <Spinner size={26} label="Loading gallery…" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-[8px] border border-line bg-soft-white px-6 py-10 text-center text-sm text-warm-gray">
            No gallery items yet. Add the first one.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="flex flex-col overflow-hidden rounded-[8px] border border-line bg-soft-white">
                <img
                  src={item.imageUrl}
                  alt={item.alt}
                  loading="lazy"
                  className="h-44 w-full bg-ivory-deep object-cover"
                />
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-medium text-forest">{item.title}</h2>
                      <p className="mt-1 text-[0.65rem] font-semibold tracking-[0.16em] text-warm-gray uppercase">
                        {categoryLabels[item.category]}
                      </p>
                    </div>
                    <StatusBadge
                      tone={item.published ? "published" : "unpublished"}
                      label={item.published ? "Published" : "Unpublished"}
                    />
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      aria-label={`Edit ${item.title}`}
                      disabled={busyId === item.id}
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil size={13} aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`${item.published ? "Unpublish" : "Publish"} ${item.title}`}
                      disabled={busyId === item.id}
                      onClick={() => void togglePublished(item)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {item.published ? (
                        <EyeOff size={13} aria-hidden="true" />
                      ) : (
                        <Eye size={13} aria-hidden="true" />
                      )}
                      {item.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${item.title}`}
                      disabled={busyId === item.id}
                      onClick={() => setConfirmTarget(item)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] text-terracotta-dark uppercase transition-colors hover:border-terracotta hover:bg-terracotta hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash size={13} aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {items !== null && items.length > 0 && error ? (
        <button
          type="button"
          onClick={() => void load()}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-forest/35 px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Refresh list
        </button>
      ) : null}

      {formOpen ? (
        <GalleryFormModal
          open={formOpen}
          initial={editing}
          busy={busyId !== null}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={submitForm}
        />
      ) : null}

      <ConfirmDialog
        open={confirmTarget !== null}
        title="Delete this gallery item?"
        message={
          confirmTarget
            ? `“${confirmTarget.title}” will be permanently removed from the portfolio. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        busy={busyId !== null}
        onConfirm={() => {
          if (confirmTarget) void removeItem(confirmTarget);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
