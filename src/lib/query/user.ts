import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api/user";

export const useMe = () => {
    return useQuery({
        queryKey: ["me"],
        queryFn: fetchMe,
        staleTime: Infinity,
        retry: false,
        refetchOnWindowFocus: false,
    });
};