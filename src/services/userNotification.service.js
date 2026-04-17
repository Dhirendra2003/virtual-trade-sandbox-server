import Notification from "../models/Notification.js";
import User from "../models/User.js";

const createNotification = async (
  user_id,
  type,
  title,
  message,
  preferenceType = null,
) => {
  try {
    // If a preference type is provided, check if the user has enabled it
    if (preferenceType) {
      const user = await User.findByPk(user_id);
      if (user && user.preferences && user.preferences.notifications) {
        const isEnabled = user.preferences.notifications[preferenceType];
        if (isEnabled === false) {
          console.log(
            `Skipping notification for user ${user_id}: ${preferenceType} is disabled`,
          );
          return null;
        }
      }
    }

    const notification = await Notification.create({
      user_id,
      type,
      title,
      message,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw error to prevent crashing callers (like cron jobs)
    return null;
  }
};

export default createNotification;
