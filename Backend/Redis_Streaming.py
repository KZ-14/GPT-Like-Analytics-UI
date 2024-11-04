from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from langchain.schema import HumanMessage, AIMessage
from langchain.memory import ConversationBufferWindowMemory
from langchain.memory import ConversationBufferMemory
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import StrOutputParser
from typing import AsyncIterator
from datetime import datetime
import asyncio
import logging
import json
import redis
from redis.exceptions import LockError
import time

# Redis setup
redis_host = 'maricogpt.redis.cache.windows.net'
redis_port = 6380  # Default port for SSL
redis_password = 'oaWKR5Jp9Frc1D4OrMXWh3YQlnX9mciRpAzCaKZLTS4='

redis_client = redis.StrictRedis(host=redis_host, port=redis_port,password= redis_password,ssl=True)
# redis_client = redis.Redis(host='maricogpt.redis.cache.windows.net', port= "8005", db=0)

logger = logging.getLogger(__name__)

endpoint = "https://marico-gpt-db.documents.azure.com:443/"
key = "A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA=="
client = CosmosClient(url=endpoint, credential=key)
database_name = "marico-gpt"
container_name = "marico-gpt-chat-history"

database = client.get_database_client(database_name)
container = database.get_container_client(container_name)

def load_memory_from_store(session_id):
    data = redis_client.get(f"chat:{session_id}")
    if data is None:
        load_store_from_cosmosdb(session_id)
        data = redis_client.get(f"chat:{session_id}")
    
    if data:
        conversation_data = json.loads(data)
        messages = []
        for msg in conversation_data["buffer"]:
            if msg["type"] == "human":
                messages.append(HumanMessage(**msg))
            elif msg["type"] == "ai":
                messages.append(AIMessage(**msg))
        return messages
    return []

def save_memory_to_store(memory, session_id, title):
    conversation_data = {
        "session_id": session_id,
        "title": title,
        "buffer": [message.dict() for message in memory.chat_memory.messages]
    }
    redis_client.set(f"chat:{session_id}", json.dumps(conversation_data))

def upload_store_to_cosmosdb(session_id):
    data = redis_client.get(f"chat:{session_id}")
    if data:
        conversation_data = json.loads(data)
        conversation_data['id'] = session_id
        conversation_data["key"] = session_id
        conversation_data['Date_uploaded'] = str(datetime.now())
        container.upsert_item(conversation_data)
        logger.info(f"Chat model - Session_ID ({session_id}): Chat history saved to CosmosDB successfully")
        redis_client.delete(f"chat:{session_id}")
        print(f"Store cleared for session {session_id}")

def load_store_from_cosmosdb(session_id):
    try:
        item = container.read_item(item=session_id, partition_key=session_id)
        redis_client.set(f"chat:{session_id}", json.dumps(item))
    except CosmosResourceNotFoundError:
        pass

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    existing_memory = load_memory_from_store(session_id)

    memory = ConversationBufferWindowMemory(
        chat_memory=InMemoryChatMessageHistory(messages=existing_memory),
        k=5,
        return_messages=True,
    )
    assert len(memory.memory_variables) == 1
    key = memory.memory_variables[0]
    messages = memory.load_memory_variables({})[key]
    return InMemoryChatMessageHistory(messages=messages)

async def ChatBot(input, session_id, title) -> AsyncIterator[str]:
    llm = AzureChatOpenAI(azure_deployment='gpt-4o-maricogpt', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2023-03-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()])

    existing_memory = load_memory_from_store(session_id)

    temp_memory = ConversationBufferMemory()
    if existing_memory:
         temp_memory.chat_memory.add_messages(existing_memory)

    template = """
    Relevant Information:

    {history}

    Conversation:
    Human: {input}
    AI:"""

    prompt = PromptTemplate(input_variables=["history", "input"], template=template)
    parser = StrOutputParser()

    conversation = prompt | llm | parser
    
    chain = RunnableWithMessageHistory(conversation, get_session_history,history_messages_key="history",
)
    policy_chunks = ["This ", "prompt ", "does ", "not ", "comply ", "with ", "azure ", "content ", "policy. ", "Please ", "revise ", "your ", "prompt ", "and ", "try ", "again. "]
    out = []
    answered = False
    try:
        async for chunk in chain.astream({"input": input},config={"configurable": {"session_id": session_id}}):
            out.append(chunk)
            answered = True
            yield chunk 
            await asyncio.sleep(0)
    except Exception as e:
        print(e)
        for policy_chunk in policy_chunks:
            out.append(policy_chunk)
            yield policy_chunk 
        await asyncio.sleep(0)
        
    if answered:
        user_message = HumanMessage(content=input)
        temp_memory.chat_memory.add_message(user_message)

        ai_message = AIMessage(content="".join([x for x in out]))
        temp_memory.chat_memory.add_message(ai_message)

    save_memory_to_store(temp_memory, session_id, title)

async def clear_expired_sessions():
    while True:
        await asyncio.sleep(3600)  # Sleep for 1 hour
        for key in redis_client.scan_iter("chat:*"):
            session_id = key.decode('utf-8').split(':')[1]
            upload_store_to_cosmosdb(session_id)
        logger.info("Expired sessions cleared and uploaded to CosmosDB")

# Start the clearing coroutine
asyncio.create_task(clear_expired_sessions())

# ... (rest of the FastAPI app code)