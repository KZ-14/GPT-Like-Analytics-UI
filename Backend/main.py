import os
os.chdir(os.getcwd())
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import JSONResponse
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# from Conversation_model import ChatBot, upload_store_to_cosmosdb
from ChatAI import ChatBot,upload_store_to_cosmosdb,load_store_from_cosmosdb,upload_token_store_to_cosmosdb
# from Conversation_model_RAG import Chatbot_RAG,upload_store_to_cosmosdb_doc,CreateRetriever
from DocAI import Chatbot_RAG,upload_store_to_cosmosdb_rag,CreateRetriever,CallRetriever,load_store_from_cosmosdb_rag
# from ./helpers import Conversation_model_RAG
from azure.storage.blob import BlobServiceClient,generate_blob_sas,BlobSasPermissions
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
import asyncio
import logging
from ChatTitleGenerator import generate_title
from ImagePromptGenerator import generate_prompt
from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError
# import mylib
import json
####Github test
import redis
import replicate
import os
from redis.exceptions import LockError
import pickle
# from Logging import Create_Logger
from QueryAI import give_input
# from QueryAI_2 import give_input


redis_host = 'maricogpt.redis.cache.windows.net'
redis_port = 6380  # Default port for SSL
redis_password = 'oaWKR5Jp9Frc1D4OrMXWh3YQlnX9mciRpAzCaKZLTS4='

redis_client = redis.StrictRedis(host=redis_host, port=redis_port,password= redis_password,ssl=True)

os.environ["REPLICATE_API_TOKEN"] = "r8_dC0R3IByOpd1ifynNX5CHxKO6GGNfRE3GifgN"


logger = logging.getLogger(__name__)

logging.basicConfig(filename='myapp.log',encoding='utf-8', level=logging.INFO)

# logger = Create_Logger()
    
app = FastAPI(root_path="/backend")

Retriever: any

#Mongo DB github test
endpoint = "https://marico-gpt-db.documents.azure.com:443/"
key = "A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA=="
client = CosmosClient(url=endpoint, credential=key)
cosmos_database_name = "marico-gpt"
cosmos_container_name = "marico-gpt-chat-history"

database = client.get_database_client(cosmos_database_name)
container = database.get_container_client(cosmos_container_name)

connect_str = "DefaultEndpointsProtocol=https;AccountName=maricogpt;AccountKey=qWBQYmrXPuHjMGcT3NUi9fZ+6AmPtJI2bKiX7CZ4uFsSY0IvPERIt35eBBeoPscXGG8VKPYRRK1t+ASt0V6R9w==;EndpointSuffix=core.windows.net"
container_name = "maricogpt"  

blob_service_client = BlobServiceClient.from_connection_string(connect_str)
container_client = blob_service_client.get_container_client(container_name)

import base64
import requests

def webp_to_base64(url):
    try:
        # Fetch the image from the URL
        response = requests.get(url)
        response.raise_for_status()
        
        # Encode the image to base64
        base64_encoded_image = base64.b64encode(response.content).decode('utf-8')
        
        # Create the base64 data URL
        base64_data_url = f"data:image/webp;base64,{base64_encoded_image}"
        
        return base64_data_url
    except requests.exceptions.RequestException as e:
        print(f"Error fetching the image: {e}")
        return None
class InputModel(BaseModel):
    input: str
    session_id: str 
    Title : str
    
class TitleGenerator(BaseModel):
    input: str

class DocumentModel(BaseModel):
    input: str
    session_id: str
    Title : str
    # document_id: str  

class UsernameModel(BaseModel):
    username: str
    
class ChatHistoryModel(BaseModel):
    session_id: str
# CORS Configuration
class RetriverCreationModel(BaseModel):
    session_id: str

class DeleteChatModel(BaseModel):
    session_id: str
    
class UpdateSessionTitleModel(BaseModel):
    session_id : str
    new_title : str

class ImageModel(BaseModel):
    prompt:str
    filter: str
    brand: str
    position: str
       
class AppAccessModel(BaseModel):
    username: str
    
class QueryFilterModel(BaseModel):
    session_id: str
    filters : dict
    
origins = ["http://10.124.10.136:3000","http://localhost:3000","https://maricogpt.maricoapps.biz/"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# @app.post("/bot")
# async def bot(input_model: InputModel):
#     try:
#         # Process the text message using ChatBot
#         conv = await ChatBot(input_model.input, input_model.session_id)
#         return {"output": conv}
#     except Exception as e:
#         print(f"API Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/appaccess/")
async def AppAcess(input_model: AppAccessModel):
    access_container = database.get_container_client("maricogpt-access")
    try:
        username = input_model.username
        item = access_container.read_item(item=username, partition_key=username)
        # logger.info(
        #     "App Accesse API called",
        #     extra={"tags": {"service": "App-Access"}, "user_emailID": "f{input_model.username}"}
        # )
        logger.info(
            f'''App Access API called
            service: App-Access
            user_emailID: {input_model.username}'''
        )
        return item["app_access"]
    except CosmosResourceNotFoundError:
        access_container.upsert_item(
            {
                "id": f"{username}",
                "key": f"{username}",
                "app_access": [
                    "Chat"
                ],
            }
        )
        item = access_container.read_item(item=username, partition_key=username)
        # logger.info(
        #     "App Access API called (User logged in for the first time)",
        #     extra={"tags": {"service": "App-Access"}, "user_emailID": "f{input_model.username}"}
        # )
        logger.info(
            f'''App Access API called (User logged in for the first time)
            service: App-Access
            user_emailID: {input_model.username}'''
        )
        return item["app_access"]
    except Exception as e:
        # logger.error(
        #     "Error in app access API",
        #     extra={"tags": {"service": "App-Access"}, "user_emailID": "f{input_model.username}"}
        # )
        logger.info(
            f'''Error in app access API
            service: App-Access
            user_emailID: {input_model.username}'''
        )
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/title")
async def Chattitle(input_model: TitleGenerator):
    try:
        input_text = input_model.input
        title = await generate_title(input_text)
        return title
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/bot")
async def bot(input_model: InputModel):
    try:
        input_text = input_model.input
        session_id = input_model.session_id
        title = input_model.Title
        stream = ChatBot(input_text, session_id, title)
        # print("Step1:",stream)
        username = input_model.session_id.split("_")[0]
        # logger.info(
        #     "Chat-AI Send API Called Successfully",
        #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.info(
            f'''Chat-AI Send API Called Successfully
            service: Chat-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        return StreamingResponse(stream, media_type="text/plain",  headers={"X-Accel-Buffering": "no"})
    except Exception as e:
        username = input_model.session_id.split("_")[0]
        # logger.error(
        #     "Chat-AI Send API Failed",
        #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.error(
            f'''Chat-AI Send API Failed
            service: Chat-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-to-azure/")
async def upload_document(user_id: str = Form(...), file: UploadFile = File(...)):   
    global Retriever
    print("Upload File to Azure started ")
    try:
        document_id = user_id
        blob_name = document_id
        blob_client = container_client.get_blob_client(blob_name)
        print(type(file))    
        username = user_id.split("_")[1]
        # logger.info(
        #     "File Recieved from the User",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{document_id}"}
        # )
        logger.info(
            f'''File Recieved from the User
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {document_id}'''
        )
        file_content = await file.read()  # Read the file content as bytes
        blob_client.upload_blob(file_content, blob_type="BlockBlob", overwrite=True)
        # logger.info(
        #     "File Uploaded to Blob Storage",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{document_id}"}
        # ) 
        logger.info(
            f'''File Uploaded to Blob Storage
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {document_id}'''
        )     
        sas_expiry = datetime.now() + timedelta(minutes=15)

        # Generate the SAS token
        sas_token = generate_blob_sas(
            account_name=blob_service_client.account_name,
            container_name=container_name,
            blob_name=blob_name,
            account_key=blob_service_client.credential.account_key,
            permission=BlobSasPermissions(read=True),  # Set permissions (e.g., read)
            expiry=sas_expiry
        )
        
        # Generate the SAS URL
        sas_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{blob_name}?{sas_token}"

        print("Step 1")
        await CreateRetriever(document_id= document_id,connect_str=connect_str,container_name=container_name,blob_name=blob_name)
        # logger.info(
        #     "Retriever Created",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{document_id}"}
        # )    
        print("Retriever Created")
        logger.info(
            f'''Retriever Created
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {document_id}'''
        )     
        await CallRetriever(document_id)
        print("Retriever Called")
        # logger.info(
        #     "Retriever Called",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{document_id}"}
        # )  
        logger.info(
            f'''Retriever Called
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {document_id}'''
        )       
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/callRetriever/")
async def call_retriever(input_model:RetriverCreationModel):
    global Retriever
    document_id = input_model.session_id
    blob_name = document_id
    # Retriever = None
    ret = redis_client.get(f"retriever:{document_id}")
    username = document_id.split("_")[1]
    if ret is None:  
        await CallRetriever(document_id = document_id)
        # logger.info(
        #     "Retriever Called",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{document_id}"}
        # )  
        logger.info(
            f'''Retriever Called
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {document_id}'''
        ) 
    print("Retriever Created Sucessfully")
    return JSONResponse(content={"document_id": document_id, "blob_name": blob_name}, status_code=201)

    
@app.post("/new-chat/")
async def new_chat(input_model : ChatHistoryModel):
    try:
        username = input_model.session_id.split("_")[0]
        # logger.info(
        #     "New Chat API Called",
        #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )    
        logger.info(
            f'''New Chat API Called
            service: Chat-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )     
        upload_store_to_cosmosdb(input_model.session_id)
        # upload_token_store_to_cosmosdb()
        # logger.info(f"Chat model : Chat history saved to CosmosDB sucessfully")
        # upload_store_to_cosmosdb()
        # logger.info(
        #     "Chat history uploaded to CosmosDB",
        #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )  
        logger.info(
            f'''Chat history uploaded to CosmosDB
            service: Chat-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        ) 
        return JSONResponse(content={"message": "Chat data uploaded to CosmosDB."}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/new-chat-document/")
async def new_chat_document(input_model : ChatHistoryModel):
    try:
        username = input_model.session_id.split("_")[1]
        # logger.info(
        #     "New Chat API Called",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )   
        logger.info(
            f'''Chat history uploaded to CosmosDB
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        ) 
        upload_store_to_cosmosdb_rag(input_model.session_id)
        redis_client.delete(f"retriever:{input_model.session_id}")
        # logger.info(f"Document model : Chat history saved to CosmosDB sucessfully")
        # logger.info(
        #     "Chat history uploaded to CosmosDB",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )  
        logger.info(
            f'''Chat history uploaded to CosmosDB
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        ) 
        return JSONResponse(content={"message": "Chat data uploaded to CosmosDB."}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# @app.get("/documents/{document_id}")
# async def get_document(document_id: str):
#     try:
#         document = document_collection.find_one({"_id": ObjectId(document_id)})
#         if not document:
#             raise HTTPException(status_code=404, detail="Document not found")

#         return JSONResponse(
#             content={
#                 "user_id": document["user_id"],
#                 "filename": document["filename"],
#                 "content_type": document["content_type"],
#                 "file_content": document["file_content"].decode('utf-8', 'ignore')  # Decoding bytes to string for readability
#             },
#             status_code=200
#         )

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# @app.post("/chatbot-rag/")
# async def chatbot_rag(input_model: DocumentModel):
#     try:
#         # Process the text message related to documents using Chatbot_RAG
#         conv,session_id = await Chatbot_RAG(input_model.input, input_model.session_id,Retriever)
#         print("Conv:",conv)
#         return {"output": conv}
#     except Exception as e:
#         print(f"API Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/chatbot-rag/")
async def RAG_bot(input_model: DocumentModel):
    try:
        input_text = input_model.input
        session_id = input_model.session_id
        title = input_model.Title
        # blob_name = session_id
        Serialized_Retriever = redis_client.get(f"retriever:{session_id}")
        if Serialized_Retriever is None:
            await CallRetriever(session_id)
            Serialized_Retriever = redis_client.get(f"retriever:{session_id}")
        Retriever = pickle.loads(Serialized_Retriever)
        stream = Chatbot_RAG(input_text, session_id,title,Retriever)
        # print("Step1:",stream)
        username = input_model.session_id.split("_")[1]
        # logger.info(
        #     "Doc-AI Send API Called Successfully",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.info(
            f'''Doc-AI Send API Called Successfully
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        return StreamingResponse(stream, media_type="text/plain",  headers={"X-Accel-Buffering": "no"})
    except Exception as e:
        username = input_model.session_id.split("_")[1]
        # logger.error(
        #     "Doc-AI Send API Failed",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.error(
            f'''Doc-AI Send API Failed
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.post("/all_chat_load/")
def get_all_chat_histories(input_model: UsernameModel):
    try:
        query = "SELECT top 10 * FROM c where STARTSWITH(c.id, @prefix ) = true order by c.Date_uploaded desc"
        params = [{"name": "@prefix", "value": input_model.username}]
        items = list(container.query_items(query=query,parameters=params,enable_cross_partition_query=True))

        formatted_data = [
            {
                "id": item["id"], 
                # "title": item.get("title", "Untitled"),
                "title": item["title"],
                "messages": [
                    {
                        "text": message["content"],
                        "isBot": True if message["type"] == "ai" else False
                    }
                    for message in item["buffer"]  
                ]
            }
            for item in items  
        ]
        # logger.info(
        #     "Chat history Loaded",
        #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{input_model.username}"}
        # )
        logger.info(
            f'''Chat history Loaded
            service: Chat-AI
            user_emailID: {input_model.username}
            '''
        )
        return formatted_data

    except Exception as e:
        print(f"An error occurred: {e}")
        # logger.error(
        #     "Chat history Loading Failed",
        #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{input_model.username}"}
        # )
        logger.error(
            f'''Chat history Loading Failed
            service: Chat-AI
            user_emailID: {input_model.username}
            '''
        )
        return None

@app.post("/all_doc_chat_load/")
def get_all_chat_histories(input_model: UsernameModel):
    try:
        query = "SELECT top 10 * FROM c where STARTSWITH(c.id, @prefix ) = true order by c.Date_uploaded desc"
        params = [{"name": "@prefix", "value": input_model.username}]
        items = list(container.query_items(query=query,parameters=params,enable_cross_partition_query=True))

        formatted_data = [
            {
                "id": item["id"], 
                # "title": item.get("title", "Untitled"),
                "title": item["title"],
                "uploaded": True,
                "messages": [
                    {
                        "text": message["content"],
                        "isBot": True if message["type"] == "ai" else False
                    }
                    for message in item["buffer"]  
                ]
            }
            for item in items  
        ]
        # logger.info(
        #     "Chat history Loaded",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{input_model.username}"}
        # )
        logger.info(
            f'''Chat history Loaded
            service: Doc-AI
            user_emailID: {input_model.username}
            '''
        )
        return formatted_data

    except Exception as e:
        # logger.error(
        #     "Chat history Loading Failed",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{input_model.username}"}
        # )
        logger.error(
            f'''Chat history Loading Failed
            service: Doc-AI
            user_emailID: {input_model.username}
            '''
        )
        return None
    
@app.post("/ChatHistoryLoad_Backend/")
def Load_chatHistory_Backend(input_model : ChatHistoryModel):
    try:
        load_store_from_cosmosdb(input_model.session_id)
        # logger.info(f"Chat model : Chat history saved to CosmosDB sucessfully")
        # upload_store_to_cosmosdb()
        username = input_model.session_id.split("_")[0]
        # logger.info(
        #     "Chat Session Loaded",
        #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.info(
            f'''Chat Session Loaded
            service: Chat-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        return JSONResponse(content={"message": "Chat data loaded from CosmosDB."}, status_code=200)
    except Exception as e:
        username = input_model.session_id.split("_")[0]
        # logger.error(
        #     "Chat session Loading Failed",
        #     extra={"tags": {"service": "Chat-AI"},"user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.error(
            f'''Chat session Loading Failed
            service: Chat-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/docChatHistoryLoad_Backend/")
def doc_Load_chatHistory_Backend(input_model : ChatHistoryModel):
    try:
        load_store_from_cosmosdb_rag(input_model.session_id)
        username = input_model.session_id.split("_")[0]
        # logger.info(
        #     "Chat Session Loaded",
        #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.info(
            f'''Chat Session Loaded
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        return JSONResponse(content={"message": "Chat data loaded from CosmosDB."}, status_code=200)
    except Exception as e:
        username = input_model.session_id.split("_")[1]
        # logger.error(
        #     "Chat session Loading Failed",
        #     extra={"tags": {"service": "Doc-AI"},"user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
        # )
        logger.error(
            f'''Chat session Loading Failed
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
        )
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/delete_normal_chat/")
def delete_chat(input_model: DeleteChatModel):
    try:
        # query = "Delete * from c where c.id = @prefix"
        # params = [{"name": "@prefix", "value": input_model.session_id}]
        # container.query_items(query=query,parameters=params,enable_cross_partition_query=True)
        container.delete_item(item=input_model.session_id, partition_key=input_model.session_id)
        redis_client.delete(f"chat:{input_model.session_id}")
        # service = False
        service_check = input_model.session_id.split("_")[0]
        if service_check == "doc":
            username = input_model.session_id.split("_")[1]
            # logger.info(
            #     "Chat Session Deleted",
            #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
            # )
            logger.info(
            f'''Chat Session Deleted
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
            )
        else:
            username = input_model.session_id.split("_")[0]
            # logger.info(
            #     "Chat Session Deleted",
            #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
            # )
            logger.info(
            f'''Chat Session Deleted
            service: Chat-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
            )
    except Exception as e:
        if service_check == "doc":
            username = input_model.session_id.split("_")[1]
            # logger.error(
            #     "Chat Session deletion failed",
            #     extra={"tags": {"service": "Doc-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
            # )
            logger.error(
            f'''Chat Session deletion failed
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
            )
        else:
            username = input_model.session_id.split("_")[0]
            # logger.error(
            #     "Chat Session deletion failed",
            #     extra={"tags": {"service": "Chat-AI"}, "user_emailID": "f{username}","user_sessionID":f"{input_model.session_id}"}
            # )
            logger.error(
            f'''Chat Session deletion failed
            service: Doc-AI
            user_emailID: {username}
            user_sessionID: {input_model.session_id}'''
            )
        return None
    
@app.post("/update_title/")
def update_session_title(input_model: UpdateSessionTitleModel):
    try:
        item = container.read_item(item=input_model.session_id, partition_key=input_model.session_id)
        item['title'] = input_model.new_title
        container.replace_item(item=item['id'], body=item)
        
        redis_session_data = redis_client.get(f"chat:{input_model.session_id}")
    
        if redis_session_data:

            conversation_data = json.loads(redis_session_data)
            
            conversation_data['title'] = input_model.new_title
            
            updated_conversation_data_json = json.dumps(conversation_data)
            
            redis_client.set(f"chat:{input_model.session_id}", updated_conversation_data_json)
    except Exception as e:
        print(f"An error occurred: {e}")

@app.post("/generate_image/")
async def image_generation(input_model:ImageModel):
    img_url = f"https://pod-predicted-pdf.s3.ap-south-1.amazonaws.com/{input_model.brand}_{input_model.position}_white_bg.png"
    mask_url = f"https://pod-predicted-pdf.s3.ap-south-1.amazonaws.com/{input_model.brand}_{input_model.position}_expo.png"
    api = replicate.Client(api_token="r8_dC0R3IByOpd1ifynNX5CHxKO6GGNfRE3GifgN")

    prompt = await generate_prompt(input_model.prompt)
    print(prompt)
    if input_model.filter == "true":
        output = api.run(
            "zsxkib/flux-dev-inpainting:ca8350ff748d56b3ebbd5a12bd3436c2214262a4ff8619de9890ecc41751a008",
            input={
                "mask": mask_url,
                "image": img_url,
                "steps": 100,
                # "prompt": "Capture the vibrant essence of a woman adorned in traditional Rajasthani attire, standing gracefully in the vast, golden expanse of the Rajasthan desert. Let the intricate patterns and rich colors of her clothing stand out against the arid landscape, with sand dunes rolling softly into the distance. The sun casts a warm, golden glow, highlighting the cultural beauty and timeless elegance of the scene",
                "prompt":prompt,
                "strength": 1,
                "num_outputs": 1,
                "guaidance_scale": 10,
                "negative_prompt": "(products, multiple products,deformed iris,deformed hands, deformed pupils, semi-realistic, cgi, 3d, render, sketch, cartoon, drawing, anime:1.4), text, close up, cropped, out of frame, worst quality, low quality, jpeg artifacts, ugly, duplicate, morbid, mutilated, extra fingers, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, blurry, dehydrated, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck"
            }
        )
        print(output)
        urls = [url for url in output]
        print(urls)
        # print(output[0])
        return str(urls[0])
    elif input_model.filter == "false":
        output = api.run(
        "black-forest-labs/flux-schnell",
        input={
            # "prompt": "black forest gateau cake spelling out the words \"FLUX SCHNELL\", tasty, food photography, dynamic shot",
            "prompt":prompt,
            "go_fast": True,
            "megapixels": "1",
            "num_outputs": 1,
            "aspect_ratio": "1:1",
            "output_format": "webp",
            "output_quality": 80,
            "num_inference_steps": 4
        }
         )
        print(output[0])
        print(output[0])
        return str(output[0])
    
import pandas as pd
# @app.post("/query_AI/")
# async def query_ai_send(input_model: InputModel):
#     input = input_model.input
#     session_id = input_model.session_id
#     # data = pd.read_csv("/home/admharshila/harshil/docker_test/MaricoGPT/Backend/Scootsy.csv")
#     # dataframe = pd.DataFrame()
#     # data = data.fillna(0)
#     # data_dict = data.to_dict('records')
#     output =  await give_input(input)
#     return output

import uuid
@app.post("/query_AI/")
async def query_ai_send(input_model: InputModel):
    input = input_model.input
    # session_id = input_model.session_id
    thread_id = str(uuid.uuid4())
    # main_result = None
    # config = {
    #     "configurable": {
    #         "thread_id": input_model.session_id,
    #     }
    # }
    not_first_message = False
    # give_input(user_input=input, config=config, not_first_message=not_first_message)
    # data = pd.read_csv("/home/admharshila/harshil/docker_test/MaricoGPT/Backend/Scootsy.csv")
    # dataframe = pd.DataFrame()
    # data = data.fillna(0)
    # data_dict = data.to_dict('records')
    output =  await give_input(user_input=input, session_id=input_model.session_id, not_first_message=not_first_message)
    return output

from QueryAI import apply_filters
@app.post("/query_AI_with_filters/")
async def query_ai_send_filters(input_model : QueryFilterModel):
    # input = input_model.input
    # session_id = input_model.session_id
    # thread_id = str(uuid.uuid4())
    # main_result = None
    # config = {
    #     "configurable": {
    #         "thread_id": input_model.session_id,
    #     }
    # }
    # not_first_message = False
    # give_input(user_input=input, config=config, not_first_message=not_first_message)
    # data = pd.read_csv("/home/admharshila/harshil/docker_test/MaricoGPT/Backend/Scootsy.csv")
    # dataframe = pd.DataFrame()
    # data = data.fillna(0)
    # data_dict = data.to_dict('records')
    filter = input_model.filters["user_input_required"]
    output =  await apply_filters(filter,input_model.session_id)
    return output