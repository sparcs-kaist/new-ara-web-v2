'use client';

import type { ResponsePost } from '@/lib/types/post';

interface LittleTextProps {
    post: ResponsePost;
    /** Render the parent topic in red brackets before the title. */
    showTopic?: boolean;
}

/**
 * One-line article title used inside the home page notice / trade /
 * student-community boxes. Mirrors `LittleText` in `main_page.dart`:
 * `[topic] title` with the topic in brand red, the title in black (or
 * grey when hidden), font size 14 / weight 400.
 */
export function LittleText({ post, showTopic = false }: LittleTextProps) {
    const topic = post.parent_topic?.ko_name;
    const isHidden = Boolean((post as unknown as { is_hidden?: boolean }).is_hidden);
    return (
        <span
            className={[
                'block truncate text-[14px] font-normal',
                isHidden ? 'text-[#B1B1B1]' : 'text-black',
            ].join(' ')}
        >
            {showTopic && topic && <span className="text-ara_red">[{topic}] </span>}
            {post.title}
        </span>
    );
}
