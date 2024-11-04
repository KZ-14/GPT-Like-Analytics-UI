import { useEffect, useRef, useState } from "react";
import hljs from 'highlight.js';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";

const Message = ({ message }) => {
  const codeRef = useRef(null);
  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightAll(codeRef.current);
    }
  }, [codeRef.current]);

  // Ensure content is a string
  const getContentAsString = (input) => {
    return typeof input === "string" ? input : String(input);
  };

  // Function to split content into text and code segments
  const splitContent = (content) => {
    const regex = /```(\w+)?\n([\s\S]*?)```/g; // Regex to match code blocks
    const parts = [];
    let lastIndex = 0;

    // Convert content to string
    content = getContentAsString(content);

    content.replace(regex, (match, langIdentifier, codeBlock, offset) => {
      // Add non-code text segment
      if (offset > lastIndex) {
        parts.push({
          type: "text",
          content: content.slice(lastIndex, offset),
        });
      }
      // Add code block segment
      parts.push({ type: "code", content: codeBlock.trim(), language: langIdentifier || "plaintext", });
      lastIndex = offset + match.length;
      return match;
    });

    // Add remaining text segment
    if (lastIndex < content.length) {
      parts.push({ type: "text", content: content.slice(lastIndex) });
    }

    return parts;
  };

  // Function to copy code to clipboard
  const copyCodeToClipboard = (code, event) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          event.target.classList.add("copied");
          setTimeout(() => {
            event.target.classList.remove("copied");
          }, 1000);
        })
        .catch((err) => {
          // alert("Failed to copy text: ", err);
        });
    } else {
      // Fallback to textarea method
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand("copy");
        if (successful) {
          // Add a CSS class to change the color
          event.target.classList.add("copied");
          // Remove the color change after 1 second
          setTimeout(() => {
            event.target.classList.remove("copied");
          }, 1000);
        } else {
          alert("Failed to copy code");
        }
      } catch (err) {
        alert("Fallback: Could not copy code");
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  // Render content with text and code blocks
  const renderContent = () => {
    const content = getContentAsString(message);
    const segments = splitContent(content);

    return segments.map((segment, index) => {
      if (segment.type === "text") {
        return (
          <ReactMarkdown
            key={index}
            children={segment.content}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
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
              p: ({ children }) => (
                <p style={{ marginBottom: "1em" }}>{children}</p>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: "0.5em", marginTop: "1em" }}>
                  {children}
                </li>
              ),
              strong: ({ children }) => (
                <strong style={{ marginTop: "1em", marginBottom: "1em" }}>
                  {children}
                </strong>
              ),
              h3: ({ children }) => (
                <h3 style={{ marginBottom: "1em", marginTop: "1em" }}>
                  {children}
                </h3>
              ),
              table: ({ children }) => (
                <table className="styledTable">
                  {children}
                </table>
              ),
            }}
          />
        );
      }
      if (segment.type === "code") {
        const codeContent = segment.content
          .replace(/^```.*\n/, "")
          .replace(/```$/, '').trim();
        return (
          <div key={index} className="code-container">
            <div className="code-header" >
              <span className="language-label">
                {segment.language ? segment.language : "plaintext"}
              </span>
              <span
                className="copy-code-button"
                onClick={(event) => copyCodeToClipboard(codeContent, event)}
                role="button"
                aria-label="Copy code"
                title="Copy code"
                style={{ cursor: "pointer", fontSize: "1em", marginLeft: "auto" }}
              >
                {/* &#128221; */}
                <span style={{marginRight:"1rem"}}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path fillRule="evenodd" d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 010 1.5h-1.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-1.5a.75.75 0 011.5 0v1.5A1.75 1.75 0 019.25 16h-7.5A1.75 1.75 0 010 14.25v-7.5z"></path>
                    <path fillRule="evenodd" d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0114.25 11h-7.5A1.75 1.75 0 015 9.25v-7.5zm1.75-.25a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25h-7.5z"></path>
                  </svg>
                </span>
                Copy code
              </span>
            </div>

            <pre className="pre_code">
              <code ref={codeRef} className="pre_code">{codeContent}</code>
            </pre>
            {/* <span
                className="copy-emoji"
                onClick={(event) => copyCodeToClipboard(codeContent, event)}
                role="button"
                aria-label="Copy code"
                title="Copy code"
              >
                &#128221;
              </span> */}
          </div>
        );
      }
      return null;
    });
  };

  return renderContent();
};


export default Message;