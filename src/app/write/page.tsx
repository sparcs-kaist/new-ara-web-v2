import TextEditor from "./components/TextEditor";
import PostOptionBar from "./components/PostOptionBar";


export default function Write() {
    return (
      <div className="bg-white p-8 width-full">
        <div className = "width-[80%]">
          <p className="text-2xl font-bold mb-4 text-[#ed3a3a]">
            게시물 작성하기
          </p>
          <hr className="border-t border-gray-300 mb-6" />
          <PostOptionBar />
          <TextEditor editable={true} />
        </div>
      </div>
    );
  }
  