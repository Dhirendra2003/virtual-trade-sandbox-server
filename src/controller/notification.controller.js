import Notification from "../models/Notification.js";

export const getUserNotifications = async (req, resp) => {
  const userId = req.user.id;
  const notifications = await Notification.findAll({
    where: {
      user_id: userId,
    },
    limit: 10,
    order: [["createdAt", "DESC"]],
  });
  return resp.status(200).json({
    data: notifications,
    success: true,
  });
};

export const markAllAsRead = async (req, resp) => {
  const userId = req.user.id;
  await Notification.update(
    {
      is_read: true,
    },
    {
      where: {
        user_id: userId,
      },
    },
  );
  return resp.status(200).json({
    message: "All notifications marked as read",
    success: true,
  });
};
