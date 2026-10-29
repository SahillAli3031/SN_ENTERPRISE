import { Schema, model, type HydratedDocument } from "mongoose";

export type EnquiryStatus = "new" | "contacted" | "closed";

export interface EnquiryAttrs {
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  propertyType: string;
  message: string;
  status: EnquiryStatus;
}

export type EnquiryDoc = HydratedDocument<EnquiryAttrs>;

const enquirySchema = new Schema<EnquiryAttrs>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    serviceType: { type: String, required: true, trim: true },
    propertyType: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new", index: true },
  },
  { timestamps: true },
);

export const Enquiry = model<EnquiryAttrs>("Enquiry", enquirySchema);
