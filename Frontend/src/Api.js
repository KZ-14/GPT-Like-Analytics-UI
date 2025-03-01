
export async function App_Access(username){
    // console.log(text)
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/appaccess/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
        username: username
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function BOT(message, sessionId,Title, onChunkReceived) {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/bot`, {
            method: "POST",
            headers: {
                "Accept": "text/plain", // Accept text/plain for streaming
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input: message,
                session_id: sessionId,
                Title: Title
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let combinedResponse = "";

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value, { stream: true });
            combinedResponse += chunk;
            // console.log(chunk)
            // Process each chunk and pass it to the callback
            // onChunkReceived(chunk.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
            onChunkReceived(chunk)

        }

        return combinedResponse; // Return the full response

    } catch (error) {
        console.error("Error in BOT function:", error);
        onChunkReceived("This prompt does not comply with azure content policy. Please revise your prompt and try again.");
        return "Sorry, something went wrong.";
    }
}

export async function RAG_BOT(message, sessionId,Title, onChunkReceived) {
    try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/chatbot-rag/`, {
            method: "POST",
            headers: {
                "Accept": "text/plain", // Accept text/plain for streaming
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input: message,
                session_id: sessionId,
                Title: Title
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let combinedResponse = "";

        while (!done) {
            try {
                const { value, done: readerDone } = await reader.read();
                if (value) {
                    const chunk = decoder.decode(value, { stream: true });
                    combinedResponse += chunk;

                    // Process each chunk and pass it to the callback
                    onChunkReceived(chunk);
                }

                done = readerDone;
            } catch (chunkError) {
                console.error("Error reading chunk:", chunkError);
                onChunkReceived("Sorry, something went wrong while reading the stream.");
                return "Sorry, something went wrong.";
            }
        }

        return combinedResponse; // Return the full response
    } catch (error) {
        console.error("Error in BOT function:", error);
        onChunkReceived("Sorry, something went wrong.");
        return "Sorry, something went wrong.";
    }
}

export async function Load_Chat(text){
    // console.log(text)
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/all_chat_load/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
        username: text
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function Load_Doc_Chat(text){
    // console.log(text)
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/all_doc_chat_load/`, {
        method: "POST",
        headers: {
            "Accept": "application/json", // Accept text/plain for streaming
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
        username: text
    })
    });
    const result = await response.json();
    // console.log(result)
    return result
}

export async function new_chat_normal(session_id){
    await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/new-chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({
            session_id: session_id
        })
      });
}

export async function new_chat_document(session_id){
    await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/new-chat-document/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({
            session_id: session_id
        })
      });
}

export async function call_retriever(session_id){
    await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/callRetriever/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({
            session_id: session_id
        })
      });
}


export async function generate_title(text){
    const response= await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/title`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({
            input : text
        })
      });
    const result = await response.json();
    // console.log(result)
    return result
}


export async function upload_File_Azure(formData){
    try
    {
    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/upload-to-azure/`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Failed to upload file. Status: ${response.status}`);
    }

    const result = await response.json();
    return result
    } 
    catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}


export async function Chat_history_Load_Backend(sessionId){
    try{
    fetch(`${process.env.REACT_APP_API_BASE_URL}backend/ChatHistoryLoad_Backend/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session_id: sessionId,
        }),
    });}
    catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

export async function doc_Chat_history_Load_Backend(sessionId){
    try{
    fetch(`${process.env.REACT_APP_API_BASE_URL}backend/docChatHistoryLoad_Backend/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session_id: sessionId,
        }),
    });}
    catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }
}

export async function BOT_IMAGE(text,payload) {
    const test = {
        prompt: text,
        filter: payload.filter,
        brand: payload.brand,
        position: payload.product
    }
    // console.log(test)
    try {
        // const response = await fetch('https://chief-maggot-lasting.ngrok-free.app/image_generation', {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/generate_image/`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: text,
                filter: payload.filter,
                brand: payload.brand,
                position : payload.product
            }), // Send payload as JSON
        });
    
        var result = await response.json();
        // var image = `data:image/png;base64,${result.image}`
        // console.log('Response from API:', result);
        } catch (error) {
        console.error('Error sending image request:', error);
        }
    
    try {
        const imageResponse = {
            src: result,
            alt: "Bot Generated Image",
            isBot: true
        };

        return imageResponse;
    } catch (error) {
        console.error("Error in BOT_IMAGE function:", error);
        return {
            src: "",
            alt: "Error Image",
            text: "Sorry, something went wrong.",
            isBot: true
        };
    }
}


export async function Delete_chat(sessionId){
    try{
    fetch(`${process.env.REACT_APP_API_BASE_URL}backend/delete_normal_chat/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session_id: sessionId,
        }),
    });}
    catch (error) {
        console.error("Error Deleting Chat", error);
        throw error;
    }
}

// const sendImageRequest = async (payload) => {
//     try {
//     const response = await fetch('http://localhost:8000/send-image-request/', {
//         method: 'POST',
//         headers: {
//         'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload), // Send payload as JSON
//     });

//     const result = await response.json();
//     console.log('Response from API:', result);
//     } catch (error) {
//     console.error('Error sending image request:', error);
//     }
// };  


export async function update_title(sessionId,title){
    try{
    fetch(`${process.env.REACT_APP_API_BASE_URL}backend/update_title/`, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session_id: sessionId,
            new_title: title
        }),
    });}
    catch (error) {
        console.error("Error Updating Title", error);
    }
}


export async function query_ai(text,session_id){
    const response= await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/query_AI/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({
            input : text,
            session_id : session_id,
            Title : "Test"
        })
      });
    const result = await response.json();
    if(result.text) {
        // console.log(result);
    }
    if(result.user_input_required){
        // console.log(result);
    }
    // console.log(result);
    return result
}

export async function query_ai_with_filters(filters,session_id){
    const response= await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/query_AI_with_filters/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({
            session_id : session_id,
            filters : filters
        })
      });
    const result = await response.json();
    if(result.text) {
        // console.log(result);
    }
    if(result.user_input_required){
        // console.log(result);
    }
    // console.log(result);
    return result
}
// export async function BOT(message, sessionId) {
//     try {
//         const response = await fetch("${process.env.REACT_APP_API_BASE_URL}backend/bot", {
//             method: "POST",
//             headers: {
//                 "Accept": 'application/json',
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 input: message,
//                 session_id: sessionId 
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const result = await response.json();

//         if (!result || !result.output || result.output.length === 0) {
//             throw new Error("Invalid response from server");
//         }

//         let answer = result.output[0];
//         let answer_2 = answer.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
//         return answer_2;
        
//     } catch (error) {
//         console.error("Error in BOT function:", error);
//         return "Sorry, something went wrong.";
//     }
// }


// export async function RAG_BOT(message, sessionId, onChunkReceived) {
//     try {
//         const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}backend/chatbot-rag/`, {
//             method: "POST",
//             headers: {
//                 "Accept": "text/plain", // Accept text/plain for streaming
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 input: message,
//                 session_id: sessionId
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const reader = response.body.getReader();
//         const decoder = new TextDecoder("utf-8");
//         let done = false;
//         let combinedResponse = "";

//         while (!done) {
//             const { value, done: readerDone } = await reader.read();
//             done = readerDone;
//             const chunk = decoder.decode(value, { stream: true });
//             combinedResponse += chunk;

//             // Process each chunk and pass it to the callback
//             // onChunkReceived(chunk.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
//             onChunkReceived(chunk)
//         }

//         return combinedResponse; // Return the full response

//     } catch (error) {
//         console.error("Error in BOT function:", error);
//         onChunkReceived("Sorry, something went wrong.");
//         return "Sorry, something went wrong.";
//     }
// }


// export async function BOT(message, sessionId, onStream) {
//     try {
//         const response = await fetch("${process.env.REACT_APP_API_BASE_URL}backend/bot", {
//             method: "POST",
//             headers: {
//                 "Accept": 'application/json',
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 input: message,
//                 session_id: sessionId 
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }

//         const reader = response.body.getReader();
//         const decoder = new TextDecoder();
//         let resultText = "";

//         while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;

//             const chunk = decoder.decode(value);
//             resultText += chunk;

//             let formattedChunk = chunk.replace(/\n/g, '<br>');
//             onStream(formattedChunk);
//         }

//         return resultText;
        
//     } catch (error) {
//         console.error("Error in BOT function:", error);
//         onStream("Sorry, something went wrong.");
//     }
// }




// export function BOT(message) {

//     return "Response to " + message

// }

