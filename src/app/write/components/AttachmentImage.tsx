import React from 'react'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'

export interface AttachmentImageOptions {
  editable: boolean
  errorCallback?: () => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachmentImage: {
      /**
       * Insert an attachment image.
       */
      attachmentImage: (attrs: {
        src: string
        title?: string
        alt?: string
        width?: number
        'data-attachment'?: string
      }) => ReturnType
    }
  }
}

const AttachmentImageComponent = (props: any) => {
  const { node, updateAttributes } = props
  const { src, alt, title, width = 500 } = node.attrs

  const sizes: Record<string, number> = {
    small: 250,
    mid: 500,
    large: 1000,
  }

  const resize = (w: number) => {
    updateAttributes({ width: w })
  }

  const imageLoadError = () => {
    if (props.options?.errorCallback) {
      props.options.errorCallback()
    }
  }

  return (
    <NodeViewWrapper className="flex mt-2">
      <div className="relative group">
        <div className="absolute -left-6 top-0 flex gap-1 bg-white rounded shadow opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {Object.entries(sizes).map(([label, size]) => (
            <button
              key={label}
              onClick={() => resize(size)}
              className={`text-sm px-2 py-1 hover:font-bold ${
                width === size ? 'font-bold text-black' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <img
          src={src}
          alt={alt}
          title={title}
          width={width}
          onError={imageLoadError}
          className="rounded max-w-full"
        />
      </div>
    </NodeViewWrapper>
  )
}

const AttachmentImage = Node.create<AttachmentImageOptions>({
  name: 'attachmentImage',

  inline: true,
  group: 'inline',
  draggable: true,

  addOptions() {
    return {
      editable: true,
      errorCallback: undefined,
    }
  },

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: 500 },
      'data-attachment': { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: this.options.editable ? 'img[src][data-attachment]' : 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)]
  },

  addCommands() {
    return {
      attachmentImage:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentImageComponent)
  },
})

export default AttachmentImage
