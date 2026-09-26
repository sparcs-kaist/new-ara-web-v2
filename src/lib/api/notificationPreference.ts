import http from '@/lib/api/http';

export interface NotificationPreference {
    article_commented: boolean;
    comment_commented: boolean;
    chat_message: boolean;
    delivery: boolean;
}

export const fetchNotificationPreference = async () => {
    const { data } = await http.get<NotificationPreference>('/me/notification_preference');
    return data;
};

// delivery: false needs confirm_delivery_off: true or the server answers 400.
export const updateNotificationPreference = async (
    patch: Partial<NotificationPreference> & { confirm_delivery_off?: boolean },
) => {
    const { data } = await http.patch<NotificationPreference>('/me/notification_preference', patch);
    return data;
};
