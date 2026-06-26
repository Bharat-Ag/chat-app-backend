import cloudinary from "../lib/cloudinary.js";
import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";
import { io, userSocketMap } from "../index.js";
// import fetch from "node-fetch";
import sanitizeHtml from "sanitize-html"; // make sure this is installed



export const getUserForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filterUser = await User.find({ _id: { $ne: userId } }).select('-password');

        const unseenMessages = {};
        const promises = filterUser.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, recieverId: userId, seen: false })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises)
        return res.json({ success: true, users: filterUser, unseenMessages });

    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }
}


export const getMessage = async (req, res) => {
    try {

        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, recieverId: selectedUserId },
                { senderId: selectedUserId, recieverId: myId },
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, recieverId: myId }, { seen: true })

        return res.json({ success: true, messages });

    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }
}

export const markMsgSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true })
        return res.json({ success: true });

    } catch (error) {
        console.log('error', error.message)
        return res.json({ success: false, message: error.message });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const recieverId = req.params.id;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ success: false, message: "Message content is required." });
        }

        let imgUrl;

        // Upload image if present
        if (image) {
            const uploadRes = await cloudinary.uploader.upload(image);
            imgUrl = uploadRes.secure_url;
        }

        // Sanitize and clean up text
        let safeText = '';
        if (text) {
            // Step 1: Sanitize text
            safeText = sanitizeHtml(text, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'span']),
                allowedAttributes: {
                    ...sanitizeHtml.defaults.allowedAttributes,
                    img: ['src', 'alt'],
                    span: ['style'],
                },
                allowedStyles: {
                    '*': {
                        'color': [/^.*$/],
                        'background-color': [/^.*$/],
                        'font-size': [/^.*$/],
                        'text-align': [/^.*$/],
                    },
                },
            });

            // Step 2: Remove <img> tags from text if image is handled separately
            if (imgUrl) {
                safeText = safeText.replace(/<img[^>]*>/g, '').trim();
            }
        }

        // Create message
        const newMsg = await Message.create({
            senderId,
            recieverId,
            text: safeText || undefined,
            image: imgUrl || undefined
        });

        // Emit socket or push notification
        const recieverScketId = userSocketMap[recieverId];

        if (recieverScketId) {
            io.to(recieverScketId).emit('newMessage', newMsg);
        } else {
            const reciever = await User.findById(recieverId);
            if (reciever?.fcmToken) {
                await sendPushNotification({
                    token: reciever.fcmToken,
                    title: "New Message",
                    body: safeText ? sanitizeHtml(safeText, { allowedTags: [], allowedAttributes: {} }).slice(0, 50) : "📷 Photo Message"
                });
            }
        }

        return res.json({ success: true, newMessage: newMsg });

    } catch (error) {
        console.error('sendMessage error:', error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const clearMessagesImmediately = async (req, res) => {
    try {
        const userId = req.user._id;
        const { withUserId } = req.body;

        if (!withUserId) {
            return res.status(400).json({ success: false, message: "withUserId is required." });
        }

        const result = await Message.deleteMany({
            $or: [
                { senderId: userId, recieverId: withUserId },
                { senderId: withUserId, recieverId: userId }
            ]
        });

        return res.json({ success: true, message: "Messages cleared immediately.", deletedCount: result.deletedCount });

    } catch (error) {
        console.error("Clear messages error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const clearMessagesOlderThan24Hours = async (req, res) => {
    try {
        const userId = req.user._id;
        const { withUserId } = req.body;

        if (!withUserId) {
            return res.status(400).json({ success: false, message: "withUserId is required." });
        }

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await Message.deleteMany({
            $or: [
                { senderId: userId, recieverId: withUserId },
                { senderId: withUserId, recieverId: userId }
            ],
            createdAt: { $lt: twentyFourHoursAgo }
        });

        return res.json({ success: true, message: "Messages older than 24 hours cleared.", deletedCount: result.deletedCount });
    } catch (error) {
        console.error("Clear messages error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const getLastMessagesForSidebar = async (req, res) => {
    try {
        const userId = req.user._id
        const lastMessages = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { recieverId: userId }
                    ]
                }
            },
            {
                $addFields: {
                    userPair: {
                        $cond: [
                            { $gt: ["$senderId", "$recieverId"] },
                            { $concat: [{ $toString: "$recieverId" }, "_", { $toString: "$senderId" }] },
                            { $concat: [{ $toString: "$senderId" }, "_", { $toString: "$recieverId" }] }
                        ]
                    }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$userPair",
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$lastMessage" }
            },
            {
                $addFields: {
                    otherUserId: {
                        $cond: [
                            { $eq: ["$senderId", userId] },
                            "$recieverId",
                            "$senderId"
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "otherUserId",
                    foreignField: "_id",
                    as: "otherUser"
                }
            },
            { $unwind: "$otherUser" },
            {
                $project: {
                    text: 1,
                    createdAt: 1,
                    senderId: 1,
                    recieverId: 1,
                    otherUser: {
                        _id: 1,
                        fullName: 1,
                        profilePic: 1
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        return res.json({ success: true, data: lastMessages });
    } catch (error) {
        console.error("Error in getLastMessagesForSidebar:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // Fetch message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Only sender can delete
        if (!message.senderId.equals(userId)) {
            return res.status(403).json({ success: false, message: "You can only delete your own messages" });
        }

        await Message.findByIdAndDelete(messageId);

        return res.json({ success: true, message: "Message deleted" });

    } catch (error) {
        console.error("Delete message error:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// const FCM_SERVER_KEY = "ec0ba497febdd788b227b96eb1ce18eda1cb3639"

// export const sendPushNotification = async ({ token, title, body }) => {
//     try {
//         const response = await fetch("https://fcm.googleapis.com/fcm/send", {
//             method: "POST",
//             headers: {
//                 "Authorization": `key=${FCM_SERVER_KEY}`,
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 to: token,
//                 notification: {
//                     title: title,
//                     body: body,
//                     sound: "default"
//                 },
//                 priority: "high"
//             }),
//         });

//         const result = await response.json();
//         console.log("FCM push response:", result);
//         return result;
//     } catch (error) {
//         console.error("Push notification error:", error.message);
//     }
// };