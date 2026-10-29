import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createGalleryItem,
  deleteGalleryItem,
  fetchAllGallery,
  updateGalleryItem,
  uploadGalleryMedia,
} from "../../api/gallery";
import { getErrorMessage } from "../../api/client";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { StatusBadge } from "../../components/admin/StatusBadge";
import { Spinner } from "../../components/ui/Spinner";
import { acceptFor, formatBytes, maxBytesFor, validateMediaFile } from "../../config/uploads";
import { cn } from "../../lib/cn";
import type { GalleryCategory, GalleryItem } from "../../types";

/** Upload/save progress of the current submission. */
type FormPhase = "idle" | "uploading" | "saving";

const gallerySchema = z
  .object({
    title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120, "Title is too long."),
    category: z.enum(["interior", "exterior", "commercial"], { message: "Choose a category." }),
    type: z.enum(["image", "video"], { message: "Choose image or video." }),
    method: z.enum(["device", "url"], { message: "Choose how to add the media." }),
    imageUrl: z.string().trim().max(1000, "The URL is too long."),
    videoUrl: z.string().max(1000, "The URL is too long."),
    alt: z.string().trim().min(3, "Alt text must be at least 3 characters.").max(300, "Alt text is too long."),
    published: z.boolean(),
  })
  .superRefine((values, ctx) => {
    // URL mode keeps the original contract; device mode is filled from the upload.
    if (values.method === "url" && values.imageUrl.trim().length === 0) {
      ctx.addIssue({ code: "custom", path: ["imageUrl"], message: "An image URL is required." });
    }
  });

type GalleryFormValues = z.infer<typeof gallerySchema>;

const fieldClasses =
  "w-full rounded-[6px] border border-line bg-ivory px-4 py-3 text-sm text-charcoal transition-colors placeholder:text-warm-gray/70 focus:border-forest focus:outline-none";

const methodClasses =
  "flex-1 rounded-[6px] border border-line bg-ivory px-4 py-2.5 text-center text-[0.7rem] font-semibold tracking-[0.14em] text-warm-gray uppercase transition-colors has-[:checked]:border-forest has-[:checked]:bg-forest has-[:checked]:text-ivory hover:border-forest/50 cursor-pointer";

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
  phase: FormPhase;
  progress: number;
  submitError: string | null;
  onClose: () => void;
  onSubmit: (values: GalleryFormValues, file: File | null, editing: GalleryItem | null) => void;
}

function GalleryFormModal({
  open,
  initial,
  phase,
  progress,
  submitError,
  onClose,
  onSubmit,
}: GalleryFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GalleryFormValues>({
    resolver: zodResolver(gallerySchema),
    defaultValues: initial
      ? {
          title: initial.title,
          category: initial.category,
          type: initial.type,
          method: "url",
          imageUrl: initial.imageUrl,
          videoUrl: initial.videoUrl ?? "",
          alt: initial.alt,
          published: initial.published,
        }
      : {
          title: "",
          category: "interior",
          type: "image",
          method: "url",
          imageUrl: "",
          videoUrl: "",
          alt: "",
          published: true,
        },
    mode: "onTouched",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTouched, setFileTouched] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const method = watch("method");
  const mediaType = watch("type");
  const busy = phase !== "idle" || isSubmitting;
  const isDevice = method === "device";

  // Release the preview object URL when the dialog goes away.
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  const fileError = isDevice && selectedFile ? validateMediaFile(selectedFile, mediaType) : null;
  const missingFileError =
    isDevice && fileTouched && !selectedFile && !initial
      ? "Choose a file to upload."
      : null;
  const blockingFileError = fileError ?? missingFileError;

  const clearFile = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setFileTouched(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    setFileTouched(true);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
    setSelectedFile(chosen);
    if (chosen && typeof URL.createObjectURL === "function") {
      const url = URL.createObjectURL(chosen);
      previewRef.current = url;
      setPreviewUrl(url);
    }
  };

  const submit = handleSubmit(
    (values) => {
      if (isDevice && !selectedFile && !initial) {
        setFileTouched(true);
        return;
      }
      if (isDevice && selectedFile && fileError) {
        setFileTouched(true);
        return;
      }
      onSubmit(values, selectedFile, initial);
    },
    () => {
      if (isDevice) setFileTouched(true);
    },
  );

  if (!open) return null;

  const previewIsVideo = selectedFile ? selectedFile.type.startsWith("video/") : false;

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
          disabled={busy}
          aria-label="Close dialog"
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-ivory text-warm-gray transition-colors hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <span className="eyebrow">Gallery</span>
        <h2 id="gallery-form-title" className="display-heading mt-4 text-2xl text-forest">
          {initial ? "Edit gallery item" : "Add gallery item"}
        </h2>
        <p className="mt-2 text-sm text-warm-gray">
          Upload an image or video straight from this device, or keep adding media by URL.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit} noValidate aria-busy={busy}>
          <fieldset className="space-y-2" disabled={busy}>
            <legend className="mb-2 block text-sm font-medium text-charcoal">Media source</legend>
            <div className="flex gap-3">
              <label className={methodClasses}>
                <input
                  type="radio"
                  value="device"
                  className="sr-only"
                  {...register("method")}
                />
                Upload from device
              </label>
              <label className={methodClasses}>
                <input
                  type="radio"
                  value="url"
                  className="sr-only"
                  {...register("method")}
                />
                Enter URL
              </label>
            </div>
          </fieldset>

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

          {isDevice ? (
            <div className="space-y-3 rounded-[8px] border border-line bg-ivory p-4">
              <div>
                <label htmlFor="gallery-file" className="mb-2 block text-sm font-medium text-charcoal">
                  Choose a file
                </label>
                <p className="mb-2 text-xs text-warm-gray">
                  {mediaType === "video" ? "MP4, WebM or MOV" : "JPEG, PNG, WebP, GIF or AVIF"} — up
                  to {formatBytes(maxBytesFor(mediaType))}
                </p>
                <input
                  id="gallery-file"
                  ref={fileInputRef}
                  type="file"
                  accept={acceptFor(mediaType)}
                  disabled={busy}
                  onChange={handleFileChange}
                  className={cn(
                    "block w-full text-sm text-charcoal file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-forest file:px-5 file:py-2.5 file:text-[0.7rem] file:font-semibold file:tracking-[0.16em] file:text-ivory file:uppercase hover:file:bg-forest-dark",
                    blockingFileError && "border-terracotta",
                  )}
                />
              </div>

              {blockingFileError ? (
                <p role="alert" className="text-xs font-medium text-terracotta-dark">
                  {blockingFileError}
                </p>
              ) : null}

              {selectedFile ? (
                <figure className="rounded-[6px] border border-line bg-soft-white p-3">
                  {previewUrl ? (
                    previewIsVideo ? (
                      <video
                        src={previewUrl}
                        controls
                        playsInline
                        aria-label="Selected video preview"
                        className="max-h-52 w-full rounded-[4px] bg-charcoal"
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Selected file preview"
                        className="max-h-52 w-full rounded-[4px] object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-24 items-center justify-center rounded-[4px] bg-ivory-deep text-xs text-warm-gray">
                      Preview unavailable in this browser
                    </div>
                  )}
                  <figcaption className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-warm-gray">
                    <span className="max-w-[60%] truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="tabular-nums">{formatBytes(selectedFile.size)}</span>
                  </figcaption>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={busy}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.08em] text-terracotta-dark uppercase transition-colors hover:border-terracotta hover:bg-terracotta hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={13} aria-hidden="true" />
                    Remove file
                  </button>
                </figure>
              ) : null}
            </div>
          ) : (
            <>
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
            </>
          )}

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

          {phase === "uploading" ? (
            <div className="space-y-2">
              <div
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-2 w-full overflow-hidden rounded-full bg-sage"
              >
                <div
                  className="h-full rounded-full bg-forest transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p role="status" className="text-xs text-warm-gray">
                Uploading {selectedFile?.name ?? "file"}… {progress}%
              </p>
            </div>
          ) : null}

          {phase === "saving" ? (
            <p role="status" className="text-xs text-warm-gray">
              Saving to the gallery…
            </p>
          ) : null}

          {submitError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[8px] border border-terracotta/40 bg-terracotta/10 p-3 text-sm text-terracotta-dark"
            >
              <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-full border border-forest/35 px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-forest uppercase transition-colors hover:border-forest hover:bg-forest hover:text-ivory disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || Boolean(isDevice && selectedFile && fileError)}
              className="rounded-full bg-forest px-5 py-2.5 text-[0.7rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phase === "uploading"
                ? `Uploading ${progress}%`
                : phase === "saving"
                  ? "Saving…"
                  : initial
                    ? "Save changes"
                    : "Add to gallery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** /admin/gallery — gallery CRUD with device uploads, URLs and publish toggles. */
export function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<GalleryItem | null>(null);
  const [phase, setPhase] = useState<FormPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submittingRef = useRef(false);

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
    setSubmitError(null);
    setFormOpen(true);
  };

  const openEdit = (item: GalleryItem) => {
    setEditing(item);
    setSubmitError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (phase !== "idle") return;
    setFormOpen(false);
    setEditing(null);
    setSubmitError(null);
    setProgress(0);
  };

  const submitForm = (values: GalleryFormValues, file: File | null, target: GalleryItem | null) => {
    // Duplicate-submission guard: a second click before the state updates is dropped.
    if (submittingRef.current) return;
    submittingRef.current = true;

    void (async () => {
      setBusyId(target?.id ?? "new");
      setSubmitError(null);
      setNotice(null);
      setProgress(0);
      try {
        let payload = toPayload(values);

        if (values.method === "device") {
          if (file) {
            setPhase("uploading");
            const uploaded = await uploadGalleryMedia(file, values.type, setProgress);
            payload = {
              ...payload,
              imageUrl: uploaded.url,
              videoUrl: values.type === "video" ? uploaded.url : "",
            };
          } else if (target) {
            // Editing without choosing a new file keeps the existing media.
            payload = { ...payload, imageUrl: target.imageUrl, videoUrl: target.videoUrl ?? "" };
          }
        }

        setPhase("saving");
        if (target) await updateGalleryItem(target.id, payload);
        else await createGalleryItem(payload);

        setNotice(target ? "Gallery item updated." : "Gallery item added to the gallery.");
        setFormOpen(false);
        setEditing(null);
        setProgress(0);
        await load();
      } catch (caught) {
        setSubmitError(
          getErrorMessage(caught, "The gallery item could not be saved. Please try again."),
        );
      } finally {
        submittingRef.current = false;
        setPhase("idle");
        setBusyId(null);
      }
    })();
  };

  const togglePublished = async (item: GalleryItem) => {
    setBusyId(item.id);
    setError(null);
    setNotice(null);
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
    setNotice(null);
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
            Manage the portfolio shown on “Our Work”. Upload images and videos from your device, or
            keep referencing media by URL.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-[0.72rem] font-semibold tracking-[0.16em] text-ivory uppercase transition-colors hover:bg-forest-dark"
        >
          <Plus size={15} aria-hidden="true" />
          Add image or video
        </button>
      </div>

      {notice ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-2.5 rounded-[8px] border border-forest/30 bg-forest/10 p-4 text-sm text-forest"
        >
          <Check size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}

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
            {items.map((item) => {
              const hasVideo = item.type === "video" && Boolean(item.videoUrl);
              return (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-[8px] border border-line bg-soft-white"
                >
                  <div className="relative">
                    {hasVideo ? (
                      <video
                        src={item.videoUrl}
                        muted
                        playsInline
                        preload="metadata"
                        aria-label={item.alt}
                        className="h-44 w-full bg-ivory-deep object-cover"
                      />
                    ) : (
                      <img
                        src={item.imageUrl}
                        alt={item.alt}
                        loading="lazy"
                        className="h-44 w-full bg-ivory-deep object-cover"
                      />
                    )}
                    {hasVideo ? (
                      <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-forest text-ivory">
                        <Play size={14} aria-hidden="true" />
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-medium text-forest">{item.title}</h2>
                        <p className="mt-1 text-[0.65rem] font-semibold tracking-[0.16em] text-warm-gray uppercase">
                          {categoryLabels[item.category]} · {item.type}
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
              );
            })}
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
          phase={phase}
          progress={progress}
          submitError={submitError}
          onClose={closeForm}
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
