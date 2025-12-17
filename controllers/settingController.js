import User from '../models/User.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';
import Task from '../models/Task.js';
import Course from '../models/Course.js';
import { equal } from 'assert';
import { error, timeStamp } from 'console';

// check health 
export const healthCheck = async (req, res) => {
    res.status(200).json({
        status: "OK",
        timeStamp: new Date().toISOString(),
        message: "Server is running smoothly"
    });
}

// delete account
export const deleteaccount = async (req, res) => {
    try {
        // get user id from authenticated user (set by auth middleware)
        const userId = req.user?._id;


        if (!userId) {

            return res.status(400).json({ message: "User ID not found in request" });
        }

        // delete user's data first
        await Task.deleteMany({ user: userId });
        await Course.deleteMany({ user: userId });

        // delete user from database
        const deletedUser = await User.findByIdAndDelete(userId);


        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // respond
        res.status(200).json({
            message: "Account deleted successfully",
            user: {
                id: deletedUser._id,
                name: deletedUser.name,
                email: deletedUser.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// get notification
export const notification = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('emailNotifications');
        res.json({
            success: true,
            emailNotifications: user.emailNotifications
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// notification settings
export const notificationSettings = async (req, res) => {
    try {
        const { emailNotifications } = req.body

        // validate input
        if (typeof emailNotifications !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: "Invalid input for emailNotifications"
            });
        }

        // update user settings
        const updateUser = await User.findByIdAndUpdate(
            req.user._id,
            { emailNotifications },
            { new: true, runValidators: true }
        );
        if (!updateUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Notification settings updated successfully",
            emailNotifications: updateUser.emailNotifications
        });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
}
