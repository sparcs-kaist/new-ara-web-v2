'use client'

import React from 'react'
import { useTranslation } from 'react-i18next'
import { urlParser } from '@/lib/utils/urlParser'

type PostBookmarkProps = {
  href: string
  title: string
}

const PostBookmark: React.FC<PostBookmarkProps> = ({ href, title }) => {
  const { t } = useTranslation()

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
      className="flex max-w-[544px] flex-col rounded-[10px] border border-grey-300 bg-background shadow hover:shadow-md transition-shadow duration-200"
      target="_blank"
      rel="noopener noreferrer"
    >
      <p className="text-[15px] leading-[1.4] text-left mt-[18px] mx-[28px] text-grey-700">
        {getTitle()}
        <i className="material-icons align-bottom ml-1 text-[20px]">navigate_next</i>
      </p>
      <p className="text-[15px] text-left mt-[6px] mb-[18px] mx-[28px] text-grey-700">
        {href.length > 50 ? href.substring(0, 50) + '...' : href}
      </p>
    </a>
  )
}

export default PostBookmark
