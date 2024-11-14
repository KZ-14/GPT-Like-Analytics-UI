from langchain_openai import AzureChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureOpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.callbacks import get_openai_callback
from langchain.schema import HumanMessage, AIMessage
from azure.cosmos import CosmosClient, PartitionKey  
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from langchain_community.vectorstores.azuresearch import AzureSearch
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_community.document_loaders.azure_blob_storage_file import AzureBlobStorageFileLoader
from langchain.memory import ConversationBufferWindowMemory
from langchain.memory import ConversationBufferMemory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain.retrievers import AzureAISearchRetriever
from typing import AsyncIterator
import asyncio
import base64   
import logging
from datetime import datetime 
import tiktoken
import redis
import json
from redis.exceptions import LockError
import pickle

logger = logging.getLogger(__name__)


from azure.search.documents.indexes.models import (
    ScoringProfile,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SimpleField,
    TextWeights,
)
Store = {}
temp_store = {}

redis_host = 'maricogpt.redis.cache.windows.net'
redis_port = 6380  # Default port for SSL
redis_password = 'oaWKR5Jp9Frc1D4OrMXWh3YQlnX9mciRpAzCaKZLTS4='

redis_client = redis.StrictRedis(host=redis_host, port=redis_port,password= redis_password,ssl=True)

endpoint = "https://marico-gpt-db.documents.azure.com:443/"
key = "A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA=="
client = CosmosClient(url=endpoint, credential=key)
# client = CosmosClient("AccountEndpoint=https://marico-gpt-db.documents.azure.com:443/;AccountKey=A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA==;")
database_name = "marico-gpt"
container_name = "marico-gpt-chat-history"
database = client.get_database_client(database_name)
container = database.get_container_client(container_name)
token_container = database.get_container_client("marico-gpt-token-details")

llm = AzureChatOpenAI(azure_deployment='gpt-4o-maricogpt', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2023-03-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()]) 
embeddings = AzureOpenAIEmbeddings(azure_deployment="text-embedding-ada", api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2024-02-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/")

def encode_key(key):
    encoded_bytes = base64.urlsafe_b64encode(key.encode('utf-8'))
    encoded_str = str(encoded_bytes, 'utf-8')
    return encoded_str

async def CreateRetriever(document_id,connect_str,container_name,blob_name):
    try:
        # loader = PyPDFLoader(sas_url)
        loader = AzureBlobStorageFileLoader(conn_str=connect_str,container = container_name, blob_name=blob_name)
        pages = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        splits = text_splitter.split_documents(pages)

        vector_store_address: str = "https://inhouse-ai-search-service.search.windows.net"
        vector_store_password: str = "gwCjVtUk7IpgpvjMhgM3Dgdt1noxYUIKGKUuNB4me2AzSeCc1Ccf"
        
        embeddings = AzureOpenAIEmbeddings(azure_deployment="text-embedding-ada", api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2024-02-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/")

        index_name: str = "marico-gpt"
        embedding_function = embeddings.embed_query
        fields = [
        SimpleField(
            name="id",
            type=SearchFieldDataType.String,
            key=True,
            filterable=True,
        ),
        SimpleField(
            name="original_document_id",
            type=SearchFieldDataType.String,
            key=False,
            filterable=True,
        ),
        SearchableField(
            name="content",
            type=SearchFieldDataType.String,
            searchable=True,
        ),
        SearchField(
            name="content_vector",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            # retrievable =True,
            vector_search_dimensions=len(embedding_function("Text")),
            vector_search_profile_name="myHnswProfile",
        ),
        SearchableField(
            name="metadata",
            type=SearchFieldDataType.String,
            filterable = True,
            searchable=True,
        ),

        SearchableField(
            name="title",
            type=SearchFieldDataType.String,
            searchable=True,
            filterable=True,
        )
        
        ]
        vector_store: AzureSearch = AzureSearch(
        azure_search_endpoint=vector_store_address,
        azure_search_key=vector_store_password,
        index_name=index_name,
        embedding_function=embedding_function,
        fields=fields
        )

        vector_store.add_texts(
        texts= [item.page_content for item in splits],
        metadatas=[
            {
                'id': f"doc_{encode_key(document_id)}_{index}", 
                'title': 'Testing_123',
                'original_document_id': f'{document_id}', 
            }
            for index, item in enumerate(splits)
        ]
        )

        # retriever = vector_store.as_retriever(
        # # filter = f"original_document_id eq 'doc_{document_id}'"
        #     # 'filter': {'metadata': f"{{\"id\": \"doc_123_20\", \"title\": \"Testing_123\", \"original_document_id\": \"doc_{document_id}\"}}"} 
        #     k = 20,
        #     search_kwargs={"filters": f"original_document_id eq '{document_id}'"}
        # )

        # return retriever
    except Exception as e:
        print(e)


async def CallRetriever(document_id: str) -> AzureAISearchRetriever:
    
    service_name = "inhouse-ai-search-service"  
    api_key = "gwCjVtUk7IpgpvjMhgM3Dgdt1noxYUIKGKUuNB4me2AzSeCc1Ccf"
    index_name = "marico-gpt"
    
    
    retriever = AzureAISearchRetriever(
        service_name=service_name,
        index_name=index_name,
        api_version="2023-11-01", 
        api_key=api_key,
        top_k=20,
        filter=f"original_document_id eq '{document_id}'",
         # query_type="hybrid"  # Options: "simple", "semantic", "vector", "hybrid"
    )
    
    redis_client.set(f"retriever:{document_id}", pickle.dumps(retriever))
    
    return retriever

    
    
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
#     return []
def load_memory_from_store(session_id):
    data = redis_client.get(f"chat:{session_id}")
    if data is None:
        load_store_from_cosmosdb_rag(session_id)
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

# def save_memory_to_store(memory, session_id,title):
#     global Store
#     conversation_data = {
#         "session_id": session_id,
#         "title" : title,
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


# def upload_store_to_cosmosdb_rag():
#     global Store
#     for session_id, conversation_data in Store.items():
#         # Ensure the data structure includes 'id' and partition key
#         conversation_data['id'] = session_id
#         conversation_data["key"] = session_id
#         conversation_data['Date_uploaded'] = str(datetime.now())
#         # Use 'session_id' as the partition key for the upsert operation
#         container.upsert_item(
#             conversation_data,
#         )
#     for x in Store.keys():
#         logger.info(f"Document model - Session_ID ({x} : Chat history saved to CosmosDB sucessfully")
#     Store.clear()
#     print("Store cleared:", Store)

def upload_store_to_cosmosdb_rag(session_id):
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

# def load_store_from_cosmosdb_rag(session_idx):
#     global Store
#     try:
#         item = container.read_item(item=session_idx,partition_key=session_idx)
#         Store[session_idx] = {
#             "id": item["id"],
#             "title": item["title"],
#             "buffer": item["buffer"]
#         }
#     except CosmosResourceNotFoundError:
#         pass

def load_store_from_cosmosdb_rag(session_id):
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
#         k=3,
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

async def Chatbot_RAG(input,session_id,title,retriever) -> AsyncIterator[str]:

    existing_memory = load_memory_from_store(session_id)

    temp_memory = ConversationBufferMemory()
    if existing_memory:
         temp_memory.chat_memory.add_messages(existing_memory)
        
    #"Replace the output formmating with HTML tags please do not include <html> and <body> and do not add multiple line breaks between html tags."

    system_prompt = (
    # "Use the following pieces of retrieved context to answer "
    # "the question. If you don't know the answer, say that you don't know."
    # "Retrieved context can be reffered as document/ppt/pdf/file/code/slides/research paper"
    # "Do not answer out of context questions instead give this reply"
    # "The Context for the above question is not provided or didn't found in the document."
    # "\n\n"
    # "{context}"
    
    """Use the retrieved context to answer the question accurately.
    If the information needed is not found within the provided document, file, code, or slides,
    respond with: 'The context for the above question was not provided or was not found in the document.' 
    answer only based on the given context and do not respond to questions that fall outside of it.
    User will always ask question from the document
    \n\n
    {context}"""
    )

    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "Retrieved context can be reffered as document/ppt/pdf/file/code/slides/research paper"
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as it is."
    )

    contextualize_q_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", contextualize_q_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )

    qa_prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ]
    )


    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    
    conversational_rag_chain = RunnableWithMessageHistory(
    rag_chain,
    get_session_history,
    input_messages_key="input",
    history_messages_key="chat_history",
    output_messages_key="answer"
    )

    policy_chunks = ["This ", "prompt ", "does ", "not ", "comply ", "with ", "azure ", "content ", "policy. ", "Please ", "revise ", "your ", "prompt ", "and ", "try ", "again. "]
    answered = False
    enc = tiktoken.get_encoding("cl100k_base")
    input_tokens = len(enc.encode(input))
    out = []
    try:
        async for chunk in conversational_rag_chain.astream({"input": input},config={"configurable": {"session_id": session_id,"retriever" :retriever}}):
        # print(chunk)
            # print("Chunk Recieved",chunk)
            try:
                if chunk['answer']:
                    # try:
                    #     print("Ye dekh Chunk document ID",chunk)
                    # except:
                    #     print('Kuch nhi mila Bhai')
                    yield chunk['answer']
                    answered = True
                    out.append(chunk['answer'])
            except KeyError as e:
                print(f"KeyError: {e} in chunk {chunk}")
                continue
            except Exception as e:
                print(f"An unexpected error occurred: {e}")
                continue
            await asyncio.sleep(0)
    except Exception as e:
        print(e)
        for policy_chunk in policy_chunks:
            # out.append("This prompt does not comply with azure content policy. Please revise your prompt and try again.")
            out.append(policy_chunk)
            yield policy_chunk 
        await asyncio.sleep(0)
        
    # with get_openai_callback() as cb:
    #     answer = conversational_rag_chain.invoke(
    #         {"input": input},
    #         config={
    #             "configurable": {"session_id": session_id}
    #         },  # constructs a key "abc123" in `store`.
    #     )["answer"]
    if answered:
        output_tokens = sum([len(enc.encode(x)) for x in out])
        user_message = HumanMessage(content=input,input_tokens=input_tokens,timestamp=str(datetime.now()))
        temp_memory.chat_memory.add_message(user_message)

        ai_message = AIMessage(content="".join([x for x in out]),output_tokens = output_tokens ,timestamp=str(datetime.now()))
        # # ai_message = AIMessage(content=conv)
        temp_memory.chat_memory.add_message(ai_message)

    save_memory_to_store(temp_memory, session_id,title)