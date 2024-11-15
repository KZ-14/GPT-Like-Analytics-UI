import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal, useAccount } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import { Helmet } from "react-helmet";
import AI_Image from "../assets/AI_image.jpg";
import gptImgLogo from "../assets/Image (1).jfif";
import Loading from './Components/Loading';

function Root({ setMainUsername }) {
  const { instance, accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();
  const [style, setStyle] = useState(() => localStorage.getItem('style') || 'style2');
  const [appactive, setAppactive] = useState(() => localStorage.getItem('appactive') || 'Chat');
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MSAL
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Wait for MSAL to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing MSAL:", error);
        setIsLoading(false);
      }
    };

    initializeMsal();
  }, []);

  useEffect(() => {
    localStorage.setItem('appactive', appactive);
  }, [appactive]);

  useEffect(() => {
    localStorage.setItem('style', style);
  }, [style]);

  // Handle the authentication state
  useEffect(() => {
    const handleAuth = async () => {
      if (!isInitialized) {
        return;
      }

      if (account && !userProfile) {
        try {
          await getUserProfile();
        } catch (error) {
          console.error("Error in auth handling:", error);
          // If the error is due to token expiration, try to refresh
          if (error.message.includes('token')) {
            try {
              await handleLogin();
            } catch (refreshError) {
              console.error("Error refreshing token:", refreshError);
            }
          }
        } finally {
          setIsLoading(false);
        }
      } else if (!account && inProgress === 'none') {
        setIsLoading(false);
      }
    };

    handleAuth();
  }, [account, inProgress, isInitialized]);

  const getUserProfile = async () => {
    if (!isInitialized) {
      throw new Error("MSAL not initialized");
    }

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });

      const profileData = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${response.accessToken}`
        }
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
      // console.log("Heeeeyyy")
      setUserProfile(profileData);
      setMainUsername(profileData.userPrincipalName);
      localStorage.setItem('username', profileData.userPrincipalName);
      localStorage.setItem('displayName', profileData.displayName);
      // console.log(profileData.jobTitle,profileData.Department)
      await handleCardClick('/chat', "Chat");
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  };

  const handleLogin = async () => {
    try {
      if (!isInitialized) {
        throw new Error("MSAL not initialized");
      }
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      alert('Login failed. Please try again.');
    }
  };

  const handleCardClick = async (path, appname) => {
    try {
      setAppactive(appname);
      localStorage.setItem("appactive", appname)
      setIsLeaving(true);
      navigate(path, { 
        state: { 
          username: userProfile?.userPrincipalName,
          authenticated: true
        } 
      });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Show loading state
  if (isLoading || !isInitialized) {
    // return (
    //   <div style={{
    //     display: 'flex',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    //     height: '100vh',
    //     background: 'linear-gradient(135deg, #f0f0f0, #e0e0e0)',
    //     fontFamily: 'Arial, sans-serif',
    //   }}>
    //     <div style={{
    //       display: 'flex',
    //       flexDirection: 'column',
    //       alignItems: 'center',
    //     }}>
    //       {/* Spinner */}
    //       <div style={{
    //         width: '70px',
    //         height: '70px',
    //         border: '8px solid rgba(0, 0, 0, 0.1)',
    //         borderTop: '8px solid #3498db',
    //         borderRadius: '50%',
    //         animation: 'spin 1s ease-in-out infinite',
    //       }}></div>
  
    //       {/* Loading text */}
    //       <div style={{
    //         marginTop: '20px',
    //         fontSize: '18px',
    //         color: '#555',
    //         letterSpacing: '1px',
    //         animation: 'fadeIn 1.5s ease-in-out infinite alternate',
    //       }}>
    //         Please wait...
    //       </div>
    //     </div>
  
    //     <style>
    //       {`
    //         @keyframes spin {
    //           0% { transform: rotate(0deg); }
    //           100% { transform: rotate(360deg); }
    //         }
  
    //         @keyframes fadeIn {
    //           0% { opacity: 0.5; }
    //           100% { opacity: 1; }
    //         }
    //       `}
    //     </style>
    //   </div>
    // );
    return <Loading/>;
  }
  
  

  if (!account) {
    return (
      <div className="container">
        <img className="left-side" src={gptImgLogo} alt="AI Image" />
        <div className="right-side">
          <h1 className="marico-ai-heading">MARICO GPT</h1>
          <div className="login-form">
            <button
              type="submit"
              style={{ background: 'rgb(38, 95, 110)' }}
              onClick={handleLogin}
            >
              Login with SSO
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userProfile) {
    navigate('/chat', {
      state: {
        username: userProfile.userPrincipalName,
        authenticated: true
      }
    });
  }

  // return (<div>Hello</div>);
}

export default Root;
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useMsal, useAccount } from "@azure/msal-react";
// import { loginRequest } from '../config/authConfig';
// import { Helmet } from "react-helmet";
// import AI_Image from "../assets/AI_image.jpg";
// import gptImgLogo from "../assets/Image (1).jfif";

// function Root({ setMainUsername }) {
//   const { instance, accounts } = useMsal();
//   const account = useAccount(accounts[0] || {});
//   const [isLeaving, setIsLeaving] = useState(false);
//   const navigate = useNavigate();
//   const [style, setStyle] = useState(() => localStorage.getItem('style') || 'style2');
//   const [appactive, setAppactive] = useState(() => localStorage.getItem('appactive') || 'Chat');
//   const [userProfile, setUserProfile] = useState(null);

//   useEffect(() => {
//     localStorage.setItem('appactive', appactive);
//   }, [appactive]);

//   useEffect(() => {
//     localStorage.setItem('style', style);
//   }, [style]);

//   // Fetch user profile when account is available
//   useEffect(() => {
//     if (account) {
//       getUserProfile();
//     }
//   }, [account]);

//   const getUserProfile = async () => {
//     try {
//       const response = await instance.acquireTokenSilent({
//         ...loginRequest,
//         account: account
//       });

//       const profileData = await fetch("https://graph.microsoft.com/v1.0/me", {
//         headers: {
//           Authorization: `Bearer ${response.accessToken}`
//         }
//       }).then(res => res.json());

//       setUserProfile(profileData);
//       setMainUsername(profileData.userPrincipalName);
//       localStorage.setItem('username', profileData.userPrincipalName);
//       handleCardClick('/chat', "Chat");
//     } catch (error) {
//       console.error("Error fetching user profile:", error);
//     }
//   };

//   const handleLogin = async () => {
//     try {
//       await instance.loginRedirect(loginRequest);
//     } catch (error) {
//       console.error("Login failed:", error);
//       alert('Login failed. Please try again.');
//     }
//   };

//   const handleCardClick = async(path, appname) => {
//     setAppactive(appname);
//     setIsLeaving(true);
//     setTimeout(() => {
//       navigate(path, { state: { username: userProfile?.userPrincipalName } });
//     }, 0);
//   };

//   // If not logged in, show login screen
//   if (!account) {
//     return (
//       <div className="container">
//         <img className="left-side" src={gptImgLogo} alt="AI Image" />
//         <div className="right-side">
//           <h1 className="marico-ai-heading">MARICO GPT</h1>
//           <div className="login-form">
//             <button
//               type="submit"
//               style={{ background: 'rgb(38, 95, 110)' }}
//               onClick={handleLogin}
//             >
//               SSO Login
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null; // The logged-in view is handled by the router
// }

// export default Root;



// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Helmet } from "react-helmet";
// import AI_Image from "../assets/AI_image.jpg";
// import gptImgLogo from "../assets/Image (1).jfif";

// function Root({ setMainUsername }) {
//   const [username, setUsername] = useState('');
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [isLeaving, setIsLeaving] = useState(false);
//   const navigate = useNavigate();
//   const [style, setStyle] = useState(() => localStorage.getItem('style') || 'style2');
//   const [appactive, setAppactive] = useState(() => localStorage.getItem('appactive') || 'Chat');

//   useEffect(() => {
//     localStorage.setItem('appactive', appactive);
//   }, [appactive]);

//   useEffect(() => {
//     localStorage.setItem('style', style);
//   }, [style]);

//   const handleLogin = async () => {
//     if (username.trim()) {
//       setIsLoggedIn(true);
//       localStorage.setItem('username', username);
//       setTimeout(() => {setMainUsername(username);},500)
//       console.log("Type of setMainUsername",setMainUsername)
//       handleCardClick('/chat', "Chat");
//     } else {
//       alert('Please enter a valid username.');
//     }
//   };

//   const handleEnter = async (e) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       await handleLogin();
//     }
//   };

//   const handleCardClick = (path, appname) => {
//     setAppactive(appname);
//     setIsLeaving(true);
//     setTimeout(() => {
//       navigate(path, { state: { username } });
//     }, 300);
//   };

//   if (!isLoggedIn) {
//     return (
//       <div className="container">
//         <img className="left-side" src={gptImgLogo} alt="AI Image" />
//         <div className="right-side">
//           <h1 className="marico-ai-heading">MARICO GPT</h1>
//           <div className="login-form">
//             <input
//               type="text"
//               placeholder="Enter Username"
//               value={username}
//               onKeyDown={handleEnter}
//               onChange={(e) => setUsername(e.target.value)}
//               required
//             />
//             <button
//               type="submit"
//               style={{ background: 'rgb(38, 95, 110)' }}
//               onClick={handleLogin}
//             >
//               Login
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return null; // The logged-in view is handled by the router
// }

// export default Root;