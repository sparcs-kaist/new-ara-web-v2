import { parseEditorContent } from '@/components/TextEditor/utils/parseEditorContent';
import type { PostData } from '@/lib/types/post';

export function formatPost({ data }: { data: PostData }): PostData {
    return {
        ...data,
        content: parseEditorContent(data.content ?? ''),
    };
}
