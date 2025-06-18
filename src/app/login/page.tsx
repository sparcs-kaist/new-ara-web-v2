'use client'

import { useTranslation } from 'next-i18next'
import Image from 'next/image'

//import image asset
import NewAraLogo from '@/assets/ServiceAra.svg'

export default function LoginPage() {
  const { t } = useTranslation('login')
  return (
    <div className="flex flex-col sm:flex-row sm:h-full">
      <div className="flex flex-col justify-center items-center w-full h-[200px] bg-[#fbf2f1] 
      sm:w-[30%] sm:h-full sm:min-w-[320px]">
        <Image src={NewAraLogo} alt="NewAraLogo" className="h-[82px] w-[154px] mb-[15px]" />
        <p className="text-center text-[#ed3a3a] font-semibold text-[21px] sm:text-[32px]">가장 정확한 정보를</p>
        <p className="text-center text-[#ed3a3a] font-semibold text-[21px] sm:text-[32px]">가장 신속하게</p>
      </div>
      <div className="w-full flex-1 bg-white sm:h-full" />
    </div>
  )
}
