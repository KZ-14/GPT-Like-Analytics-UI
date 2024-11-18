import React from 'react';
// ... (keep existing imports)
import { faCheck, faPaperclip } from "@fortawesome/free-solid-svg-icons";

function Document() {
    // ... (keep existing state and hooks)
    const [uploadedFileName, setUploadedFileName] = useState("");

    // Modify the uploadFileToAzure function to store the file name
    const uploadFileToAzure = async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("user_id", activedocSessionId);
        try {
            const result = await upload_File_Azure(formData);
            updatedocMessages("Document has uploaded successfully.", true);
            setdocChatSessions(prevState =>
                prevState.map(session =>
                    session.id === activedocSessionId ? 
                    { ...session, uploaded: true, fileName: file.name } : 
                    session
                )
            );
            setUploadedFileName(file.name);
            await call_retriever(activedocSessionId);
            return result;
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // Add useEffect to update fileName when switching sessions
    useEffect(() => {
        const activeSession = docchatSessions.find(
            session => session.id === activedocSessionId
        );
        setUploadedFileName(activeSession?.fileName || "");
    }, [activedocSessionId, docchatSessions]);

    // Helper function to check if document is uploaded for active session
    const isDocumentUploadedForActiveSession = () => {
        if (!activedocSessionId) return false;
        const activeSession = docchatSessions.find(
            session => session.id === activedocSessionId
        );
        return activeSession?.uploaded || false;
    };

    return (
        <div className={`App ${isSidebarCollapsed ? "sidebar-collapsed" : ""} ${isLeaving ? 'leaving' : ''}`}>
            {/* ... (keep existing code until chatFooter) */}
            
            <div className="chatFooter">
                {isDocumentUploadedForActiveSession() && uploadedFileName && (
                    <div className="file-status-bar">
                        <div className="file-info">
                            <FontAwesomeIcon icon={faPaperclip} className="file-icon" />
                            <span className="file-name">{uploadedFileName}</span>
                            <FontAwesomeIcon icon={faCheck} className="check-icon" />
                        </div>
                    </div>
                )}
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
                        onChange={handleInput}
                    />
                    <button className="send" onClick={handledocSend}>
                        <img src={sendBtn} className="sendImage" alt="Send" />
                    </button>
                </div>
            </div>
            {/* ... (keep remaining code) */}
        </div>
    );
}

// Add these styles to your CSS file
const styles = `
.file-status-bar {
    padding: 8px 16px;
    background-color: var(--app-bg-color);
    border-top: 1px solid var(--border-color);
    margin-bottom: 8px;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: var(--text-color);
}

.file-icon {
    color: var(--text-secondary);
}

.file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.check-icon {
    color: #4CAF50;
}

.chatFooter {
    display: flex;
    flex-direction: column;
    padding: 12px;
    position: sticky;
    bottom: 0;
    background-color: var(--app-bg-color);
}
`;

export default Document;