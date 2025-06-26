'use client'

import { useRouter } from 'next/navigation'

interface LanguageSwitcherProps {
  currentLocale: string;
  onLocaleChange: (locale: 'ko' | 'en') => void;
}

const LanguageSwitcher = ({ currentLocale, onLocaleChange }: LanguageSwitcherProps) => {
  const router = useRouter()
  
  const toggleLanguage = () => {
    const newLocale = currentLocale === 'ko' ? 'en' : 'ko'
    
    // 부모 컴포넌트의 locale 상태 업데이트
    onLocaleChange(newLocale)
    
    // URL 파라미터로 언어 설정을 전달
    const url = new URL(window.location.href)
    url.searchParams.set('lang', newLocale)
    router.push(url.toString())
  }
  
  return (
    <button 
      onClick={toggleLanguage}
      className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 text-gray-600" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
        />
      </svg>
      <span className="text-sm font-medium text-gray-600">
        {currentLocale === 'ko' ? 'English' : '한국어'}
      </span>
    </button>
  )
}

export default LanguageSwitcher