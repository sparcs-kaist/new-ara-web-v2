'use client'

import Image from 'next/image'
import LoginPageButton from './components/LoginPageButton'

//import image asset
import NewAraLogo from '@/assets/ServiceAra.svg'
import LoginIcon from '@/assets/Icon/login.svg'

export default function LoginPage() {
  return (
    <div className="flex flex-col lg:flex-row lg:h-full">
      <div className="flex flex-col justify-center items-center w-full h-[250px] bg-[#fbf2f1] 
      lg:w-[30%] lg:h-full lg:min-w-[320px]">
        <Image src={NewAraLogo} alt="NewAraLogo" className="h-[82px] w-[154px] mb-[15px]" />
        <p className="text-center text-[#ed3a3a] font-semibold text-[21px] lg:text-[32px]">가장 정확한 정보를</p>
        <p className="text-center text-[#ed3a3a] font-semibold text-[21px] lg:text-[32px]">가장 신속하게</p>
      </div>
      <div className="w-full flex-1 bg-white lg:h-full">
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="w-full">
            <div className="h-1.5 w-6 bg-red-500 rounded-full mb-4" />
            <h1 className="text-[20px] lg:text-[28px] font-semibold text-gray-800 mb-2">
              뉴아라 서비스를 이용하시려면 로그인해주세요.
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mb-1">
              교직원과 졸업생은 SPARCS SSO에 접속한 뒤
            </p>
            <p className="text-sm lg:text-base text-gray-600 mb-8">
              {'<카이스트 통합인증으로 로그인/가입>'}을 선택해주세요.
            </p>
            <LoginPageButton
              redirectUrl="/login"
              fontSize={18}
              icon={<Image src={LoginIcon} alt="로그인 아이콘" />}
            >
              SPARCS SSO로 로그인
            </LoginPageButton>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="w-full">
            <div className="h-1.5 w-6 bg-red-500 rounded-full mb-4" />
            <h1 className="text-[20px] lg:text-[20px] font-semibold text-gray-800 mb-2">
              학생단체/입주업체 공용 계정을 만들고 싶으신가요?
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mb-8">
              공용 이메일로 회원가입을 진행한 후, 아래 버튼을 클릭하여 신청서를 보내주세요.
            </p>

            <div className="flex flex-col lg:flex-row gap-4 justify-center">
              <LoginPageButton redirectUrl="https://bit.ly/sso-signup" fontSize={15}>
                공용 이메일로 회원가입
              </LoginPageButton>
              <LoginPageButton redirectUrl="https://bit.ly/newara-org-signup" fontSize={15}>
                학생단체 계정 신청하기
              </LoginPageButton>
              <LoginPageButton redirectUrl="https://bit.ly/newara-comp-signup" fontSize={15}>
                입주업체 계정 신청하기
              </LoginPageButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
