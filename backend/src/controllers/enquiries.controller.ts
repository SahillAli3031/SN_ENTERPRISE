import type { Request, Response } from "express";
import { Enquiry, type EnquiryStatus } from "../models/Enquiry.js";
import type { EnquiryCreateInput } from "../validation/schemas.js";

function serialize(item: {
  _id: unknown;
  fullName: string;
  phone: string;
  email: string;
  serviceType: string;
  propertyType: string;
  message: string;
  status: string;
  createdAt?: Date;
}) {
  return {
    id: String(item._id),
    fullName: item.fullName,
    phone: item.phone,
    email: item.email,
    serviceType: item.serviceType,
    propertyType: item.propertyType,
    message: item.message,
    status: item.status,
    createdAt: item.createdAt,
  };
}

/** POST /api/enquiries — public quote/contact form. */
export async function createEnquiry(req: Request, res: Response): Promise<void> {
  const payload = req.body as EnquiryCreateInput;
  const enquiry = await Enquiry.create({ ...payload, status: "new" });
  res.status(201).json({
    success: true,
    message: "Enquiry received. We will be in touch using the details you provided.",
    data: { id: enquiry.id },
  });
}

/** GET /api/enquiries — admin. */
export async function listEnquiries(_req: Request, res: Response): Promise<void> {
  const items = await Enquiry.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: items.map(serialize), meta: { total: items.length } });
}

/** PATCH /api/enquiries/:id — admin: change follow-up status. */
export async function updateEnquiry(req: Request, res: Response): Promise<void> {
  const { status } = req.body as { status: EnquiryStatus };
  const item = await Enquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!item) {
    res.status(404).json({ success: false, message: "Enquiry not found." });
    return;
  }
  res.json({ success: true, data: serialize({ ...item.toObject(), _id: item._id }) });
}

/** DELETE /api/enquiries/:id — admin. */
export async function deleteEnquiry(req: Request, res: Response): Promise<void> {
  const item = await Enquiry.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: "Enquiry not found." });
    return;
  }
  res.json({ success: true, data: { id: req.params.id } });
}
