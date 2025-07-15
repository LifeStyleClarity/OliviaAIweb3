/**
 * @typedef {Object} Notification
 * @property {string} notification_id - Unique identifier for the notification
 * @property {string} user_id - ID of the user this notification belongs to
 * @property {string} message_subject - Subject/title of the notification
 * @property {string} message_content - Content of the notification
 * @property {string} message_type - Type of notification (e.g., 'trade')
 * @property {string} status - Status of the notification ('Read' or 'Unread')
 * @property {string} created_at - Timestamp when the notification was created
 * @property {string} updated_at - Timestamp when the notification was last updated
 */

/**
 * @typedef {Object} NotificationUpdateData
 * @property {string} [status] - Update the read status ('Read' or 'Unread')
 */

export {};
