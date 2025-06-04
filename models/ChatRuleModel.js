import mongoose from "mongoose";

const chatRuleSchema = new mongoose.Schema({
    users: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        required: true,
        validate: {
            validator: (v) => v.length === 2,
            message: "Users array must contain exactly two user IDs"
        }
    },
    deleteChatRule: {
        type: String,
        enum: ["After logout", "After 24 hours"],
        default: "After logout",
    }
}, { timestamps: true });

chatRuleSchema.index({ users: 1 }, { unique: true });

const ChatRule = mongoose.model("ChatRule", chatRuleSchema);
export default ChatRule;
