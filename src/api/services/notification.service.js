import { ENDPOINTS } from '../config/endpoints.js';
import axiosInstanceAPIGateway from '../config/axios-gateway.js';

/**
 * Notification API service for handling user notifications
 */
class NotificationService {
    /**
     * Get all notifications for a user
     * @param {string} userId - The user ID to fetch notifications for
     * @returns {Promise<import('../types/notification.types').Notification[]>} Array of notifications
     */
    async getNotificationsByUserId(userId) {
        if (!userId) return [];
        
        try {
            const response = await axiosInstanceAPIGateway.get(
                ENDPOINTS.NOTIFICATIONS.GET_USER_NOTIFICATIONS.replace(':id', userId)
            );
            return response.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return [];
            }
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {string} userId - The user ID to mark notifications as read
     * @returns {Promise<Object>} Response data
     */
    async setNotificationsToRead(userId) {
        if (!userId) return null;
        
        try {
            const response = await axiosInstanceAPIGateway.put(
                ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ.replace(':id', userId)
            );
            return response.data.data;
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw error;
        }
    }

    /**
     * Update a specific notification
     * @param {string} notificationId - The ID of the notification to update
     * @param {import('../types/notification.types').NotificationUpdateData} updateData - The data to update
     * @returns {Promise<import('../types/notification.types').Notification>} Updated notification data
     */
    async updateNotification(notificationId, updateData) {
        try {
            const response = await axiosInstanceAPIGateway.put(
                ENDPOINTS.NOTIFICATIONS.UPDATE_NOTIFICATION.replace(':id', notificationId),
                updateData
            );
            return response.data.data;
        } catch (error) {
            console.error('Error updating notification:', error);
            throw error;
        }
    }

    /**
     * Delete a specific notification
     * @param {string} notificationId - The ID of the notification to delete
     * @returns {Promise<Object>} Response data
     */
    async deleteNotification(notificationId) {
        try {
            const response = await axiosInstanceAPIGateway.delete(
                ENDPOINTS.NOTIFICATIONS.DELETE_NOTIFICATION.replace(':id', notificationId)
            );
            return response.data.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }
}

// Export a singleton instance
export const notificationService = new NotificationService();
