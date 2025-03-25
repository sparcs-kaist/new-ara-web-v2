"use client";
interface BoardSelectorProps {
  onBoardSelect: (board: string) => void; // 🔹 부모에서 전달받은 콜백 함수
}

export default function BoardSelector({ onBoardSelect }: BoardSelectorProps) {
  return (
    <div className ="flex space-x-2">
      <button className ="text-[20px]" onClick={() => onBoardSelect("talk")}>자유게시판</button>
      <button className ="text-[20px]" onClick={() => onBoardSelect("portal-notice")}>포탈 공지</button>
      <button className ="text-[20px]" onClick={() => onBoardSelect("student-group")}>학생 단체 및 동아리</button>
      <button className ="text-[20px]" onClick={() => onBoardSelect("market")}>거래</button>
      {/* <button onClick={() => onBoardSelect("portal-notice")}>소통</button> */}
    </div>
  );
}
