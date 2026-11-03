import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    songId: { type: String, required: true },
    tittle: { type: String, default: "Unknown Song" },
    artist: { type: String, default: "Unknown Artist" },
    img: { type: String, default: null },
    audioUrl: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    ownerId: { type: String, required: true },
    ownerName: { type: String, default: "" },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 200, default: "" },
    visibility: {
      type: String,
      enum: ["private", "unlisted", "public"],
      default: "private",
    },
    songs: { type: [songSchema], default: [] },
    followers: { type: [String], default: [] },
    followerCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

playlistSchema.index({ ownerId: 1, updatedAt: -1 });
playlistSchema.index({ followers: 1 });
playlistSchema.index({ visibility: 1, followerCount: -1, updatedAt: -1 });

export const Playlist = mongoose.model("Playlist", playlistSchema);
