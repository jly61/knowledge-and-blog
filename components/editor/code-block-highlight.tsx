"use client"

import { useEffect, useRef } from "react"
import hljs from "highlight.js"
import "highlight.js/styles/github-dark.css"

interface CodeBlockHighlightProps {
  code: string
  language?: string
}

export function CodeBlockHighlight({ code, language }: CodeBlockHighlightProps) {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current)
    }
  }, [code, language])

  return (
    <pre className="hljs">
      <code ref={codeRef} className={language ? `language-${language}` : ""}>
        {code}
      </code>
    </pre>
  )
}

