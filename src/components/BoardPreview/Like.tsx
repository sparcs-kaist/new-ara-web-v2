import Image from "next/image";

interface LikeProps {
  like: number;
  dislike: number;
  comment: number;
}

export default function Like({like, dislike, comment}: LikeProps) {
  return (
    <div className ="flex justify-end">
      <Image src="/Like.svg" alt="" width={20} height={20} />
      <p className="text-[12px] mr-1 text-ara_red">{like}</p>
      <Image src="/Dislike.svg" alt="" width={20} height={20} />
      <p className="text-[12px] mr-1 text-ara_blue">{like}</p>
      <Image src="/Comment.svg" alt="" width={20} height={20} />
      <p className="text-[12px] text-ara_gray">{like}</p>
    </div>
  );
}