import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
}

interface ILog extends Document {
  timestamp: Date;
  level: string;
  message: string;
  source: string;
}

const UserSchema = new Schema({
  name: { type: String, required: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, trim: true },
});

const user = mongoose.model<IUser>("User", UserSchema);

const LogSchema = new Schema({
    timestamp: { type: Date, required: true },
    level: { type: String, required: true },
    message: { type: String, required: true },
    source: { type: String, required: true }
});

const log = mongoose.model<ILog>("Log", LogSchema);

export { user, log };