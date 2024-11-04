// src/config/authConfig.js
export const msalConfig = {
    auth: {
      clientId: "76227ae6-b2f6-4325-a751-a5b6f94fb870", // From Azure AD app registration
      authority: "https://login.microsoftonline.com/5635d8b8-c9b9-4d9a-8a4d-f7cad74dc82a", // Your tenant ID
      redirectUri: "https://maricogpt.maricoapps.biz/" // Your app's redirect URI
    },
    cache: {
      cacheLocation: "localStorage", // or sessionStorage based on preference
      storeAuthStateInCookie: false, // Set to true if cookies are used
    }
  };
  
  export const loginRequest = {
    scopes: ["User.Read", "profile", "email"]
  };