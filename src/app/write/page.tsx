import TextEditor from "./components/TextEditor";

export default function Write() {
    return (
      <div>
        <h1>글쓰기 페이지</h1>
        <TextEditor editable={true} />
      </div>
    );
  }
  