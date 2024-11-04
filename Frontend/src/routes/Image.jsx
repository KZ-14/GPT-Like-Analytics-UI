import sendBtn from "../assets/send.svg";
import userIcon from "../assets/user-icon.png";
// import gptImgLogo from './assets/chatgptLogo.svg';
import {
    faPlus,
    faPaperclip,
    faChevronLeft,
    faChevronRight,
    faTimes,
} from "@fortawesome/free-solid-svg-icons";
// import gptImgLogo from "../assets/logomaricogpt.png";
import gptImgLogo2 from "../assets/Logo_Image_White-Bg.png";
import gptImgLogo from '../assets/openart-image_wjqZ6CoD_1727706108279_raw_processed.jpg';
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Import uuid to generate unique session IDs
import { BOT_IMAGE } from "../Api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select from 'react-select';

import {
    faComments,
    faBullhorn,
    faFile,
    faVolumeLow,
    faHouse,
    faImage,
    faGavel
} from "@fortawesome/free-solid-svg-icons";

import { useLocation, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SuperApp from "./Components/SuperApp";
import UserMessage from "./Components/UserMessage";
import InitialAvatar from "./Components/InitialAvatar";
// import faFile from "../assets/document.png"

function Image() {
    const msgEnd = useRef(null);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState(uuidv4());
    const [displayedImage, setDisplayedImage] = useState(gptImgLogo2);

    const [style, setStyle] = useState(
        () => localStorage.getItem("style") || "style1"
    );

    const [appactive, setAppactive] = useState(
        () => localStorage.getItem("appactive") || null
    );

    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const username = location.state?.username || localStorage.getItem("username");
    const [isLeaving, setIsLeaving] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const displayName = localStorage.getItem("displayName");

    const handleSuperAppNavigation = (isLeaving) => {
        setIsLeaving(isLeaving);

    };

    // State to hold selected brand and product placement
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [selectedProductPlacement, setSelectedProductPlacement] = useState(null);
    const [includeFilters, setIncludeFilters] = useState({
        filter: "false",
        brand: 'none',
        product: 'none'
    });

    const updateImage = (brand, productPlacement) => {
        if (brand?.label && productPlacement?.label) {
            setDisplayedImage(`https://pod-predicted-pdf.s3.ap-south-1.amazonaws.com/${brand?.label.toLowerCase()}_${productPlacement?.label.toLowerCase()}_white_bg.png`);
            // setDisplayedImage(niharCentered);
        } else {
            setDisplayedImage(gptImgLogo2); // Default placeholder
        }
    };

    // Handle change for each dropdown
    const handleBrandChange = (selectedOption) => {
        // const selectedValue = event.target;
        setSelectedBrand(selectedOption);
        updateImage(selectedOption, selectedProductPlacement);
    };

    useEffect(() => {
        if (isChecked) {
            const new_filters = {
                filter: "true",
                brand: selectedBrand?.label?.toLowerCase() || 'none',
                product: selectedProductPlacement?.label?.toLowerCase() || 'none'
            }
            setIncludeFilters(new_filters);
        } else {
            setIncludeFilters({
                filter: "false",
                brand: 'none',
                product: 'none'
            });
        }
    }, [isChecked, selectedBrand, selectedProductPlacement]);

    // Function to handle product placement change
    const handleProductPlacementChange = (selectedOption) => {
        // const selectedValue = event.target;
        setSelectedProductPlacement(selectedOption);
        console.log('Selected Product Placement:', selectedOption);
        updateImage(selectedBrand, selectedOption);
    };

    useEffect(() => {
        console.log(includeFilters);
    }, [includeFilters]);


    // Function to handle checkbox change and log the selected filters
    const handleCheckboxAndFilterSelection = (e) => {
        setIsChecked(e.target.checked);
        // setIncludeFilters(e.target.checked);
        // if (e.target.checked) {
        // const new_filters = {
        //     filter: "true",
        //     brand: selectedBrand?.label?.toLowerCase(),
        //     product: selectedProductPlacement?.label?.toLowerCase()
        // }
        // setIncludeFilters(() => (new_filters))
        // } else {
        // setIncludeFilters({
        //     filter: "false",
        //     brand: 'none',
        //     product:'none'
        // })
        // }
    };

    const brandOptions = [
        { value: 'nihar', label: 'Nihar' },
        { value: 'saffola oats', label: 'Saffola Oats' },
        { value: 'hair and care', label: 'Hair and Care' }
    ];


    const productPlacementOptions = [
        { value: 'centered_position', label: 'Centered Position' },
        { value: 'left_position', label: 'Left Position' },
        // { value: 'right_position', label: 'Right Position' },
    ];

    const toggleStyle = () => {
        const newStyle = style === "style1" ? "style2" : "style1";
        setStyle((prevStyle) => newStyle);
        localStorage.setItem("style", newStyle);
    };

    const [chatSessions, setChatSessions] = useState([
        {
            id: `${username}_${uuidv4()}`,
            title: "Welcome to MaricoGPT",
            messages: [
                {
                    text: `Hi ${displayName}, I am MaricoGPT, a state-of-the-art language model. How can I help you today?`,
                    isBot: true,
                },
                // {
                //     type: "image",
                //     src: displayedImage, // Example image source
                //     alt: "Placeholder image",
                //     isBot: true,
                // },
            ],
        },
    ]);

    const [activeSessionId, setActiveSessionId] = useState(chatSessions[0].id);

    const scrollToBottom = () => {
        if (msgEnd.current) {
            msgEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Call scrollToBottom whenever messages update
    useEffect(() => {
        scrollToBottom();
    }, [chatSessions]);

    useEffect(() => {
        localStorage.setItem("appactive", appactive);
    }, [appactive]);

    // const UserMessage = ({ message }) => {
    //     return (
    //         <div className="txt">
    //             <ReactMarkdown
    //                 className="markdown"
    //                 // rehypePlugins={[rehypeRaw]}
    //                 remarkPlugins={[remarkBreaks, remarkGfm, rehypeHighlight]}
    //                 components={{
    //                     // p: ({ children }) => <p style={{ break:true}}>{children}</p>,
    //                     // li: ({ children }) => <li style={{ marginBottom: '0.5em', marginTop:"0.5em" }}>{children}</li>,
    //                     // strong: ({ children }) => (<strong style={{ marginTop: '1em', marginBottom: '1em' }}>{children}</strong>),
    //                     // h3: ({ children }) => <h3 style={{ marginBottom: '1em', marginTop: '1em'}}>{children}</h3>,
    //                     pre: ({ children }) => (
    //                         <pre
    //                             style={{
    //                                 wordWrap: "break-word", // Break long words inside <pre>
    //                                 whiteSpace: "pre-wrap", // Maintain the white space and wrap lines
    //                                 overflowWrap: "anywhere", // Break long words anywhere if needed
    //                             }}
    //                         >
    //                             {children}
    //                         </pre>
    //                     ),
    //                     h1: ({ children }) => (
    //                         <h1
    //                             style={{
    //                                 marginBottom: "1em",
    //                                 marginTop: "1em",
    //                                 fontSize: "2rem",
    //                             }}
    //                         >
    //                             {children}
    //                         </h1>
    //                     ),
    //                 }}
    //             >
    //                 {message.text}
    //             </ReactMarkdown>
    //         </div>
    //     );
    // };

    const handleSend = async () => {
        const text = input;
        setInput("");

        updateMessages(text, false);
        setIsBotTyping(true);
        try {
            const imageResponse = await BOT_IMAGE(text, includeFilters);
            if (imageResponse.src) {
                updateMessages("", true, false, imageResponse);
                setIsBotTyping(false);
            } else {
                updateMessages("Sorry Something Went Wrong", true, false);
                setIsBotTyping(false);
            }
        } catch (error) {
            console.error("Error handling chat:", error);
        } finally {
        }
    };

    const handleEnter = async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await handleSend();
        }
    };

    const handleSubmit = () => {
        // Implement what should happen when the submit button is clicked.
        console.log("Dropdown values submitted.");
    };

    const updateMessages = (
        text,
        isBot,
        isStreaming = false,
        imageResponse = null
    ) => {
        setChatSessions((prevSessions) => {
            const updatedSessions = prevSessions.map((session) => {
                if (session.id === activeSessionId) {
                    let newMessages = [...session.messages];

                    // Only add text message if text is not empty
                    if (text && text.trim() !== "") {
                        newMessages.push({
                            text: text
                                .replace(/\n/g, "<br>")
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                            isBot,
                        });
                    }

                    // If the image response is provided, append the image
                    if (imageResponse) {
                        newMessages.push({
                            type: "image",
                            src: imageResponse.src, // Use the URL from the image response
                            alt: imageResponse.alt, // Use the alt text from the image response
                            isBot: true,
                        });
                    }

                    return {
                        ...session,
                        messages: newMessages,
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

    const activeSession = chatSessions.find(
        (session) => session.id === activeSessionId
    );

    useEffect(() => {
        const link = document.getElementById("dynamic-css");
        if (link) {
            link.href = `${process.env.PUBLIC_URL}/styles/${style}.css`;
        }
    }, [style]);

    return (
        <div className={`App ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isLeaving ? "leaving" : ""}`}>
            <SuperApp onNavigation={handleSuperAppNavigation} />

            <div className={`Image-sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
                <div className="tooltip-container closeSidebarTooltip">
                    {" "}
                    {/* Tooltip wrapper */}
                    <button className="ImagecollapseBtn" onClick={toggleSidebar}>
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
                <div className={`image-container ${isSidebarCollapsed ? "collapsed" : ""}`}>
                    <img
                        src={displayedImage || "https://via.placeholder.com/300"}
                        alt="Image Graphic"
                        className="marketing-sidebar_image"
                    />
                </div>
                <div className={`dropdown-filters ${isSidebarCollapsed ? "collapsed" : ""}`}>
                    <label className="ImageLabeltxt" htmlFor="brandDropdown">Choose Brand:</label>
                    <Select
                        options={brandOptions}
                        onChange={handleBrandChange}
                        className="marketing-sidebar__custom-dropdown"
                    />

                    <label className="ImageLabeltxt" htmlFor="productPlacementDropdown">Choose Product Placement:</label>
                    <Select
                        options={productPlacementOptions}
                        onChange={handleProductPlacementChange}
                        className="marketing-sidebar__custom-dropdown"
                    />


                    <div className="marketing-sidebar__checkbox">
                        <input
                            type="checkbox"
                            id="includeFiltersCheckbox"
                            onChange={handleCheckboxAndFilterSelection}
                        />
                        <label className="ImageLabeltxt" htmlFor="includeFiltersCheckbox">Include these filters</label>
                    </div>

                </div>
            </div>

            <div className="main">

                <div className="Controls">
                    <div className="appName">
                        <span role="img" aria-label="chat">
                            <FontAwesomeIcon icon={faImage} />
                        </span>
                        IMAGE AI
                    </div>
                    <div className="Controls-right">

                        {style === "style1" ? (
                            <div className="ToggleButton" onClick={toggleStyle}>
                                <span role="img" aria-label="toggle">
                                    {/* 🌝 */}
                                    🌕
                                </span>
                            </div>
                        ) : (
                            <div className="ToggleButton" onClick={toggleStyle}>
                                <span role="img" aria-label="toggle">
                                    {/* 🌞 */}
                                    🔆
                                </span>
                            </div>
                        )}

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

                    {/* <button className="ToggleButton" onClick={toggleStyle}>Toggle</button> */}
                    {/* <div onClick={() => handleSameAppClick('/chat')}>
                        <FontAwesomeIcon icon={faHome} size="2x" />
                    </div> */}
                </div>
                {/* Chat content */}
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
                            <span className="txt">
                                <UserMessage message={message} />
                            </span>
                            {message.type === "image" && (
                                <img
                                    src={message.src}
                                    alt={message.alt}
                                    style={{ width: "300px", height: "auto" }}
                                />
                            )}
                        </div>
                    ))}
                    {isBotTyping && (
                        <div className="chat bot">
                            <img className="chatImg" src={gptImgLogo} alt="MaricoGPT" />
                            <span className="txt">Image is Generating...</span>
                        </div>
                    )}
                    <div ref={msgEnd} />
                </div>

                <div className="chatFooter">
                    <div className="inp">
                        <textarea
                            type="text"
                            className="chat-input-container"
                            dir="auto"
                            rows="1"
                            placeholder="Send a message"
                            value={input}
                            onKeyDown={handleEnter}
                            // onKeyDownCapture={handleShiftEnter}
                            onChange={(e) => setInput(e.target.value)}
                        // class="m-0 resize-none border-0 bg-transparent px-0 text-token-text-primary focus:ring-0 focus-visible:ring-0 max-h-[25dvh] max-h-52"
                        // style={{height: 50}}
                        />
                        <button className="send" onClick={handleSend}>
                            <img src={sendBtn} className="sendImage" alt="Send" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Image;
