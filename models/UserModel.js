import mongoose from "mongoose";

const userScheme = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String, default: "" },
    bio: { type: String },
    isOnlineVisible: { type: Boolean, default: false, },
}, { timestamps: true })

const User = mongoose.model("User", userScheme)

export default User;