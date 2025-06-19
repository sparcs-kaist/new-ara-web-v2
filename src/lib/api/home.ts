import http from "./http";

export const fetchHome = async () => {
    const { data } = await http.get('/home');
    return data;
}