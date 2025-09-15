/* eslint-disable */

'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { fetchPost } from '@/lib/api/post'
import { formatPost } from '@/app/post/util/getPost'
import TextEditor from '@/components/TextEditor/TextEditor'
import type { PostData } from '@/lib/types/post'

export default function WebViewPostFrame() {
    const params = useParams()
    const postId = params?.id ? parseInt(params.id as string, 10) : null

    const [post, setPost] = useState<PostData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!postId || isNaN(postId) || postId <= 0) {
            notFound()
        }

        setIsLoading(true)
        fetchPost({ postId, fromView: 'all', current: 3, overrideHidden: true })
            .then((data) => setPost(formatPost({ data })))
            .catch(() => notFound())
            .finally(() => setIsLoading(false))
    }, [postId])

    if (isLoading) return <div className="p-4 text-center text-sm text-gray-500">로딩 중…</div>
    if (!post) return null

    return (
        <article className="w-full h-full bg-white">
            {/* 본문 */}
            <div className="px-4 py-3">
                <TextEditor content={post.content} editable={false} />
            </div>
        </article>
    )
}
