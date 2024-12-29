import mongoose, { Schema, Document } from "mongoose";


enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}


interface IUser extends Document {
  name: string;
  email: string;
  password: string;
}


interface ILogEntry {
  timestamp: Date;
  source: string;
  message: string;
}


interface ILog extends Document {
  category: LogLevel;
  logs: ILogEntry[];
}

// User Schema
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, trim: true },
});

// Log Schema
const LogSchema = new Schema<ILog>({
  category: {
    type: String,
    enum: Object.values(LogLevel),
    required: true,
    default: LogLevel.INFO
  },
  logs: [
    {
      timestamp: {
        type: Date,
        required: true,
        default: Date.now,
        expires: "15d", 
      },
      source: { type: String, required: true },
      message: { type: String, required: true },
    },
  ],
});


// LogSchema.index({ "logs.timestamp": 1 });


const user = mongoose.model<IUser>("User", UserSchema);
const Log = mongoose.model<ILog>("Log", LogSchema);



export { user, Log };
