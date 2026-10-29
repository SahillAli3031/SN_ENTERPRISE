import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required."),
  password: z.string().min(1, "Password is required."),
});

export const reviewCreateSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(60),
  email: z.string().trim().email("A valid email is required."),
  rating: z
    .number({ message: "Rating must be a number." })
    .int("Rating must be a whole number.")
    .min(1, "Rating must be between 1 and 5.")
    .max(5, "Rating must be between 1 and 5."),
  comment: z.string().trim().min(10, "Please write at least 10 characters.").max(1200),
});

export const reviewStatusSchema = z.object({
  status: z.enum(["pending", "approved", "hidden"], {
    message: "Status must be pending, approved or hidden.",
  }),
});

export const galleryCreateSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(120),
  category: z.enum(["interior", "exterior", "commercial"], {
    message: "Category must be interior, exterior or commercial.",
  }),
  type: z.enum(["image", "video"], { message: "Type must be image or video." }).default("image"),
  imageUrl: z.string().trim().min(1, "An image URL is required.").max(1000),
  videoUrl: z.string().trim().max(1000).optional().or(z.literal("")),
  alt: z.string().trim().min(3, "Alt text is required.").max(300),
  published: z.boolean().default(true),
});

export const galleryUpdateSchema = galleryCreateSchema.partial();

export const enquiryCreateSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\d][\d\s()-]{6,19}$/, "Please enter a valid phone number."),
  email: z.string().trim().email("A valid email is required."),
  serviceType: z.string().trim().min(1, "Please choose a service.").max(120),
  propertyType: z.string().trim().min(1, "Please choose a property type.").max(120),
  message: z.string().trim().min(10, "Please add a few details.").max(1500),
});

export const enquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"], {
    message: "Status must be new, contacted or closed.",
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type GalleryCreateInput = z.infer<typeof galleryCreateSchema>;
export type EnquiryCreateInput = z.infer<typeof enquiryCreateSchema>;
