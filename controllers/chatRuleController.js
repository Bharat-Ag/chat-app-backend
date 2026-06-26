import ChatRule from "../models/ChatRuleModel.js";


export const setDeleteChatRule = async (req, res) => {
    try {
        const ownerId = req.user._id;
        const { deleteChatRule } = req.body;
        const { withUserId } = req.params;

        if (!withUserId || !deleteChatRule) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const sortedUsers = [ownerId.toString(), withUserId.toString()].sort();

        const updatedRule = await ChatRule.findOneAndUpdate(
            { users: sortedUsers },
            {
                $set: {
                    deleteChatRule,
                    users: sortedUsers
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Delete chat rule updated successfully.",
            data: updatedRule
        });

    } catch (error) {
        console.error("Error in setDeleteChatRule:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const getDeleteChatRule = async (req, res) => {
    try {
        const user1 = req.user._id;
        const user2 = req.params.withUserId;
        const users = [user1.toString(), user2.toString()].sort();

        const rule = await ChatRule.findOne({ users });

        if (!rule) {
            return res.json({ success: true, data: { deleteChatRule: "After logout" } });
        }

        return res.json({ success: true, data: rule });
    } catch (error) {
        console.error("Error in getDeleteChatRule:", error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};