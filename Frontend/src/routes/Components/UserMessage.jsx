import { useEffect, useRef, useState } from "react";
import hljs from 'highlight.js';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";

const UserMessage = ({ message }) => {
    return (
      <div className="txt">
        <ReactMarkdown
          className="markdown"
          // rehypePlugins={[rehypeRaw]}
        //   remarkPlugins={[remarkBreaks, remarkGfm]}
          remarkPlugins={[remarkBreaks]}

          components={{
            // p: ({ children }) => <p style={{ break:true}}>{children}</p>,
            // li: ({ children }) => <li style={{ marginBottom: '0.5em', marginTop:"0.5em" }}>{children}</li>,
            // strong: ({ children }) => (<strong style={{ marginTop: '1em', marginBottom: '1em' }}>{children}</strong>),
            // h3: ({ children }) => <h3 style={{ marginBottom: '1em', marginTop: '1em'}}>{children}</h3>,
            pre: ({ children }) => (
              <pre
                style={{
                  wordWrap: "break-word", // Break long words inside <pre>
                  whiteSpace: "pre-wrap", // Maintain the white space and wrap lines
                  overflowWrap: "anywhere", // Break long words anywhere if needed
                }}
              >
                {children}
              </pre>
            ),
            code: ({ children }) => (
                <code class = "None" data-highlighted="no"
                  style={{

                  }}
                >
                  {children}
                </code>
              ),
            h1: ({ children }) => (
              <h1
                style={{
                  marginBottom: "1em",
                  marginTop: "1em",
                  fontSize: "2rem",
                }}
              >
                {children}
              </h1>
            ),
          }}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    );
  };

  export default UserMessage;