'use client'

import { useTranslation } from 'next-i18next'
import Image from 'next/image'

//import image asset
import NewAraLogo from '@/assets/ServiceAra.svg'

export default function LoginPage() {
  const { t } = useTranslation('login')
  return (
    <div className="flex flex-col sm:flex-row sm:h-full">
      <div className="flex justify-center items-center w-full h-[200px] bg-[#fbf2f1] 
      sm:w-[30%] sm:h-full sm:min-w-[300px]">
        <Image src={NewAraLogo} alt="NewAraLogo" />
      </div>
      <div className="w-full flex-1 bg-white sm:h-full" />
    </div>
  )
}
