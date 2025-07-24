import http from '@/lib/api/http';

export const fetchNotifications = async (page: number = 1, pageSize: number = 3) => {
    const { data } = await http.get(`notifications/?page=${page}&page_size=${pageSize}`);
    return data;
}