import os
os.chdir(os.getcwd())
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import JSONResponse
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from azure.storage.blob import BlobServiceClient,generate_blob_sas,BlobSasPermissions
from datetime import datetime, timedelta
from fastapi.responses import StreamingResponse
import asyncio
import logging
from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError
# import mylib

####Github test

import replicate
import os
os.environ["REPLICATE_API_TOKEN"] = "r8_dC0R3IByOpd1ifynNX5CHxKO6GGNfRE3GifgN"


logger = logging.getLogger(__name__)

# logging.basicConfig(filename='myapp.log', level=logging.INFO)
    
app = FastAPI()

Retriever: any

#Mongo DB github test
endpoint = "https://marico-gpt-db.documents.azure.com:443/"
key = "A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA=="
client = CosmosClient(url=endpoint, credential=key)
cosmos_database_name = "marico-gpt"
cosmos_container_name = "marico-gpt-chat-history"

database = client.get_database_client(cosmos_database_name)
container = database.get_container_client(cosmos_container_name)
access_container = database.get_container_client("maricogpt-access")
token_container = database.get_container_client("marico-gpt-token-details")

connect_str = "DefaultEndpointsProtocol=https;AccountName=maricogpt;AccountKey=qWBQYmrXPuHjMGcT3NUi9fZ+6AmPtJI2bKiX7CZ4uFsSY0IvPERIt35eBBeoPscXGG8VKPYRRK1t+ASt0V6R9w==;EndpointSuffix=core.windows.net"
container_name = "maricogpt"  

blob_service_client = BlobServiceClient.from_connection_string(connect_str)
container_client = blob_service_client.get_container_client(container_name)

import base64
import requests

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
    appname : str
    
origins = ["http://localhost:3001","http://10.124.10.136:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/delete_user/")
async def delete_user(input_model:UsernameModel):
    try:
        # query = '''
        #             SELECT c.id, c.app_access
        #             FROM c
        #         '''
        # items = list(access_container.query_items(query=query, enable_cross_partition_query=True))
        # # user_access_details = [{ "id" : item['id'], "app_access" : item['app_access']} for item in items]
        # print(items)
        # return items
        access_container.delete_item(item=input_model.username, partition_key=input_model.username)
        return True
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        raise HTTPException(status_code=404, detail="Resource not found")
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get_user_details/")
async def get_user_access_details():
    try:
        query = '''
                    SELECT c.id, c.app_access
                    FROM c
                '''
        items = list(access_container.query_items(query=query, enable_cross_partition_query=True))
        def appCheck(appName,item):
            return True if appName in item['app_access'] else False
        user_access_details = [{ "id" : item['id'], "Chat" : appCheck("Chat",item), "Document" : appCheck("Document",item), "Image" : appCheck("Image",item), "Audio" : appCheck("Audio",item),"Query" : appCheck("Query",item), "Assist" : appCheck("Assist",item)} for item in items]
        print(items)
        return user_access_details
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        raise HTTPException(status_code=404, detail="Resource not found")
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/grant_app_access/")
async def grant_app_access(input_model:AppAccessModel):
    try:

        item = access_container.read_item(item=input_model.username, partition_key=input_model.username)
        item['app_access'].append(input_model.appname)
        access_container.replace_item(item=item['id'], body=item)
        # access_container.delete_item(item=input_model.username, partition_key=input_model.username)
        return True
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        raise HTTPException(status_code=404, detail="Resource not found")
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/revoke_app_access/")
async def revoke_app_access(input_model:AppAccessModel):
    try:

        item = access_container.read_item(item=input_model.username, partition_key=input_model.username)
        item['app_access'].remove(input_model.appname)
        access_container.replace_item(item=item['id'], body=item)
        # access_container.delete_item(item=input_model.username, partition_key=input_model.username)
        return True
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        raise HTTPException(status_code=404, detail="Resource not found")
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/disable_all_access/")
async def disable_all_access(input_model:UsernameModel):
    try:

        item = access_container.read_item(item=input_model.username, partition_key=input_model.username)
        item['app_access'] = []
        access_container.replace_item(item=item['id'], body=item)
        # access_container.delete_item(item=input_model.username, partition_key=input_model.username)
        return True
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        raise HTTPException(status_code=404, detail="Resource not found")
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/give_all_access/")
async def give_all_access(input_model:UsernameModel):
    try:

        item = access_container.read_item(item=input_model.username, partition_key=input_model.username)
        item['app_access'] = [
        "Chat",
        "Image",
        "Assist",
        "Audio",
        "Document"
        ]
        access_container.replace_item(item=item['id'], body=item)
        # access_container.delete_item(item=input_model.username, partition_key=input_model.username)
        return True
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        raise HTTPException(status_code=404, detail="Resource not found")
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
from collections import defaultdict

@app.get("/token_usage/")
def get_token_usage():
    # Current time in UTC
    current_time = datetime.utcnow()
    # Subtracting 24 hours
    twelve_hours_ago = current_time - timedelta(hours=24)

    # Prepare a list of hours for the last 24 hours
    hourly_totals = defaultdict(lambda: {"input_tokens": 0, "output_tokens": 0})
    
    # Generate hour labels for the last 24 hours in UTC and IST
    for i in range(24):
        utc_hour = (twelve_hours_ago + timedelta(hours=i)).strftime('%Y-%m-%d %H:00:00')
        ist_hour = (twelve_hours_ago + timedelta(hours=i) + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%d %H:00:00')
        hourly_totals[utc_hour]  # Initialize with zero values

    # Formatting the timestamp as a string
    formatted_time = twelve_hours_ago.strftime('%Y-%m-%d %H:%M:%S')

    # Query to get tokens used in the last 24 hours
    query = f"""
    SELECT 
        b.timestamp,
        b.input_tokens,
        b.output_tokens
    FROM c
    JOIN b IN c.buffer
    WHERE 
        b.timestamp >= "{formatted_time}"
    """

    # Execute the query
    items = list(container.query_items(query=query, enable_cross_partition_query=True))

    for item in items:
        # Parse the timestamp
        timestamp = datetime.strptime(item['timestamp'], '%Y-%m-%d %H:%M:%S.%f')
        hour_utc = timestamp.strftime('%Y-%m-%d %H:00:00')
        hour_ist = (timestamp + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%d %H:00:00')
        
        # Update the totals
        hourly_totals[hour_utc]['input_tokens'] += item.get('input_tokens', 0)
        hourly_totals[hour_utc]['output_tokens'] += item.get('output_tokens', 0)

    # Prepare the final output format
    data = []
    for hour, tokens in sorted(hourly_totals.items()):
        total_tokens = tokens['input_tokens'] + tokens['output_tokens']
        ist_hour = (datetime.strptime(hour, '%Y-%m-%d %H:%M:%S') + timedelta(hours=5, minutes=30)).strftime('%Y-%m-%d %H:00:00')
        data.append({"Time": ist_hour, "Total_tokens": total_tokens})

    return {"data": data}

@app.post("/totalusers/")
async def Total_Users():
    access_container = database.get_container_client("maricogpt-access")
    try:
        # query = "SELECT top 10 * FROM c where STARTSWITH(c.id, @prefix ) = true order by c.Date_uploaded desc"
        query = "SELECT VALUE COUNT(1) FROM c"
        # params = [{"name": "@prefix", "value": input_model.username}]
        items = list(access_container.query_items(query=query, enable_cross_partition_query=True))
        total_users = items[0] if items else 0
        return total_users
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        pass
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/total_input_tokens/")
async def Total_Input_Tokens():
    try:
        query = '''SELECT VALUE SUM(m.input_tokens)
                FROM c
                 JOIN m IN c.buffer
                WHERE m.type = 'human'
                '''
        # params = [{"name": "@prefix", "value": input_model.username}]
        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        total_input_tokens = items[0] if items else 0
        return total_input_tokens
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        pass
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    
@app.post("/total_output_tokens/")
async def Total_Output_Tokens():
    try:
        query = '''SELECT VALUE SUM(m.output_tokens)
                FROM c
                 JOIN m IN c.buffer
                WHERE m.type = 'ai'
                '''
        items = list(container.query_items(query=query, enable_cross_partition_query=True))
        total_output_tokens = items[0] if items else 0
        return total_output_tokens
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        pass
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/total_tokens/")
async def Total_Tokens():
    try:
        input_token_query = '''
            SELECT VALUE SUM(m.input_tokens)
            FROM c
            JOIN m IN c.buffer
            WHERE m.type = 'human'
        '''
        output_token_query = '''
                SELECT VALUE SUM(m.output_tokens)
                FROM c
                 JOIN m IN c.buffer
                WHERE m.type = 'ai'
                '''
        items_input = list(container.query_items(query=input_token_query, enable_cross_partition_query=True))
        items_output = list(container.query_items(query=output_token_query, enable_cross_partition_query=True))

        total_input_tokens = items_input[0] if items_input else 0
        total_output_tokens = items_output[0] if items_output else 0
        return total_input_tokens + total_output_tokens
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        pass
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/total_output_tokens_per_user/")
async def Total_Output_Tokens_per_user(input_model : UsernameModel):
    try:
        query = '''
                SELECT VALUE SUM(m.output_tokens)
                FROM c
                JOIN m IN c.buffer
                where STARTSWITH(c.id, @prefix )
                AND m.type = 'ai'
                '''
        params = [{"name": "@prefix", "value": input_model.username}]
        items = list(container.query_items(query=query,parameters=params,enable_cross_partition_query=True))
        total_output_tokens = items[0] if items else 0
        return total_output_tokens
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        pass
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/total_input_tokens_per_user/")
async def Total_input_Tokens_per_user(input_model : UsernameModel):
    try:
        query = '''
                SELECT VALUE SUM(m.input_tokens)
                FROM c
                JOIN m IN c.buffer
                where STARTSWITH(c.id, @prefix )
                AND m.type = 'human'
                '''
        params = [{"name": "@prefix", "value": input_model.username}]
        items = list(container.query_items(query=query,parameters=params,enable_cross_partition_query=True))
        total_input_tokens = items[0] if items else 0
        return total_input_tokens
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        pass
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/total_tokens_per_user/")
async def Total_input_Tokens_per_user(input_model : UsernameModel):
    try:
        query = '''
                SELECT VALUE SUM(m.input_tokens)
                FROM c
                JOIN m IN c.buffer
                where STARTSWITH(c.id, @prefix )
                AND m.type = 'human'
                '''
        params = [{"name": "@prefix", "value": input_model.username}]
        items = list(container.query_items(query=query,parameters=params,enable_cross_partition_query=True))
        total_input_tokens = items[0] if items else 0
        
        query = '''
        SELECT VALUE SUM(m.output_tokens)
        FROM c
        JOIN m IN c.buffer
        where STARTSWITH(c.id, @prefix )
        AND m.type = 'ai'
        '''
        items = list(container.query_items(query=query,parameters=params,enable_cross_partition_query=True))
        total_output_tokens = items[0] if items else 0
        return total_output_tokens + total_input_tokens
    
    except CosmosResourceNotFoundError:
        print("Resource not Found")
        pass
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/appaccess/")
async def AppAcess(input_model: AppAccessModel):
    access_container = database.get_container_client("maricogpt-access")
    try:
        username = input_model.username
        item = access_container.read_item(item=username, partition_key=username)
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
        return item["app_access"]
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    