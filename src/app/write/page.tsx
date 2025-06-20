import TextEditor from "./components/TextEditor";
import PostOptionBar from "./components/PostOptionBar";


export default function Write() {
    return (
      <div className="bg-white p-8 w-full">
        <div className="w-[80%]">
          <p className="text-2xl font-bold mb-4 text-[#ed3a3a]">
            게시물 작성하기
          </p>
          <hr className="border-t border-gray-300 mb-6" />
          <PostOptionBar />
          {/* 제목 입력 칸 추가 */}
          <input
            type="text"
            placeholder="제목을 입력하세요"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <TextEditor editable={true} />
        </div>
      </div>
    );
  }
