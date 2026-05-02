import Notification from "../models/Notification.js";
import User from "../models/User.js";
import logger from "../utils/errorLogger.js";

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
          logger.info(
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
    logger.error("Error creating notification:", error);
    return null;
  }
};

export default createNotification;
