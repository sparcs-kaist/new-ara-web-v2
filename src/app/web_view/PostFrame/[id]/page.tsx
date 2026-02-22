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

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-10 h-10 border-4 border-[#ed3a3a]/30 border-t-[#ed3a3a] rounded-full animate-spin" />
        </div>
    )
    if (!post) return null

    return (
        <article className="w-full h-full bg-white">
            {/* 본문 */}
            <div className="p-0">
                <TextEditor content={post.content} editable={false} />
            </div>
        </article>
    )
}
