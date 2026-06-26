import mongoose from "mongoose";

const messageScheme = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recieverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    image: { type: String },
    seen: { type: Boolean, default: false },

}, { timestamps: true })
messageScheme.index({ createdAt: 1 });
const Message = mongoose.model("Message", messageScheme);
export default Message;