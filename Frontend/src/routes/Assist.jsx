import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";

import {
    faComments,
    faFile,
    faVolumeLow,
    faHouse,
    faImage,
    faGavel
} from "@fortawesome/free-solid-svg-icons";

import { useLocation, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import SuperApp from "./Components/SuperApp";
// import faFile from "../assets/document.png"

function Assist() {

    const [style, setStyle] = useState(
        () => localStorage.getItem("style") || "style1"
    );

    const [appactive, setAppactive] = useState(
        () => localStorage.getItem("appactive") || null
    );

    const navigate = useNavigate();
    const location = useLocation();
    const username = location.state?.username || localStorage.getItem("username");
    const [isLeaving, setIsLeaving] = useState(false);

    const handleSuperAppNavigation = (isLeaving) => {
        setIsLeaving(isLeaving);
    
      };

    const toggleStyle = () => {
        const newStyle = style === "style1" ? "style2" : "style1";
        setStyle((prevStyle) => newStyle);
        localStorage.setItem("style", newStyle);
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
        <div className={`App ${isLeaving ? "leaving" : ""}`}>
            <SuperApp onNavigation={handleSuperAppNavigation} />
            <div className="coming-soon-container">
                <div className="coming-soon-content">
                    <h1 className="coming-soon-title">Assist AI is on its way!</h1>
                    {/* <p className="coming-soon-description">
                        Get ready to be more efficient with our upcoming tool.
                    </p> */}
                     </div>
            </div>
            
        </div>
    );
}

export default Assist;
