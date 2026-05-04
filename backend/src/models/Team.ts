import { Schema, model, Types } from "mongoose";

export type TeamStatus = "Active" | "Review" | "Paused" | "Archived";

export type TeamDocument = {
  name: string;
  lead: Types.ObjectId | null;
  members: Types.ObjectId[];
  activeLeads: number;
  status: TeamStatus;
};

const teamSchema = new Schema<TeamDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    lead: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    members: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    activeLeads: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Active", "Review", "Paused", "Archived"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export const Team = model<TeamDocument>("Team", teamSchema);
