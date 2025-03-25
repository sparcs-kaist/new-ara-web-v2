import Image from "next/image";

export default function UserMenu() {
    return (
        <div className="flex space-x-4">
            <Image src="/user.png" width={48} height={48} alt="user"/>
            <div className=" flex-grow items-center justify-center">
                <p className="text-[18px]">사용자 이름</p>
                <p className="text-[12px] text-ara_gray_bright">useremail@kaist.ac.kr</p>
            </div>
            <button>
                <Image src="/setting.svg" width={24} height={24} alt="setting"/>
            </button>
        </div>
    );
}