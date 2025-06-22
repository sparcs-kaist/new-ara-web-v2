import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, ReactNodeViewProps } from '@tiptap/react'
import PostBookmark from '@/components/TextEditor/PostBookmark'

export interface LinkBookmarkOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    linkBookmark: {
      /**
       * Set a bookmark-style link
       */
      linkBookmark: (attrs: { href: string; title: string }) => ReturnType
    }
  }
}

const LinkBookmark = Node.create<LinkBookmarkOptions>({
  name: 'linkBookmark',

  inline: true,
  group: 'inline',
  draggable: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      title: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-bookmark][href]',
        priority: 51,
        getAttrs: (node: HTMLElement) => {
          if (!(node instanceof HTMLElement)) return false

          return {
            href: node.getAttribute('href'),
            title: node.getAttribute('title') ?? node.innerText,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-bookmark': 'true',
      }),
      HTMLAttributes.title,
    ]
  },

  addCommands() {
    return {
      linkBookmark:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run()
        },
    }
  },

  addNodeView() {
    const PostBookmarkNodeView = (props: ReactNodeViewProps) => {
      const { node } = props
      const href = node.attrs.href
      const title = node.attrs.title

      return (
        <NodeViewWrapper as="div" className="block w-full">
          <PostBookmark href={href} title={title} />
        </NodeViewWrapper>
      )
    }

    return ReactNodeViewRenderer(PostBookmarkNodeView)
  },
})

export default LinkBookmark
