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
  faDatabase,
  faEdit,
  faTrash,
  faMessage
} from "@fortawesome/free-solid-svg-icons";
// import sendBtn from "../assets/send.svg";
// import gptImgLogo from '../assets/openart-image_wjqZ6CoD_1727706108279_raw_processed.jpg';
// import gptImgLogo from "../assets/logomaricogpt.png";
// import gptImgLogo from "../assets/Image (1).jfif";
import AssistAI from "../../assets/image.png"
import { useEffect, useRef, useState } from "react";
// import { new_chat_normal } from "../";
import { useLocation, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { new_chat_normal,new_chat_document } from "../../Api";

function SuperApp ({ onNavigation }) {

    const [style, setStyle] = useState(
        () => localStorage.getItem("style") || "style1"
        );

    const [appactive, setAppactive] = useState(
    () => localStorage.getItem("appactive") || null
    );

    const navigate = useNavigate();
    const location = useLocation();
    const username = location.state?.username || localStorage.getItem("username");
    // const [isLeaving, setIsLeaving] = useState(false);

    const handleAppClick = (path, appname) => {
      if (appactive === "Chat" && appname !== "Chat") {
        // new_chat_normal();
        // console.log(appactive,appname)
      }

      if (appactive === "Document" && appname !== "Document") {
        // new_chat_document();
      }

      if (appactive !== appname) {
        // console.log(appactive)
        // console.log(appname)
        setAppactive(appname);
        onNavigation(true); // Set isLeaving to true
      }
      setTimeout(() => {
        navigate(path, { state: { username } });
        onNavigation(false); // Set isLeaving back to false after navigation
      }, 300);
    };
  
    
      const handleSameAppClick = (path) => {
    
        setTimeout(() => {
          navigate(path, { state: { username } });
        }, 300);
      };

    useEffect(() => {
    localStorage.setItem("appactive", appactive);
    }, [appactive]);

    useEffect(() => {
        const link = document.getElementById("dynamic-css");
        if (link) {
          link.href = `${process.env.PUBLIC_URL}/styles/${style}.css`;
        }
      }, [style]);

    return (
        <>
        <div className="right-sidebar">
        <button
          className={`superusercard ${appactive === "Chat" ? "active" : ""}`}
          onClick={() => handleAppClick("/chat","Chat")}
        >
          <FontAwesomeIcon className="sidebarlogo" icon={faComments} />
          <span className="sidebartext">Chat-AI</span>

          {/* <span className="appTile"><span className="appTitleText">
                        Chat </span> </span> */}
        </button>
        <button
          className={`superusercard ${appactive === "Document" ? "active" : ""
            }`}
          onClick={() => handleAppClick("/document", "Document")}
        >
          {/* <span className="appTile"><span className="appTitleText">
                Document </span> </span> */}
          <FontAwesomeIcon className="sidebarlogo" icon={faFile} />
          <span className="sidebartext">Doc-AI</span>
        </button>
        <button
          className={`superusercard ${appactive === "Image" ? "active" : ""
            }`}
          onClick={() => handleAppClick("/Image", "Image")}
        >
          {/* <span className="appTile"><span className="appTitleText">
                Image </span> </span> */}
          <FontAwesomeIcon className="sidebarlogo" icon={faImage} />
          <span className="sidebartext">Image-AI</span>
        </button>

        <button
          className={`superusercard ${appactive === "Audio" ? "active" : ""}`}
          onClick={() => handleAppClick("/audio", "Audio")}
        >
          <FontAwesomeIcon className="sidebarlogo" icon={faVolumeLow} />
          <span className="sidebartext">Audio-AI</span>
        </button>

        <button
          className={`superusercard ${appactive === "Query" ? "active" : ""}`}
          onClick={() => handleAppClick("/query", "Query")}
        >
          <FontAwesomeIcon className="sidebarlogo" icon={faDatabase} />
          <span className="sidebartext">Query-AI</span>
        </button>

        <button
          className={`superusercard ${appactive === "Assist" ? "active" : ""
            }`}
          onClick={() => handleAppClick("/Assist", "Assist")}
        >
          {/* <span className="appTile"><span className="appTitleText"> /home/admharshila/harshil/docker_test/MaricoGPT/Frontend/src/assets/image.png
                Image </span> </span> */}
          <img className= "sidebarlogo" style={{ width: "40px", height: "40px" }} src={AssistAI} alt="admin" />
          {/* <FontAwesomeIcon className="sidebarlogo" icon={faMessage} /> */}
          <span className="sidebartext">Assist-AI</span>
          <span className="sidebartext-comming-soon">Stay Tuned!</span>
        </button>
        {/* <button className="superusercard" onClick={() => handleAppClick('/Image')}>
                    <FontAwesomeIcon className = "sidebarlogo" icon={faBullhorn} />
                    <span className="sidebartext">Image</span>
                </button> */}
        <div style={{ flexGrow: 1 }} />

        {/* <!-- Home button --> */}
        {/* <button className="superusercard home-button" onClick={() => handleAppClick("/")}> */}
        <button className="superusercard" onClick={() => handleAppClick("/")}>
          <FontAwesomeIcon className="sidebarlogo" icon={faHouse} />
          {/* <span className="sidebarlogo">🏠</span> */}
          <span className="sidebartext">Home</span>
        </button>
      </div>
        </>
    )
}

export default SuperApp;