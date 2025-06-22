'use client'

import React from 'react'
import { urlParser } from '@/lib/utils/urlParser'

type PostBookmarkProps = {
  href: string
  title: string
}

const PostBookmark: React.FC<PostBookmarkProps> = ({ href, title }) => {

  const getTitle = () => {
    const rawTitle = title
    if (!rawTitle || rawTitle.trim().length === 0) return 'URL'

    const match = urlParser(rawTitle, true)
    if (match) {
      const domainStr = typeof match[1] === 'string' ? match[1] : ''
      const domains = domainStr.split('.')
      if (domains.length > 0) {
        domains.pop()
        for (const part of domains.reverse()) {
          if (part.length > 2) return part.toUpperCase()
        }
      }
    }

    return rawTitle
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        bookmark-box
        group flex flex-col
        w-full
        max-w-[540px]
        my-4 px-6 py-4
        rounded-[10px] border border-gray-300
        bg-white shadow-sm hover:shadow-md
        transition-shadow duration-200
        no-underline text-black
        focus:outline-none focus:ring-2 focus:ring-primary-400
      "
    >
      <p
        className="
          text-base
          leading-snug
          text-left
          flex items-center
        "
      >
        {getTitle()}
        <i className="material-icons ml-1 text-[20px] align-bottom">
          navigate_next
        </i>
      </p>
      <p
        className="
          text-base
          text-left
          mt-2 mb-4
          truncate
        "
        title={href}
      >
        {href}
      </p>
    </a>
  )
}

export default PostBookmark
