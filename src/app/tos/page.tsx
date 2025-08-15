'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import LanguageSwitcher from './components/LanguageSwitcher'
import { tosContent } from './content'
import { updateTos, fetchMe } from '@/lib/api/user'

export default function TOSPage() {
  // 기본 언어는 한국어로 설정
  const [locale, setLocale] = useState<'ko' | 'en'>('ko')
  const [agreed,] = useState(false) // 약관 동의 여부 상태 추가
  const [user, setUser] = useState<number | null>(null)

  useEffect(() => {
    //User 정보 가져오기
    const fetchUserData = async () => {
      try {
        const userData = await fetchMe()
        setUser(userData.user)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }
    fetchUserData()
  }, [])
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

  // 약관 동의 핸들러
  const handleAgree = () => {
    if (user) {
      updateTos(user)
    }
  }

  // 약관 거절 핸들러
  const handleDecline = () => {
    alert('약관에 동의하지 않으면 서비스를 이용할 수 없습니다.')
  }

  // 현재 사용 중인 언어의 콘텐츠 가져오기
  const currentContent = tosContent[locale]

  return (
    <div className="min-h-screen bg-white">
      {/* 이용약관 내용 */}
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 relative">
          {/* 언어 전환 버튼 - 우측 상단 고정 */}
          <div className="absolute top-4 right-4">
            <LanguageSwitcher
              currentLocale={locale}
              onLocaleChange={handleLocaleChange}
            />
          </div>

          {/* 제목 */}
          <h1 className="text-3xl font-bold text-slate-800 text-center mb-6">
            {currentContent.title}
          </h1>

          {/* 본문 내용 스크롤 가능 */}
          <div className="overflow-y-auto max-h-[500px]">
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

          {/* 하단 버튼 영역 */}
          <div className="flex justify-between items-center mt-8">
            {/* 홈으로 돌아가기 버튼 */}
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

            {/* 약관 동의 및 거절 버튼 */}
            {!agreed ? (
              <div className="flex space-x-4">
                <button
                  onClick={handleAgree}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                >
                  동의
                </button>
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  거절
                </button>
              </div>
            ) : (
              <span className="text-gray-600 font-medium">
                약관에 이미 동의하셨습니다.
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}