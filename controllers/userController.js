import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs"

export const signup = async (req, res) => {

    try {
        const { fullName, email, bio, password } = req.body;

        if (!fullName || !email || !bio || !password) {
            return res.json({ success: false, message: "Missing details" });
        }

        const user = await User.findOne({ email })
        if (user) {
            return res.json({ success: false, message: "Account already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            fullName, email, password: hashedPass, bio
        })

        const token = generateToken(newUser._id)
        return res.json({ success: true, userData: newUser, token, message: "Account created successfully" });

    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email })
        if (!userData) {
            return res.json({ success: false, message: "Gadhe ki ga#d register toh krle pehle ya email check kar" });
        }
        const isPass = await bcrypt.compare(password, userData.password)
        if (!isPass) {
            return res.json({ success: false, message: "Papa se puch password bhul gya toh" });
        }

        const token = generateToken(userData._id)
        return res.json({ success: true, userData, token, message: "Aa gya dalla baat krne" });

    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }

}

export const checkAuth = async (req, res) => {
    return res.json({ success: true, user: req.user });
}

export const updateProfile = async (req, res) => {
    try {

        const { fullName, bio, profilePic } = req.body;
        const userId = req.user._id;
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true })
        }
        else {
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName, profilePic: upload.secure_url }, { new: true });
        }
        return res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }

}

export const resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        await User.findByIdAndUpdate(userId, { password: hashedPass }, { new: true })
        return res.json({ success: true, message: "Passowrd has been updated" });

    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }
}

export const onlineVisibility = async (req, res) => {
    try {
        const { isOnlineVisible } = req.body
        const userId = req.user._id;
        const dt = await User.findByIdAndUpdate(userId, { isOnlineVisible }, { new: true })
        return res.json({ success: true, message: "Status changed", status: dt.isOnlineVisible });

    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }
}

// export const saveFcmToken = async (req, res) => {
//     try {
//         const userId = req.user._id;
//         const { fcmToken } = req.body;

//         if (!fcmToken) return res.status(400).json({ success: false, message: "FCM token is required" });

//         await User.findOneAndUpdate(
//             { userId },
//             { fcmToken },
//             { new: true }
//         );
//         res.json({ success: true, message: "Token saved successfully" });
//     } catch (err) {
//         console.error("Save FCM token error:", err.message);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };