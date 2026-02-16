import http from "@/lib/api/http";

//user profile 조회
export const fetchUserProfile = async (userId: number) => {
    const { data } = await http.get(`/user_profiles/${userId}/`);
    return data;
}

//특정 user의 작성 게시글 조회
export const fetchUserPosts = async (userId: number, page: number) => {
    const { data } = await http.get(`/articles/?created_by=${userId}&page=${page}&page_size=10`);
    return data;
}