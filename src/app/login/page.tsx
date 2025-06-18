'use client'

import Image from 'next/image'
import LoginPageButton from './components/LoginPageButton'

//import image asset
import NewAraLogo from '@/assets/ServiceAra.svg'
import LoginIcon from '@/assets/Icon/login.svg'

export default function LoginPage() {
  return (
    <div className="flex flex-col sm:flex-row sm:h-full">
      <div className="flex flex-col justify-center items-center w-full h-[250px] bg-[#fbf2f1] 
      sm:w-[30%] sm:h-full sm:min-w-[320px]">
        <Image src={NewAraLogo} alt="NewAraLogo" className="h-[82px] w-[154px] mb-[15px]" />
        <p className="text-center text-[#ed3a3a] font-semibold text-[21px] sm:text-[32px]">가장 정확한 정보를</p>
        <p className="text-center text-[#ed3a3a] font-semibold text-[21px] sm:text-[32px]">가장 신속하게</p>
      </div>
      <div className="w-full flex-1 bg-white sm:h-full">
        <LoginPageButton redirectUrl="/login" icon={<Image src={LoginIcon} alt="로그인 아이콘" />}>
          SPARCS SSO로 로그인
        </LoginPageButton>
        <LoginPageButton redirectUrl="https://bit.ly/sso-signup">
          공용 이메일로 회원가입
        </LoginPageButton>
        <LoginPageButton redirectUrl="https://bit.ly/newara-org-signup">
          학생단체 계정 신청하기
        </LoginPageButton>
        <LoginPageButton redirectUrl="https://bit.ly/newara-comp-signup">
          입주업체 계정 신청하기
        </LoginPageButton>
      </div>
    </div>
  )
}
