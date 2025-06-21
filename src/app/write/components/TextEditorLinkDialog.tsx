'use client'

import {
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'

interface Props {
  onSubmit: (url: string, title: string, isBookmark: boolean) => void
}

export interface TextEditorLinkDialogHandle {
  open: (defaultTitle?: string) => void
}

const TextEditorLinkDialog = forwardRef<TextEditorLinkDialogHandle, Props>(
  ({ onSubmit }, ref) => {
    const [shown, setShown] = useState(false)
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const dialogRef = useRef<HTMLDivElement>(null)

    const open = useCallback((defaultTitle = '') => {
      setUrl('')
      setTitle(defaultTitle)
      setShown(true)
    }, [])

    const close = useCallback(() => {
      setShown(false)
    }, [])

    useImperativeHandle(ref, () => ({
      open,
    }))

    const handleSubmit = (isBookmark: boolean) => {
      if (!/^https?:\/\//.test(url)) {
        alert('URL은 http:// 또는 https:// 로 시작해야 합니다.')
        return
      }
      onSubmit(url, title.trim() || url, isBookmark)
      close()
    }

    return (
      <>
        <div
          ref={dialogRef}
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
            shown ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className="absolute inset-0 bg-black bg-opacity-40"
            onClick={close}
          />
          <section className="bg-white rounded-lg shadow-lg max-w-md w-full z-10">
            <header className="bg-[#ed3a3a] text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
              <h2 className="text-lg font-semibold">링크 추가하기</h2>
              <button onClick={close} className="text-white">
                <span className="material-icons">close</span>
              </button>
            </header>
            <div className="px-6 py-4">
              <input
                type="text"
                placeholder="링크 URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full mb-3 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <input
                type="text"
                placeholder="링크 텍스트"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleSubmit(false)}
                  className="px-3 py-1.5 rounded-lg bg-white text-black border border-gray-300 text-base hover:shadow"
                >
                  링크 추가
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#ed3a3a] text-white border-gray-300 text-base hover:shadow"
                >
                  북마크 추가
                </button>
              </div>
            </div>
          </section>
        </div>
      </>
    )
  }
)

TextEditorLinkDialog.displayName = 'TextEditorLinkDialog'
export default TextEditorLinkDialog

// Dialog open trigger 사용 예:
// const dialogRef = useRef<InstanceType<typeof TextEditorLinkDialog>>(null)
// dialogRef.current?.open('기본 제목')
