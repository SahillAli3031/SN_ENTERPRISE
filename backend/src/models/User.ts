import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "admin" | "customer";

export interface UserAttrs {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserDoc = HydratedDocument<UserAttrs, UserMethods>;

const userSchema = new Schema<UserAttrs, Model<UserAttrs, {}, UserMethods>, UserMethods>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = model<UserAttrs, Model<UserAttrs, {}, UserMethods>>("User", userSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
