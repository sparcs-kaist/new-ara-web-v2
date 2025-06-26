'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSwitcher from './components/LanguageSwitcher'
import { tosContent } from './content'

export default function TOSPage() {
  // 기본 언어는 한국어로 설정
  const [locale, setLocale] = useState<'ko' | 'en'>('ko')
  
  useEffect(() => {
    // URL에서 언어 파라미터 가져오기
    const urlParams = new URLSearchParams(window.location.search)
    const urlLocale = urlParams.get('lang') as 'ko' | 'en'
    if (urlLocale && (urlLocale === 'ko' || urlLocale === 'en')) {
      setLocale(urlLocale)
    }
  }, [])
  
  // 언어 변경 핸들러
  const handleLocaleChange = (newLocale: 'ko' | 'en') => {
    setLocale(newLocale)
  }
  
  // 현재 사용 중인 언어의 콘텐츠 가져오기
  const currentContent = tosContent[locale]
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 언어 전환 버튼 */}
      <LanguageSwitcher 
        currentLocale={locale} 
        onLocaleChange={handleLocaleChange}
      />
      
      {/* 이용약관 내용 */}
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 text-center mb-2">
            {currentContent.title}
          </h1>  
          {currentContent.tos.map((section, index) => (
            <div key={index} className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
                {section.title}
              </h2>
              <div className="text-slate-700 leading-relaxed whitespace-pre-line text-[15px]">
                {section.content}
              </div>
            </div>
          ))}
        </div>
        
        {/* 홈으로 돌아가기 버튼 */}
        <div className="text-center mt-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-4 w-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 19l-7-7m0 0l7-7m-7 7h18" 
              />
            </svg>
            {currentContent.backToHome}
          </Link>
        </div>
      </main>
    </div>
  )
}