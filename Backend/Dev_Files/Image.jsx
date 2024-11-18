import React from 'react';
// ... (keep existing imports)

// First, let's update the updateMessages function to handle multiple images
const updateMessages = (
    text,
    isBot,
    isStreaming = false,
    imageResponses = null
) => {
    setChatSessions((prevSessions) => {
        const updatedSessions = prevSessions.map((session) => {
            if (session.id === activeSessionId) {
                let newMessages = [...session.messages];

                // Add text message if present
                if (text && text.trim() !== "") {
                    newMessages.push({
                        text: text
                            .replace(/\n/g, "<br>")
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                        isBot,
                    });
                }

                // If image responses are provided, append them as a grid
                if (imageResponses && imageResponses.length > 0) {
                    newMessages.push({
                        type: "image-grid",
                        images: imageResponses,
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

// Update the handleSend function to handle multiple images
const handleSend = async () => {
    const text = input;
    setInput("");

    updateMessages(text, false);
    setIsBotTyping(true);
    try {
        // Assuming BOT_IMAGE now returns an array of image responses
        const imageResponses = await BOT_IMAGE(text, includeFilters);
        if (imageResponses && imageResponses.length > 0) {
            updateMessages("", true, false, imageResponses);
            setIsBotTyping(false);
        } else {
            updateMessages("Sorry Something Went Wrong", true, false);
            setIsBotTyping(false);
        }
    } catch (error) {
        console.error("Error handling chat:", error);
    }
};

// Create a new ImageGrid component
const ImageGrid = ({ images }) => {
    return (
        <div className="image-grid">
            {images.map((image, index) => (
                <div key={index} className="image-grid-item">
                    <img
                        src={image.src}
                        alt={image.alt || `Generated image ${index + 1}`}
                        className="grid-image"
                    />
                </div>
            ))}
        </div>
    );
};

// Update the message rendering in the main component
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
        <div className="message-content">
            {message.text && (
                <span className="txt">
                    <UserMessage message={message} />
                </span>
            )}
            {message.type === "image-grid" && (
                <ImageGrid images={message.images} />
            )}
        </div>
    </div>
))}




/* Add these styles to your CSS file 

.message-content {
    flex: 1;
    max-width: 100%;
}

.image-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin: 1rem 0;
    width: 100%;
    max-width: 900px;
}

.image-grid-item {
    position: relative;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease-in-out;
}

.image-grid-item:hover {
    transform: scale(1.02);
}

.grid-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
}

@media (max-width: 768px) {
    .image-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    }
}

@media (max-width: 480px) {
    .image-grid {
        grid-template-columns: 1fr;
    }
}

*/