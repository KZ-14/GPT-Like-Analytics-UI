// import "./App.css";
// import './Marico_Colors.css'
// import './gpt.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faChevronLeft,
  faChevronRight,
  faGavel,
  faComments,
  faFile,
  faVolumeLow,
  faHouse,
  faImage,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import sendBtn from "../assets/send.svg";
// import gptImgLogo from "../assets/Gemini_Generated_Image_aw52wvaw52wvaw52 1.jpeg";

import gptImgLogo from "../assets/openart-image_wjqZ6CoD_1727706108279_raw_processed.jpg";
// import gptImgLogo from "../assets/logomaricogpt.png";
// import gptImgLogo from "../assets/Image (1).jfif";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { BOT } from "../Api";
import { Load_Chat } from "../Api";
import { new_chat_normal } from "../Api";
import { Chat_history_Load_Backend } from "../Api";
import { Delete_chat } from "../Api";
import { update_title } from "../Api";
import { useLocation, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Message from "./Components/Message";
import UserMessage from "./Components/UserMessage";
import SuperApp from "./Components/SuperApp";
import ThemeToggler from "./Components/ThemeToggler";
import InitialAvatar from "./Components/InitialAvatar";

function Chat() {
  const [style, setStyle] = useState(
    () => localStorage.getItem("style") || "style1"
  );

  const [appactive, setAppactive] = useState(
    () => localStorage.getItem("appactive") || null
  );

  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username || localStorage.getItem("username");
  const displayName = localStorage.getItem("displayName");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  const handleSuperAppNavigation = (isLeaving) => {
    new_chat_normal(activeSessionId);
    setIsLeaving(isLeaving);
  };

  // const handleAppClick = (path, appname) => {
  //   setAppactive(appname);
  //   new_chat_normal();
  //   setIsLeaving(true);
  //   setTimeout(() => {
  //     navigate(path, { state: { username } });
  //   }, 300);
  // };

  // const handleSameAppClick = (path) => {
  //   setTimeout(() => {
  //     navigate(path, { state: { username } });
  //   }, 300);
  // };
  const msgEnd = useRef(null);
  const initializationRef = useRef(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  // const [activeSessionId, setActiveSessionId] = useState(chatSessions[0].id);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const scrollToBottom = () => {
    msgEnd.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem("appactive", appactive);
  }, [appactive]);

  useEffect(() => {
    scrollToBottom();
  }, [chatSessions]);

  useEffect(() => {
    const link = document.getElementById("dynamic-css");
    if (link) {
      link.href = `${process.env.PUBLIC_URL}/styles/${style}.css`;
    }
  }, [style]);

  const [chatType, setChatType] = useState("Chat");

  useEffect(() => {
    let handleBeforeUnload = (event) => {
      // console.log("handleBeforeUnload called");
      new_chat_normal(activeSessionId);
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeSessionId]);

  const LoadSessions = async (text) => {
    const storedSession = await Load_Chat(text);
    // console.log(storedSession);
    setChatSessions((prevSessions) => [...prevSessions, ...storedSession]);
    // console.log("Done");
  };

  const initializeChatSession = async () => {
    // console.log("Existing Session length", chatSessions.length);
    if (chatSessions.length === 0) {
      const initialSession = {
        id: `${username}_${uuidv4()}`,
        title: "Untitled",
        messages: [
          {
            text: `Hi ${displayName}, I am MaricoGPT, a state-of-the-art language model. How can I help you today?`,
            isBot: true,
          },
        ],
      };
      setChatSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      // console.log(chatSessions);
      await LoadSessions(username.trim());
    }
  };

  const activeSession = chatSessions.find(
    (session) => session.id === activeSessionId
  );

  useEffect(() => {
    scrollToBottom();
  }, [activeSession]);

  useEffect(() => {
    if (username && !initializationRef.current) {
      initializationRef.current = true;
      setIsLoggedIn(true);
      initializeChatSession();
    }
  }, [username]);

  if (!username) {
    return <Navigate to="/" replace />;
  }

  //   if (!isLoggedIn) {
  //     return <Navigate to="/" replace />;
  //   }

  const toggleStyle = () => {
    const newStyle = style === "style1" ? "style2" : "style1";
    setStyle((prevStyle) => newStyle);
    localStorage.setItem("style", newStyle);
  };

  const updateMessages = (text, isBot, isStreaming = false) => {
    setChatSessions((prevSessions) => {
      const updatedSessions = prevSessions.map((session) => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            title:
              session.messages.length === 2
                ? session.messages[1].text
                : session.title,
            messages: [
              ...session.messages,
              {
                text: text,
                isBot,
              },
            ],
          };
        }
        return session;
      });
      return updatedSessions;
    });

    if (!isStreaming) {
      msgEnd.current.scrollIntoView();
    }
  };

  const updateLastBotMessage = (text) => {
    setChatSessions((prevSessions) => {
      const updatedSessions = prevSessions.map((session) => {
        if (session.id === activeSessionId) {
          const updatedMessages = session.messages.slice();
          updatedMessages[updatedMessages.length - 1].text = text;
          return {
            ...session,
            messages: updatedMessages,
          };
        }
        return session;
      });
      return updatedSessions;
    });
  };

  const handleSend = async () => {   
    // const textarea = e.target;
    // textarea.style.height = 'fit-content';
    const text = input;
    setInput("");
    updateMessages(text, false);
    setIsBotTyping(true);
    try {
      let combinedResponse = "";
      let isFirstChunk = true;
      let session = chatSessions.find(
        (session) => session.id === activeSessionId
      );
      let Title = session.messages.length === 1 ? text : session.title;
      await BOT(text, activeSessionId, Title, (chunk) => {
        combinedResponse += chunk;

        if (isFirstChunk) {
          setIsBotTyping(false);
          updateMessages(combinedResponse, true, true);
          isFirstChunk = false;
        } else {
          updateLastBotMessage(combinedResponse);
        }
      });
    } catch (error) {
      console.error("Error handling chat:", error);
    } finally {
    }
  };

  const handleEnter = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const textarea = e.target;
      textarea.style.height = 'fit-content';
      await handleSend();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNewChat = () => {
    new_chat_normal(activeSessionId);
    const newSessionId = `${username.trim()}_${uuidv4()}`;
    // setSessionId(newSessionId);
    addNewSession(newSessionId, "Untitled");
  };

  const addNewSession = (sessionId, title) => {
    const newSession = {
      id: sessionId,
      title: title,
      messages: [
        {
          text: `Hi ${displayName}, I am MaricoGPT, a state-of-the-art language model. How can I help you today?`,
          isBot: true,
        },
      ],
    };
    setChatSessions((prevSessions) => [newSession, ...prevSessions]);
    setActiveSessionId(sessionId);
  };

  const handleSessionClick = (sessionId) => {
    new_chat_normal(activeSessionId);
    Chat_history_Load_Backend(sessionId);
    setActiveSessionId(sessionId);
  };

  const handleTitleClick = (id) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, isEditing: true } : session
      )
    );
  };

  const handleTitleChange = (id, newTitle) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, title: newTitle } : session
      )
    );
  };

  const handleTitleSave = (id, newTitle) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, isEditing: false } : session
      )
    );
    // const sessionTitle = chatSessions.find((session) => session.id === id)?.title;
    update_title(id, newTitle);
    // const text = "Saving the title for this chat session"
    // BOT(text, id, sessionTitle, (chunk) => {
    // });
  };

  const handleKeyDown = (e, id, newTitle) => {
    if (e.key === "Enter") {
      handleTitleSave(id, newTitle);
    }
  };

  const toggleMenu = (sessionId) => {
    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId
          ? { ...session, isMenuOpen: !session.isMenuOpen }
          : { ...session, isMenuOpen: false }
      )
    );
  };

  const handleShare = (id) => {
    // console.log(`Sharing chat ${id}`);
  };

  const handleDelete = async (id) => {
    await Delete_chat(id);
    // new_chat_normal(activeSessionId);
    setChatSessions((prevSessions) => {
      const updatedSessions = prevSessions.filter(
        (session) => session.id !== id
      );

      // If the deleted session was the active one, set a new active session
      if (id === activeSessionId) {
        const newActiveIndex = updatedSessions.findIndex(
          (session) => session.id === id
        );
        if (newActiveIndex !== -1) {
          // If there's a next session, make it active
          setActiveSessionId(updatedSessions[newActiveIndex].id);
        } else if (updatedSessions.length > 0) {
          // If there's no next session but there are other sessions, make the first one active
          setActiveSessionId(updatedSessions[0].id);
        } else {
          // If no sessions left, set activeSessionId to null or create a new session
          setActiveSessionId(null);
          // Optionally, you might want to create a new session here
          // handleNewChat();
        }
      }

      return updatedSessions;
    });
  };

  //   const handleEdit = (sessionId) => {
  //     const updatedSessions = chatSessions.map((session) =>
  //       session.id === sessionId ? { ...session, isEditing: true } : session
  //     );
  //     setChatSessions(updatedSessions);
  //   };
  const handleEdit = (sessionId) => {
    setChatSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId
          ? { ...session, isEditing: true }
          : { ...session, isEditing: false }
      )
    );
  };

  const handleInput = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    setInput(e.target.value);
  };

  return (
    <div
      className={`App ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${
        isLeaving ? "leaving" : ""
      }`}
    >
      <SuperApp onNavigation={handleSuperAppNavigation} />

      <div className={`sideBar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="upperSide">
          <div className="tooltip-container closeSidebarTooltip">
            {" "}
            {/* Tooltip wrapper */}
            <button className="collapseBtn" onClick={toggleSidebar}>
              <FontAwesomeIcon className="collapseIcon"
                icon={isSidebarCollapsed ? faChevronRight : faChevronLeft}
              />
            </button>
            {isSidebarCollapsed ? (
              <span className="tooltip">Open Sidebar</span>
            ) : (
              <span className="tooltip">Close Sidebar</span>
            )}
            {/* <span className="tooltip">Close Sidebar</span> */}
          </div>
          {chatType === "Chat" && (
            <>
              <div className="tooltip-container newChatTooltip">
                <button className="newChatBtn" onClick={handleNewChat}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <span className="tooltip" onClick={handleNewChat}>
                  Add New Chat
                </span>
              </div>
              <div className="chatTitles">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`chatTitle ${
                      session.id === activeSessionId ? "active" : ""
                    } ${isSidebarCollapsed ? "collapsed" : ""}`}
                  >
                    {session.isEditing ? (
                      <input
                        type="text"
                        value={session.title}
                        onChange={(e) =>
                          handleTitleChange(session.id, e.target.value)
                        }
                        onBlur={(e) =>
                          handleTitleSave(session.id, e.target.value)
                        }
                        onKeyDown={(e) =>
                          handleKeyDown(e, session.id, e.target.value)
                        }
                        className="chatTitleInput"
                      />
                    ) : (
                      <span
                        className="chatTitleText"
                        onClick={() => handleSessionClick(session.id)}
                      >
                        {session.title}
                      </span>
                    )}
                    <div className="threeDotMenu">
                      <button>...</button>

                      <div className="menuOptions">
                        <button onClick={() => handleEdit(session.id)}>
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        {/* <button onClick={() => handleShare(session.id)}>
                          Share
                        </button> */}
                        <button onClick={() => handleDelete(session.id)}>
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="main">
        <div className="Controls">
          <div className="appName">
            {/* <span className= "" role="img" aria-label="chat">
              💬
            </span> */}
              Chat-AI
          </div>
          <div className="Controls-right">
          {style === "style1" ? (
            <div className="ToggleButton" onClick={toggleStyle}>
              <span role="img" aria-label="toggle">
                🌕
              </span>
            </div>
          ) : (
            <div className="ToggleButton" onClick={toggleStyle}>
              <span role="img" aria-label="toggle">
                🔆
              </span>
            </div>
          )}
          
          {/* <ThemeToggler/> */}

          {/* <button className="ToggleButton" onClick={toggleStyle}>Toggle</button> */}
          {/* <div onClick={() => handleSameAppClick('/chat')}>
                        <FontAwesomeIcon icon={faHome} size="2x" />
                    </div> */}
          {/* <div className="mb-8">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">HA</span>
          </div>
        </div> */}
        <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <InitialAvatar name={displayName} size="small" />
            </div>
          </div></div>
        </div>
        {/* {selectedFile && (
                    <div className="attached-file">
                        <span>{selectedFile.name}</span>
                        <button className="remove-file-btn" onClick={removeSelectedFile}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                )} */}
        {chatType == "Chat" && activeSession && (
          <>
            <div className="chats">
              {activeSession.messages.map((message, i) => (
                <div
                  key={i}
                  className={message.isBot ? "chat bot" : "chat chatUser"}
                >
                  <img
                    className="chatImg"
                    src={message.isBot ? gptImgLogo : ""}
                    alt=""
                    style={message.isBot ? {} : { visibility: "hidden" }}
                  />
                  {/* <span className='txt' dangerouslySetInnerHTML={{ __html: message.text }}></span> */}
                  {message.isBot ? (
                    <span className="txt" style={{ paddingTop: 6.5 }}>
                      <Message message={message.text} />
                    </span>
                  ) : (
                    // User message rendering
                    <span className="txt">
                      <UserMessage message={message} />
                    </span>
                  )}
                </div>
              ))}
              {isBotTyping && (
                <div className="chat bot">
                  <img className="chatImg" src={gptImgLogo} alt="MaricoGPT" />
                  <span className="txt">MaricoGPT is typing...</span>
                </div>
              )}
              <div ref={msgEnd} />
            </div>
            <div className="chatFooter">
              <div className="inp">
                {/* {chatType === "Document" && (
                  <>
                    <button className="attachBtn" onClick={handleAttachClick}>
                      <FontAwesomeIcon icon={faPaperclip} />
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                  </>
                )} */}
                <textarea
                  type="text"
                  className="chat-input-container"
                  dir="auto"
                  rows="1"
                  placeholder="Send a message"
                  value={input}
                  onKeyDown={handleEnter}
                  // onKeyDownCapture={handleShiftEnter}
                  onChange={handleInput}
                  // class="m-0 resize-none border-0 bg-transparent px-0 text-token-text-primary focus:ring-0 focus-visible:ring-0 max-h-[25dvh] max-h-52"
                  // style={{height: 50}}
                />
                <button className="send" onClick={handleSend}>
                  <img src={sendBtn} className="sendImage" alt="Send" />
                </button>
              </div>
            </div>{" "}
          </>
        )}
      </div>
    </div>
  );
}

export default Chat;
