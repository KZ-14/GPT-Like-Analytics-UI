// import "./App.css";
// import './Marico_Colors.css'
// import './gpt.css'
import gptLogo from "../assets/chatgpt.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faPaperclip,
    faChevronLeft,
    faChevronRight,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
import sendBtn from "../assets/send.svg";
import userIcon from "../assets/user-icon.png";
// import gptImgLogo from './assets/chatgptLogo.svg';
// import gptImgLogo from "../assets/logomaricogpt.png";
// import gptImgLogo from "../assets/Image (1).jfif";
import gptImgLogo from '../assets/openart-image_wjqZ6CoD_1727706108279_raw_processed.jpg';

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Import uuid to generate unique session IDs
import { BOT, Load_Doc_Chat, new_chat_document } from "../Api";
import { RAG_BOT } from "../Api";
import { Load_Chat } from "../Api";
import { new_chat_normal } from "../Api";
import { call_retriever } from "../Api";
import { Chat_history_Load_Backend } from "../Api";
import { upload_File_Azure } from "../Api";
import { doc_Chat_history_Load_Backend } from "../Api";
import { Delete_chat } from "../Api";
import { update_title } from "../Api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import { useLocation, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faFile, faBullhorn, faHouse, faImage, faVolumeLow, faEdit, faTrash, faGavel } from "@fortawesome/free-solid-svg-icons";
import Message from "./Components/Message";
import SuperApp from "./Components/SuperApp";
import ThemeToggler from "./Components/ThemeToggler";
import InitialAvatar from "./Components/InitialAvatar";

function Document() {
    const [style, setStyle] = useState(() => localStorage.getItem('style') || 'style1');
    const navigate = useNavigate();

    const location = useLocation();
    const username = location.state?.username || localStorage.getItem('username');
    const displayName = localStorage.getItem("displayName");
    const [appactive, setAppactive] = useState(() => localStorage.getItem('appactive') || null)
    const msgEnd = useRef(null);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    // const [chatSessions, setChatSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [docchatSessions, setdocChatSessions] = useState([]);
    const [activedocSessionId, setActivedocSessionId] = useState(null);
    const [input, setInput] = useState("");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const scrollToBottom = () => {
        msgEnd.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [docchatSessions]);

    useEffect(() => {
        const link = document.getElementById('dynamic-css');
        if (link) {
            link.href = `${process.env.PUBLIC_URL}/styles/${style}.css`;
        }
    }, [style]);

    useEffect(() => {

    }, [style]);

    const [isLeaving, setIsLeaving] = useState(false);

    const handleSuperAppNavigation = (isLeaving) => {
        new_chat_document(activedocSessionId)
        setIsLeaving(isLeaving);
    };

    const initializationRef = useRef(false);

    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [chatType, setChatType] = useState("Document");
    const [isUploading, setIsUploading] = useState(false);
    // const [isDocumentUploaded, setIsDocumentUploaded] = useState();


    useEffect(() => {
        localStorage.setItem('appactive', appactive);
    }, [appactive]);


    useEffect(() => {
        let handleBeforeUnload = (event) => {
            // console.log("handleBeforeUnload called");
            new_chat_document(activedocSessionId);
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [activedocSessionId]);

    const LoadSessions = async (text) => {
        // const newSession = await Load_Chat(text); //// Yahpe ek aur API ka Code ayega
        const storedSession = await Load_Doc_Chat(`doc_${text}`)
        // setChatSessions((prevSessions) => [...prevSessions, ...newSession]);
        // console.log("Done")
        setdocChatSessions((prevSessions) => [...prevSessions, ...storedSession]);
        // console.log("Done2")

    };

    const initializeChatSession = async () => {
        if (docchatSessions.length === 0) {
            const initialSession = {
                id: `doc_${username}_${uuidv4()}`,
                title: "Untitled",
                uploaded: false,
                messages: [
                    {
                        text: `Hi ${displayName}, I am MaricoGPT, a state-of-the-art language model. Please upload a file from the chat bar and ask me to summarise, extract information or anything else you can think of.`,
                        isBot: true,
                    },
                ],
            };
            setdocChatSessions([initialSession]);
            setActivedocSessionId(initialSession.id);
            await LoadSessions(username.trim())
        }
    };

    const activedocSession = docchatSessions.find(
        (session) => session.id === activedocSessionId
    );

    useEffect(() => {
        scrollToBottom();
    }, [activedocSession]);

    useEffect(() => {
        if (username && !initializationRef.current) {
            initializationRef.current = true;
            setIsLoggedIn(true);
            initializeChatSession();
        }
    }, [username]);
    // useEffect(() => {
    //     if (username) {
    //         setIsLoggedIn(true);
    //         initializeChatSession();
    //     }
    // }, [username]);

    // if (!username) {
    //   return <Navigate to="/" replace />;
    // }  


    if (!username) {
        return <Navigate to="/" replace />;
    }


    const toggleStyle = () => {
        const newStyle = style === 'style1' ? 'style2' : 'style1';
        setStyle(prevStyle => (newStyle));
        localStorage.setItem('style', newStyle);
    };

    // Revisit this once

    const isDocumentUploadedForActiveSession = () => {
        if (!activedocSessionId) return false;
        const activeSession = docchatSessions.find(
            session => session.id === activedocSessionId
        );
        return activeSession?.uploaded || false;
    };
    
    const uploadFileToAzure = async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", activedocSessionId);
        try {
            // const response = await fetch("http://10.124.10.136:8000/upload-to-azure/", {
            //     method: "POST",
            //     body: formData,
            // });

            // if (!response.ok) {
            //     throw new Error(`Failed to upload file. Status: ${response.status}`);
            // }

            const result = await upload_File_Azure(formData);
            // console.log("File uploaded successfully:", result);

            updatedocMessages("Document has uploaded successfully.", true);
            setdocChatSessions(prevState =>
                prevState.map(session =>
                    session.id === activedocSessionId ? { ...session, uploaded: true } : session
                )
            );////// Yahpe Problem tha 
            await call_retriever(activedocSessionId);

            return result;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // const updateMessages = (text, isBot, isStreaming = false) => {
    //     setChatSessions((prevSessions) => {
    //         const updatedSessions = prevSessions.map((session) => {
    //             if (session.id === activeSessionId) {
    //                 return {
    //                     ...session,
    //                     messages: [
    //                         ...session.messages,
    //                         {
    //                             // text: text
    //                             //   .replace(/\n/g, "<br>")
    //                             //   .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
    //                             text: text,
    //                             isBot,
    //                         },
    //                     ],
    //                 };
    //             }
    //             return session;
    //         });
    //         return updatedSessions;
    //     });

    //     if (!isStreaming) {
    //         msgEnd.current.scrollIntoView();
    //     }
    // };

    const updatedocMessages = (text, isBot, isStreaming = false) => {
        setdocChatSessions((prevSessions) => {
            const updatedSessions = prevSessions.map((session) => {
                if (session.id === activedocSessionId) {
                    return {
                        ...session,
                        title: session.messages.length === 3 ? session.messages[2].text : session.title,
                        messages: [
                            ...session.messages,
                            {
                                // text: text
                                //   .replace(/\n/g, "<br>")
                                //   .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
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

    // const updateLastBotMessage = (text) => {
    //     setChatSessions((prevSessions) => {
    //         const updatedSessions = prevSessions.map((session) => {
    //             if (session.id === activeSessionId) {
    //                 const updatedMessages = session.messages.slice();
    //                 // updatedMessages[updatedMessages.length - 1].text = text
    //                 //   .replace(/\n/g, "<br>")
    //                 //   .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    //                 updatedMessages[updatedMessages.length - 1].text = text
    //                 return {
    //                     ...session,
    //                     messages: updatedMessages,
    //                 };
    //             }
    //             return session;
    //         });
    //         return updatedSessions;
    //     });
    // };

    const updatedocLastBotMessage = (text) => {
        setdocChatSessions((prevSessions) => {
            const updatedSessions = prevSessions.map((session) => {
                if (session.id === activedocSessionId) {
                    const updatedMessages = session.messages.slice();
                    // updatedMessages[updatedMessages.length - 1].text = text
                    //   .replace(/\n/g, "<br>")
                    //   .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                    updatedMessages[updatedMessages.length - 1].text = text
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


    const handledocSend = async () => {
        const text = input;
        setInput("");


        // const temp_Document = isDocumentUploaded.find(
        //   (session) => session.id === activedocSessionId
        // );
        const temp_Document = docchatSessions.find(
            (session) => session.id === activedocSessionId
        );

        if (temp_Document.uploaded === false) {
            alert("Please upload the document first.");
            return;
        };

        updatedocMessages(text, false);

        setIsBotTyping(true);

        try {
            if (chatType === "Document") {
                let combinedResponse = "";
                let isFirstChunk = true;
                let session = docchatSessions.find(
                    (session) => session.id === activedocSessionId
                );
                let Title = session.messages.length === 2 ? text : session.title;

                await RAG_BOT(text, activedocSessionId, Title, (chunk) => {
                    combinedResponse += chunk;

                    if (isFirstChunk) {
                        setIsBotTyping(false);
                        updatedocMessages(combinedResponse, true, true);
                        isFirstChunk = false;
                    } else {
                        updatedocLastBotMessage(combinedResponse);
                    }
                });
            }
        } catch (error) {
            console.error("Error handling chat:", error);
        } finally {
            setSelectedFile(null);
        }
    };

    const handledocEnter = async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const textarea = e.target;
            textarea.style.height = 'fit-content';
            await handledocSend();
        }
    };

    const handleInput = (e) => {
        const textarea = e.target;
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
        setInput(e.target.value);
      };


    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await uploadFileToAzure(file);
                setdocChatSessions(prevState =>
                    prevState.map(session =>
                        session.id === activedocSessionId ? { ...session, uploaded: true } : session
                    )
                );
                // alert("Document uploaded successfully.");
            } catch (error) {
                alert("Failed to upload document.");
            }
        }
    };

    const handleAttachClick = () => {
        fileInputRef.current.click();
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleNewdocChat = () => {
        new_chat_document(activedocSessionId);
        const newSessionId = `doc_${username.trim()}_${uuidv4()}`;
        // setSessionId(newSessionId);
        // const newDocument = {
        //   id: newSessionId,
        //   uploaded : false,
        //   retriever : false,
        // };
        // setIsDocumentUploaded((prevDocuments) => [...prevDocuments, newDocument]); // // Reset document uploaded state for new session
        addNewdocSession(newSessionId, "Untitled");
    };



    const UserMessage = ({ message }) => {
        return (
            <div className="txt">
                <ReactMarkdown
                    className="markdown"
                    // rehypePlugins={[rehypeRaw]}
                    remarkPlugins={[remarkBreaks, remarkGfm, rehypeHighlight]}
                    components={{
                        // p: ({ children }) => <p style={{ break:true}}>{children}</p>,
                        // li: ({ children }) => <li style={{ marginBottom: '0.5em', marginTop:"0.5em" }}>{children}</li>,
                        // strong: ({ children }) => (<strong style={{ marginTop: '1em', marginBottom: '1em' }}>{children}</strong>),
                        // h3: ({ children }) => <h3 style={{ marginBottom: '1em', marginTop: '1em'}}>{children}</h3>,
                        pre: ({ children }) => (
                            <pre
                                style={{
                                    wordWrap: "break-word",    // Break long words inside <pre>
                                    whiteSpace: "pre-wrap",    // Maintain the white space and wrap lines
                                    overflowWrap: "anywhere",  // Break long words anywhere if needed
                                }}
                            >
                                {children}
                            </pre>
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

    const addNewdocSession = (sessionId, title) => {
        const newSession = {
            id: sessionId,
            title: title,
            uploaded: false,
            messages: [
                {
                    text: `Hi ${displayName}, I am MaricoGPT, a state-of-the-art language model. Please upload a file from the chat bar and ask me to summarise, extract information or anything else you can think of.`,
                    isBot: true,
                },
            ],
        };
        setdocChatSessions((prevdocSessions) => [newSession, ...prevdocSessions]);
        setActivedocSessionId(sessionId);
    };

    // const handleSessionClick = (sessionId) => {
    //     new_chat_normal();
    //     // fetch(`http://10.124.10.136:8000/ChatHistoryLoad_Backend/`, {
    //     //     method: "POST",
    //     //     headers: {
    //     //         Accept: "application/json",
    //     //         "Content-Type": "application/json",
    //     //     },
    //     //     body: JSON.stringify({
    //     //         session_id: sessionId,
    //     //     }),
    //     // });
    //     Chat_history_Load_Backend(sessionId);
    //     setActiveSessionId(sessionId);
    // };

    const handledocSessionClick = (sessionId) => {
        new_chat_document(activedocSessionId);
        doc_Chat_history_Load_Backend(sessionId);
        const temp_Document = docchatSessions.find(
            (session) => session.id === sessionId
        );

        if (temp_Document.uploaded === true) {
            call_retriever(sessionId);
        };
        setActivedocSessionId(sessionId);
    };

    // const handleTitleClick = (id) => {
    //     setChatSessions((prev) =>
    //         prev.map((session) =>
    //             session.id === id ? { ...session, isEditing: true } : session
    //         )
    //     );
    // };

    // const handleTitleChange = (id, newTitle) => {
    //     setChatSessions((prev) =>
    //         prev.map((session) =>
    //             session.id === id ? { ...session, title: newTitle } : session
    //         )
    //     );
    // };

    const handledocTitleChange = (id, newTitle) => {
        setdocChatSessions((prev) =>
            prev.map((session) =>
                session.id === id ? { ...session, title: newTitle } : session
            )
        );
    };

    // const handleTitleSave = (id) => {
    //     setChatSessions((prev) =>
    //         prev.map((session) =>
    //             session.id === id ? { ...session, isEditing: false } : session
    //         )
    //     );
    // };

    const handledocTitleSave = (id, newTitle) => {
        setdocChatSessions((prev) =>
            prev.map((session) =>
                session.id === id ? { ...session, isEditing: false } : session
            )
        );
        // const sessionTitle = docchatSessions.find((session) => session.id === id)?.title;
        update_title(id, newTitle)
    };

    // const handleKeyDown = (e, id) => {
    //     if (e.key === "Enter") {
    //         handleTitleSave(id);
    //     }
    // };

    const handledocKeyDown = (e, id, newTitle) => {
        if (e.key === "Enter") {
            handledocTitleSave(id, newTitle);
        }
    };

    // const toggleMenu = (sessionId) => {
    //     setChatSessions((prevSessions) =>
    //         prevSessions.map(
    //             (session) =>
    //                 session.id === sessionId
    //                     ? { ...session, isMenuOpen: !session.isMenuOpen }
    //                     : { ...session, isMenuOpen: false }
    //         )
    //     );
    // };

    const handleShare = (id) => {
        // console.log(`Sharing chat ${id}`);
    };

    const handleDelete = async (id) => {
        await Delete_chat(id);
        // new_chat_document(activedocSessionId);
        setdocChatSessions((prevSessions) => {
            const updatedSessions = prevSessions.filter(session => session.id !== id);

            // If the deleted session was the active one, set a new active session
            if (id === activedocSessionId) {
                const newActiveIndex = updatedSessions.findIndex(session => session.id === id);
                if (newActiveIndex !== -1) {
                    // If there's a next session, make it active
                    setActivedocSessionId(updatedSessions[newActiveIndex].id);
                } else if (updatedSessions.length > 0) {
                    // If there's no next session but there are other sessions, make the first one active
                    setActivedocSessionId(updatedSessions[0].id);
                } else {
                    // If no sessions left, set activeSessionId to null or create a new session
                    setActivedocSessionId(null);
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
    // const handleEdit = (sessionId) => {
    //     setChatSessions((prevSessions) =>
    //         prevSessions.map((session) =>
    //             session.id === sessionId
    //                 ? { ...session, isEditing: true }
    //                 : { ...session, isEditing: false }
    //         )
    //     );
    // };

    const handledocEdit = (sessionId) => {
        setdocChatSessions((prevSessions) =>
            prevSessions.map((session) =>
                session.id === sessionId
                    ? { ...session, isEditing: true }
                    : { ...session, isEditing: false }
            )
        );
    };

    // My test Function start

    // const handleLogin = async () => {
    //     // const newSessionId = `harshil_${uuidv4()}`;
    //     // setSessionId(newSessionId);
    //     // setIsDocumentUploaded(false); // Reset document uploaded state for new session
    //     // addNewSession(newSessionId, "Untitled");
    //     const text = username.trim();
    //     // await LoadSessions(text);
    //     console.log(chatSessions)
    //     console.log(chatSessions[0].id)
    //     if (chatSessions[0].id == "cHome") {
    //         if (text) {
    //             const userSessionId = `${text}_${uuidv4()}`;
    //             const userSession = [{
    //                 id: userSessionId,
    //                 title: `Chat with ${text}`,
    //                 messages: [
    //                     {
    //                         text: `Hi ${username}, I am MaricoGPT, a state-of-the-art language model. How can I help you today?`,
    //                         isBot: true,
    //                     }
    //                 ],
    //             }]
    //             setChatSessions(userSession);
    //             console.log(chatSessions)
    //             // setSessionId(userSessionId);
    //             setActiveSessionId(userSessionId);
    //             // setIsLoggedIn(true);
    //         } else {
    //             alert("Please enter a valid username.");
    //         }
    //     }
    //     if (docchatSessions[0].id == "cHome") {
    //         if (text) {
    //             const userSessionId = `doc_${text}_${uuidv4()}`;
    //             const userdocSession = [
    //                 {
    //                     id: userSessionId,
    //                     title: `Chat with ${text}`,
    //                     uploaded: false,
    //                     messages: [
    //                         {
    //                             text: `Hi ${username}, I am MaricoGPT, a state-of-the-art language model. How can I help you today?`,
    //                             isBot: true,

    //                         }
    //                     ],
    //                 }
    //             ]
    //             setdocChatSessions(userdocSession);
    //             // setSessionId(userSessionId);
    //             setActivedocSessionId(userSessionId);
    //             // setIsLoggedIn(true);
    //         } else {
    //             alert("Please enter a valid username.");
    //         }
    //     }
    //     setActiveSessionId(chatSessions[0].id)
    //     setActivedocSessionId(docchatSessions[0].id)
    //     // setUsername("");
    //     setIsLoggedIn(true);

    // };

    // My test Function end

    return (
        <div className={`App ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isLeaving ? 'leaving' : ''}`}>
            {isUploading && (
                <div className="loading-overlay">
                    <div className="loading-message">Document is being uploaded...</div>
                </div>
            )}
            <SuperApp onNavigation={handleSuperAppNavigation} />
            <div className={`sideBar ${isSidebarCollapsed ? "collapsed" : ""}`}>
                <div className="upperSide">
                    <div className="tooltip-container closeSidebarTooltip">
                        {" "}
                        {/* Tooltip wrapper */}
                        <button className="collapseBtn" onClick={toggleSidebar}>
                            <FontAwesomeIcon
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
                    {chatType === "Document" && (
                        <>
                            <div className="tooltip-container newChatTooltip">
                                <button className="newChatBtn" onClick={handleNewdocChat}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </button>
                                <span className="tooltip">Add New Chat</span>
                            </div>
                            <div className="chatTitles">
                                {docchatSessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`chatTitle ${session.id === activedocSessionId ? "active" : ""
                                            } ${isSidebarCollapsed ? "collapsed" : ""}`}
                                    >
                                        {session.isEditing ? (
                                            <input
                                                type="text"
                                                value={session.title}
                                                onChange={(e) =>
                                                    handledocTitleChange(session.id, e.target.value)
                                                }
                                                onBlur={(e) => handledocTitleSave(session.id, e.target.value)}
                                                onKeyDown={(e) => handledocKeyDown(e, session.id, e.target.value)}
                                                className="chatTitleInput"
                                            />
                                        ) : (
                                            <span
                                                className="chatTitleText"
                                                onClick={() => handledocSessionClick(session.id)}
                                            >
                                                {session.title}
                                            </span>
                                        )}
                                        <div className="threeDotMenu">
                                            <button>...</button>
                                            <div className="menuOptions">
                                                <button onClick={() => handledocEdit(session.id)}>
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
                            </div>{" "}
                        </>
                    )}
                </div>
            </div>
            <div className="main">
                <div className="Controls">
                    <div className="appName">
                        <span role="img" aria-label="document">📄</span>
                        DOC AI
                    </div>
                    <div className="Controls-right">
                        {style === "style1" ?
                            (
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
                                </div>)}
                        {/* <ThemeToggler/> */}
                        {/* <button className="ToggleButton" onClick={toggleStyle}>Toggle</button> */}
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
                {chatType == "Document" && activedocSession && (
                    <>
                        <div className="chats">
                            {activedocSession.messages.map((message, i) => (
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
                                    <img className='chatImg' src={gptImgLogo} alt="ChatGPT" />
                                    <span className='txt'>MaricoGPT is typing...</span>
                                </div>
                            )}
                            <div ref={msgEnd} />
                        </div>
                        <div className="chatFooter">
                            <div className="inp">
                                {chatType === "Document" && !isDocumentUploadedForActiveSession() && (
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
                                )}
                                <textarea
                                    type="text"
                                    className="chat-input-container"
                                    dir="auto"
                                    rows="1"
                                    placeholder="Send a message"
                                    value={input}
                                    onKeyDown={handledocEnter}
                                    // onKeyDownCapture={handleShiftEnter}
                                    onChange={(e) => setInput(e.target.value)}
                                // class="m-0 resize-none border-0 bg-transparent px-0 text-token-text-primary focus:ring-0 focus-visible:ring-0 max-h-[25dvh] max-h-52"
                                // style={{height: 50}}
                                />
                                <button className="send" onClick={handledocSend}>
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

export default Document;
