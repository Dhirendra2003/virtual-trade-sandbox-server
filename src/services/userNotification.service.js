import Notification from "../models/Notification.js";

const createNotification = async (user_id, type, title, message) => {
  try {
    const notification = await Notification.create({
      user_id,
      type,
      title,
      message,
    });
    return notification;
  } catch (error) {
    throw error;
  }
};

export default createNotification;
