
import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider, useMsal, useAccount } from "@azure/msal-react";
import { msalConfig } from '../config/authConfig';
import { useLocation } from "react-router-dom";

import Root from "./root";
import Chat from './Chat';
import Image from './Image';
import Document from './Document';
import Audio from './Audio';
import Assist from './Assist';
import Query from './Query';
import ErrorPage from "../error-page";
import PreviewVideo from './Components/PreviewVideo';
import { App_Access } from '../Api';
import Loading from './Components/Loading';
import ReactGA from 'react-ga4'; // Import Google Analytics
 
const msalInstance = new PublicClientApplication(msalConfig);
ReactGA.initialize('G-3Y1CQRB9Z7');

function App() {
  const [Mainusername, setMainUsername] = useState(() => localStorage.getItem("username") || "");
  // const [Mainusername, setMainUsername] = useState("harshil.agrawal@marico.com");
  const [allowedApps, setAllowedApps] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const Analytics = () => {
    const location = useLocation();
  
    useEffect(() => {
      // Track the initial page load
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  
      // Track page views on route change
    }, [location]);
  
    return null;
  };

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username !== Mainusername) {
      setMainUsername(username);
    }
  }, [Mainusername]);

  useEffect(() => {
    async function fetchUserData() {
      if (Mainusername) {
        try {
          const userData = await fetchUserDataFromCosmosDB(Mainusername);
          setAllowedApps(userData.allowedApps);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsInitialized(true);
        }
      }
    }

    fetchUserData();
  }, [Mainusername]);

  async function fetchUserDataFromCosmosDB(Mainusername) {
    console.log("MainUsername", Mainusername);
    const temp = await App_Access(Mainusername);
    console.log("Allowed apps:", temp);
    return {
      allowedApps: temp
    };
  }

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Root setMainUsername={setMainUsername} />,
      errorElement: <ErrorPage />,
    },
    {
      path: "/chat",
      element: <ProtectedRoute 
        component={Chat} 
        allowedApps={allowedApps} 
        appName="Chat"
        isInitialized={isInitialized}
      />,
    },
    {
      path: "/document",
      element: <ProtectedRoute 
        component={Document} 
        allowedApps={allowedApps} 
        appName="Document"
        isInitialized={isInitialized}
      />,
    },
    {
      path: "/image",
      element: <ProtectedRoute 
        component={Image} 
        allowedApps={allowedApps} 
        appName="Image"
        isInitialized={isInitialized}
      />,
    },
    {
      path: "/audio",
      element: <ProtectedRoute 
        component={Audio} 
        allowedApps={allowedApps} 
        appName="Audio"
        isInitialized={isInitialized}
      />,
    },
    {
      path: "/query",
      element: <ProtectedRoute 
        component={Query} 
        allowedApps={allowedApps} 
        appName="Query"
        isInitialized={isInitialized}
      />,
    },
    {
      path: "/Assist",
      element: <ProtectedRoute 
        component={Assist} 
        allowedApps={allowedApps} 
        appName="Assist"
        isInitialized={isInitialized}
      />,
    },
  ]);

  return (
    <MsalProvider instance={msalInstance}>
      <RouterProvider router={router}> <Analytics /> </RouterProvider>
    </MsalProvider>
  );
}

function ProtectedRoute({ component: Component, allowedApps, appName, isInitialized }) {
  const { accounts, inProgress } = useMsal();
  const account = useAccount(accounts[0] || {});
  
  // Show loading state while checking authentication and permissions
  if (inProgress !== "none" || !isInitialized) {
    // return <div>Loading...</div>;
    return <Loading/>;
  }

  // Redirect to login if not authenticated
  if (!account) {
    return <Navigate to="/" replace />;
  }

  // Check access after authentication is confirmed
  const hasAccess = allowedApps.includes(appName);
  return hasAccess ? <Component /> : <PreviewVideo />;
}

export default App;

// import React from 'react';
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import Root from "./root";
// import Chat from './Chat';
// import Image from './Image';
// import Document from './Document';
// import Audio from './Audio';
// import Legal from './Legal';
// import ErrorPage from "../error-page";
// import {Helmet} from "react-helmet";

// function App(){
//   // const [username, setUsername] = useState('');
//   // const [isLoggedIn, setIsLoggedIn] = useState(false);
//   // const [isLeaving, setIsLeaving] = useState(false);

//   // const [style, setStyle] = useState(() => localStorage.getItem('style') || 'style2');

//   // const [appactive,setAppactive] = useState(() => localStorage.getItem('appactive') || 'Chat')

//   // useEffect(() => {
//   //   localStorage.setItem('appactive', appactive);
//   // }, [appactive]);

//   // useEffect(() => {
//   //   localStorage.setItem('style', style);
//   // }, [style]);

//     const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <Root />,
//     errorElement: <ErrorPage />,
//   },
//   {
//     path: "/chat",
//     element: <Chat />,
//   },
//   {
//     path: "/document",
//     element: <Document />,
//   },
//   {
//     path: "/Image",
//     element: <Image />,
//   },
//   {
//     path: "/Audio",
//     element: <Audio />,
//   },
//   {
//     path: "/Legal",
//     element: <Legal />,
//   },
// ]);

// return <RouterProvider router={router} />;

// }

// export default App;



// import React, { useState, useEffect } from 'react';
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import Root from "./root";
// import Chat from './Chat';
// import Image from './Image';
// import Document from './Document';
// import Audio from './Audio';
// import Legal from './Legal';
// import ErrorPage from "../error-page";
// import PreviewVideo from './Components/PreviewVideo';
// // import VideoComponent from './VideoComponent'; // Import your video component
// import { App_Access } from '../Api';
// import { PublicClientApplication } from "@azure/msal-browser";
// import { MsalProvider } from "@azure/msal-react";
// import { msalConfig } from '../config/authConfig';
// import { useNavigate } from 'react-router-dom';
// import { useMsal, useAccount } from "@azure/msal-react";

// const msalInstance = new PublicClientApplication(msalConfig);

// function App() {
//   const [Mainusername, setMainUsername] = useState(()=> localStorage.getItem("username" || "")); // Get from localStorage if available
//   const [allowedApps, setAllowedApps] = useState([]);

//   // const Navigate = useNavigate()
//   useEffect(() => {
//     setMainUsername(localStorage.getItem("username"));
//   }, [localStorage.getItem("username")]);

//   useEffect(() => {
//     async function fetchUserData() {
//       const userData = await fetchUserDataFromCosmosDB(Mainusername);
//       setAllowedApps(userData.allowedApps);
//     }

//     // Fetch user data if username is set
//     console.log(Mainusername);
//     if (Mainusername) {
//       fetchUserData();
//       console.log("allowed Apps",allowedApps);
//     }
//   }, [Mainusername]);

//   // Mock function for fetching user data from CosmosDB
//   async function fetchUserDataFromCosmosDB(Mainusername) {
//     // Mock response
//     console.log("MainUsername",Mainusername);
//     const temp = await App_Access(Mainusername);
//     console.log(temp)

//     return {
//       allowedApps: temp// Example allowed apps
//     };
//   }

//   const router = createBrowserRouter([
//     {
//       path: "/",
//       element: <Root setMainUsername={setMainUsername} />,
//       errorElement: <ErrorPage />,
//     },
//     {
//       path: "/chat",
//       element: <ProtectedRoute component={Chat} allowedApps={allowedApps} appName="Chat" />,
//     },
//     {
//       path: "/document",
//       element: <ProtectedRoute component={Document} allowedApps={allowedApps} appName="Document" />,
//     },
//     {
//       path: "/image",
//       element: <ProtectedRoute component={Image} allowedApps={allowedApps} appName="Image" />,
//     },
//     {
//       path: "/audio",
//       element: <ProtectedRoute component={Audio} allowedApps={allowedApps} appName="Audio" />,
//     },
//     {
//       path: "/legal",
//       element: <ProtectedRoute component={Legal} allowedApps={allowedApps} appName="Legal" />,
//     },
//   ]);

//   return (
//     <MsalProvider instance={msalInstance}>
//       <RouterProvider router={router} />
//     </MsalProvider>
//   );
// }

// function ProtectedRoute({ component: Component, allowedApps, appName }) {
//   const { accounts } = useMsal();
//   // Check if the user has access to the app
//   const account = useAccount(accounts[0] || {});
//   const hasAccess = account && allowedApps.includes(appName);
  
//   // if (!account) {
//   //   return <Navigate to="/" />;
//   // }
//   return hasAccess ? <Component /> : <PreviewVideo />;
// }

// export default App;


