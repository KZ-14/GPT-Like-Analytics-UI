from langchain_openai import AzureChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import AzureOpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.callbacks import get_openai_callback
from langchain.schema import HumanMessage, AIMessage
from azure.cosmos import CosmosClient, PartitionKey  
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from langchain_community.vectorstores.azuresearch import AzureSearch
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_community.document_loaders.azure_blob_storage_file import AzureBlobStorageFileLoader

from azure.search.documents.indexes.models import (
    ScoringProfile,
    SearchableField,
    SearchField,
    SearchFieldDataType,
    SimpleField,
    TextWeights,
)
store = {}

endpoint = "https://marico-gpt-db.documents.azure.com:443/"
key = "A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA=="
client = CosmosClient(url=endpoint, credential=key)
# client = CosmosClient("AccountEndpoint=https://marico-gpt-db.documents.azure.com:443/;AccountKey=A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA==;")
database_name = "marico-gpt"
container_name = "marico-gpt-chat-history"
database = client.get_database_client(database_name)
container = database.get_container_client(container_name)

llm = AzureChatOpenAI(azure_deployment='gpt-4o-maricogpt', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2023-03-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()]) 
embeddings = AzureOpenAIEmbeddings(azure_deployment="text-embedding-ada", api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2024-02-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/")

async def CreateRetriever(document_id,sas_url,connect_str,container_name,blob_name):
    try:
        # loader = PyPDFLoader(sas_url)
        loader = AzureBlobStorageFileLoader(conn_str=connect_str,container = container_name, blob_name=blob_name)
        pages = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(pages)

        vector_store_address: str = "https://inhouse-ai-search-service.search.windows.net"
        vector_store_password: str = "gwCjVtUk7IpgpvjMhgM3Dgdt1noxYUIKGKUuNB4me2AzSeCc1Ccf"
        
        embeddings = AzureOpenAIEmbeddings(azure_deployment="text-embedding-ada", api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2024-02-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/")

        index_name: str = "marico-gpt-test"
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

        vector_ids = vector_store.add_texts(
        texts= [item.page_content for item in splits],
        metadatas=[
            {
                'id': f"doc_{document_id}_{index}", 
                'title': 'Testing_123',
                'original_document_id': f'doc_{document_id}', 
            }
            for index, item in enumerate(splits)
        ]
        )

        retriever = vector_store.as_retriever(
        # filter = f"original_document_id eq 'doc_{document_id}'"
            # 'filter': {'metadata': f"{{\"id\": \"doc_123_20\", \"title\": \"Testing_123\", \"original_document_id\": \"doc_{document_id}\"}}"} 
            k = 20,
            search_kwargs={"filters": f"original_document_id eq 'doc_{document_id}'"}
        )

        return retriever
    except Exception as e:
        print(e)
    
def convert_RAG_to_Cosmos_format(RAG_format):
    Cosmos_format = {}
    for session_id, history in RAG_format.items():
        buffer = []
        for message in history.messages:
            message_type = 'human' if isinstance(message, HumanMessage) else 'ai'
            buffer.append({
                'content': message.content,
                'additional_kwargs': {},
                'response_metadata': {},
                'type': message_type,
                'name': None,
                'id': None,
                'ex ample': False,
                'tool_calls': [],
                'invalid_tool_calls': [],
                'usage_metadata': None
            })
        Cosmos_format[session_id] = {
            'session_id': session_id,
            'buffer': buffer
        }
    return Cosmos_format

def convert_Cosmos_to_RAG_format(Cosmos_format):
    RAG_format = {}
    for session_id, data in Cosmos_format.items():
        messages = []
        for entry in data['buffer']:
            if entry['type'] == 'human':
                messages.append(HumanMessage(content=entry['content']))
            elif entry['type'] == 'ai':
                messages.append(AIMessage(content=entry['content']))
        RAG_format[session_id] = ChatMessageHistory(messages=messages)
    return RAG_format

def upload_store_to_cosmosdb_doc():
    global store
    temp_store = convert_RAG_to_Cosmos_format(store)
    for session_id, conversation_data in temp_store.items():
        conversation_data['id'] = session_id
        conversation_data["key"] = session_id
        container.upsert_item(
            conversation_data,
        )
    store.clear()
    print("Store cleared:", store)

def load_store_from_cosmosdb_doc(session_idx):
    global store
    temp_store = {}
    try:
        item = container.read_item(item=session_idx,partition_key=session_idx)
        temp_store[session_idx] = {
            "id": item["id"],
            "buffer": item["buffer"]
        }
        store = convert_Cosmos_to_RAG_format(temp_store)
    except CosmosResourceNotFoundError:
        pass
 

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    global store
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]


async def Chatbot_RAG(input,session_id,retriever):

    system_prompt = (
    "You are an assistant for question-answering tasks. "
    "Use the following pieces of retrieved context to answer "
    "the question. If you don't know the answer, say that you "
    "don't know. Keep the "
    "answer concise."
    "Do not answer out of context questions instead give this reply"
    "The Context for the above question is not provided or didn't found in the document."
    "\n\n"
    "{context}"
    )

    contextualize_q_system_prompt = (
        "Given a chat history and the latest user question "
        "which might reference context in the chat history, "
        "formulate a standalone question which can be understood "
        "without the chat history. Do NOT answer the question, "
        "just reformulate it if needed and otherwise return it as is."
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
    output_messages_key="answer",
    )

    with get_openai_callback() as cb:
        answer = conversational_rag_chain.invoke(
            {"input": input},
            config={
                "configurable": {"session_id": session_id}
            },  # constructs a key "abc123" in `store`.
        )["answer"]
    return answer,session_id    