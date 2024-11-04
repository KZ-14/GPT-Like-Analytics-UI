from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from langchain.schema import HumanMessage, AIMessage
from langchain.memory import ConversationBufferWindowMemory
from langchain.memory import ConversationBufferMemory
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.schema import HumanMessage, AIMessage
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.output_parsers import StrOutputParser
from typing import AsyncIterator
from datetime import datetime
import asyncio
import logging
import tiktoken
# from langchain.callbacks import TokenCountingCallbackHandler
from langchain_community.callbacks import get_openai_callback
import redis
import json
from redis.exceptions import LockError

# import mylib

logger = logging.getLogger(__name__)

Store = {}
temp_store = {}

redis_host = 'maricogpt.redis.cache.windows.net'
redis_port = 6380  # Default port for SSL
redis_password = 'oaWKR5Jp9Frc1D4OrMXWh3YQlnX9mciRpAzCaKZLTS4='

redis_client = redis.StrictRedis(host=redis_host, port=redis_port,password= redis_password,ssl=True)

endpoint = "https://marico-gpt-db.documents.azure.com:443/"
key = "A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA=="
client = CosmosClient(url=endpoint, credential=key)
database_name = "marico-gpt"
container_name = "marico-gpt-chat-history"

database = client.get_database_client(database_name)
container = database.get_container_client(container_name)

######################marico-gpt-token-details#
token_store = {}
token_container = database.get_container_client("marico-gpt-token-details")
def update_token_details(session_id,title, input_tokens,output_tokens,answered):
    tokens = {
        "timestamp": str(datetime.now()),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "answered" : answered
    }
    
    if session_id in token_store:
        token_store[session_id]['token_details'].append(tokens)
        return
    else:
        load_token_store_from_cosmosdb(session_id)
        if session_id in token_store:
            token_store[session_id]['token_details'].append(tokens)
            return
    token_store[session_id] = {
        'title': title,
        'username': session_id,
        'token_details': [tokens] 
    }
        
def upload_token_store_to_cosmosdb():
    for session_id, token_data in token_store.items():
        token_data['id'] = session_id
        token_data["key"] = session_id
        token_data['Date_uploaded'] = str(datetime.now())
        token_container.upsert_item(
            token_data,
        )
    for x in token_store.keys():
        # logger.info(f"Chat model - Session_ID ({x} : Chat history saved to CosmosDB sucessfully")
        pass
    token_store.clear()
    print("token store cleared:", token_store)
    
    
def load_token_store_from_cosmosdb(session_idx):
    try:
        # item = token_container.read_item(item=session_idx,partition_key=session_idx)
        # item = {}
        # token_store[session_idx] = None
        pass
    except CosmosResourceNotFoundError:
        pass
########################

# def load_memory_from_store(session_id):
#     global Store
#     if session_id in Store:
#         messages = []
#         for msg in Store[session_id]["buffer"]:
#             if msg["type"] == "human":
#                 messages.append(HumanMessage(**msg))
#             elif msg["type"] == "ai":
#                 messages.append(AIMessage(**msg))
#         return messages
#     else:
#         load_store_from_cosmosdb(session_id)
#         if session_id in Store:
#             messages = []
#             for msg in Store[session_id]["buffer"]:
#                 if msg["type"] == "human":
#                     messages.append(HumanMessage(**msg))
#                 elif msg["type"] == "ai":
#                     messages.append(AIMessage(**msg))
#             return messages
#     return []
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

# def save_memory_to_store(memory, session_id, title):
#     global Store
#     conversation_data = {
#         "session_id": session_id,
#         "title": title,
#         "buffer": [message.dict() for message in memory.chat_memory.messages]
#     }
#     Store[session_id] = conversation_data  
def save_memory_to_store(memory, session_id, title):
    conversation_data = {
        "session_id": session_id,
        "title": title,
        "buffer": [message.dict() for message in memory.chat_memory.messages]
    }
    redis_client.set(f"chat:{session_id}", json.dumps(conversation_data))

# def upload_store_to_cosmosdb():
#     global Store
#     for session_id, conversation_data in Store.items():
#         conversation_data['id'] = session_id
#         conversation_data["key"] = session_id
#         conversation_data['Date_uploaded'] = str(datetime.now())
#         container.upsert_item(
#             conversation_data,
#         )
#     for x in Store.keys():
#         logger.info(f"Chat model - Session_ID ({x} : Chat history saved to CosmosDB sucessfully")
#     Store.clear()
#     print("Store cleared:", Store)
def upload_store_to_cosmosdb(session_id):
    data = redis_client.get(f"chat:{session_id}")
    try:
        if data:
            conversation_data = json.loads(data)
            conversation_data['id'] = session_id
            conversation_data["key"] = session_id
            conversation_data['Date_uploaded'] = str(datetime.now())
            container.upsert_item(conversation_data)
            logger.info(f"Chat model - Session_ID ({session_id}): Chat history saved to CosmosDB successfully")
            token_data = {} 
            token_data['id'] = session_id
            token_data["key"] = session_id
            token_data['Date_uploaded'] = str(datetime.now())
            token_data['chat_details'] = []
            for ind,i in enumerate(conversation_data["buffer"]):
                # print(i["input_tokens"])
                if "input_tokens" in i:
                    token_data_per_chat = {"input_tokens":i["input_tokens"],"timestamp": i["timestamp"]}
                elif "output_tokens" in i:
                    token_data_per_chat = {"output_tokens":i["output_tokens"],"timestamp": i["timestamp"]}
                else: token_data_per_chat = {}
                token_data['chat_details'].append(token_data_per_chat)
            token_container.upsert_item(token_data)
            redis_client.delete(f"chat:{session_id}")
            print(f"Store cleared for session {session_id}")
    except Exception as e:
        print(e)
# def load_store_from_cosmosdb(session_idx):
#     global Store
#     try:
#         item = container.read_item(item=session_idx,partition_key=session_idx)
#         Store[session_idx] = {
#             "id": item["id"],
#             "title":item["title"],
#             "buffer": item["buffer"]
#         }
#     except CosmosResourceNotFoundError:
#         pass
#     print(Store)
def load_store_from_cosmosdb(session_id):
    try:
        item = container.read_item(item=session_id, partition_key=session_id)
        redis_client.set(f"chat:{session_id}", json.dumps(item))
    except CosmosResourceNotFoundError:
        pass

# def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
#     global temp_store
    
#     existing_memory = load_memory_from_store(session_id)
#     # if (session_id not in temp_store):
#     #     temp_store[session_id] = InMemoryChatMessageHistory()
#     #     return temp_store[session_id]

#     memory = ConversationBufferWindowMemory(
#         chat_memory= InMemoryChatMessageHistory(messages = existing_memory),
#         k=5,
#         return_messages=True,
#     )
#     assert len(memory.memory_variables) == 1
#     key = memory.memory_variables[0]
#     messages = memory.load_memory_variables({})[key]
#     temp_store[session_id] = InMemoryChatMessageHistory(messages=messages)
#     return temp_store[session_id]

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

async def ChatBot(input,session_id,title) -> AsyncIterator[str]:

    # llm = AzureChatOpenAI(azure_deployment='assistants-test-dep', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2024-02-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()]) 
    # llm = AzureChatOpenAI(azure_deployment='gpt-4o', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2023-03-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()]) 
    token_counter = get_openai_callback()
    llm = AzureChatOpenAI(azure_deployment='gpt-4o-maricogpt', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2023-03-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()])

    existing_memory = load_memory_from_store(session_id)

    temp_memory = ConversationBufferMemory()
    if existing_memory:
         temp_memory.chat_memory.add_messages(existing_memory)

    # memory = ConversationBufferWindowMemory(k=3)
    # if temp_memory:
    #     memory.chat_memory.add_messages(temp_memory.chat_memory.messages[-memory.k:])
    #    Replace the output formmating with HTML tags please do not include <html> and <body> and do not add multiple line breaks between html tags.


    # template = """The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context as well. 
    # The AI uses information contained in the "Relevant Information" section and does not hallucinate as well as answer any human queries.
    # Relevant Information:

    # {history}

    # Conversation:
    # Human: {input}
    # AI:"""

    template = """
    Relevant Information:

    {history}

    Conversation:
    Human: {input}
    AI:"""

    prompt = PromptTemplate(input_variables=["history", "input"], template=template)
    parser = StrOutputParser()

    conversation = prompt | llm | parser
    # conversation = LLMChain(llm = llm,prompt=prompt,verbose = False)
    
    chain = RunnableWithMessageHistory(conversation, get_session_history,history_messages_key="history",
)
    policy_chunks = ["This ", "prompt ", "does ", "not ", "comply ", "with ", "azure ", "content ", "policy. ", "Please ", "revise ", "your ", "prompt ", "and ", "try ", "again. "]
    out = []
    answered = False
    
        # Initialize tiktoken encoder
    enc = tiktoken.get_encoding("cl100k_base")

    # Calculate input tokens
    # input_tokens = len(enc.encode(input))
    input_tokens = len(enc.encode(input))
    
    

    try:
        async for chunk in chain.astream({"input": input},config={"configurable": {"session_id": session_id}}):
            # print(chunk)
            # print("Chunk Recieved",chunk)
            out.append(chunk)
            answered = True
            yield chunk 
            # if hasattr(llm, 'last_token_usage'):
            #     token_usage = llm.last_token_usage
            #     prompt_tokens = token_usage.get('prompt_tokens', 0)
            #     completion_tokens = token_usage.get('completion_tokens', 0)
            await asyncio.sleep(0)
    except Exception as e:
        print(e)
        for policy_chunk in policy_chunks:
            # out.append("This prompt does not comply with azure content policy. Please revise your prompt and try again.")
            out.append(policy_chunk)
            yield policy_chunk 
        await asyncio.sleep(0)
        
    if answered:
        output_tokens = sum([len(enc.encode(x)) for x in out])
        # input_tokens = cb.prompt_tokens
        user_message = HumanMessage(content=input,input_tokens=input_tokens,timestamp=str(datetime.now()))
        temp_memory.chat_memory.add_message(user_message)

        ai_message = AIMessage(content="".join([x for x in out]),output_tokens = output_tokens ,timestamp=str(datetime.now()))
        # # ai_message = AIMessage(content=conv)
        temp_memory.chat_memory.add_message(ai_message)
    # output_tokens = sum([len(enc.encode(x)) for x in out])
    
    # update_token_details(session_id,title, input_tokens,output_tokens,answered)
    save_memory_to_store(temp_memory, session_id, title)
    # return conv,session_id

    # upload_store_to_mongodb()