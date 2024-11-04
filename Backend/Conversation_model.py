from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from langchain.schema import ChatMessage
from langchain.schema import HumanMessage, AIMessage
from langchain.memory import ConversationBufferWindowMemory
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationChain
from langchain_openai import AzureChatOpenAI
from langchain import PromptTemplate
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.schema import HumanMessage, AIMessage

endpoint = "https://marico-gpt-db.documents.azure.com:443/"
key = "A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA=="
client = CosmosClient(url=endpoint, credential=key)
# client = CosmosClient("AccountEndpoint=https://marico-gpt-db.documents.azure.com:443/;AccountKey=A8sHzgvKfrrARuSNHYY3B6nbVzqt8AgVTI7GXfMXXon0t8JUApe8ASy4NE7FrU8VndKv8Jqx82DHACDbHltAZA==;")
database_name = "marico-gpt"
container_name = "marico-gpt-chat-history"

database = client.get_database_client(database_name)
container = database.get_container_client(container_name)


def load_memory_from_store(session_id):
    global Store
    if session_id in Store:
        messages = []
        for msg in Store[session_id]["buffer"]:
            if msg["type"] == "human":
                messages.append(HumanMessage(**msg))
            elif msg["type"] == "ai":
                messages.append(AIMessage(**msg))
        return messages
    return []

def save_memory_to_store(memory, session_id):
    global Store
    conversation_data = {
        "session_id": session_id,
        "buffer": [message.dict() for message in memory.chat_memory.messages]
    }
    Store[session_id] = conversation_data  


def upload_store_to_cosmosdb():
    global Store
    for session_id, conversation_data in Store.items():
        # Ensure the data structure includes 'id' and partition key
        conversation_data['id'] = session_id
        conversation_data["key"] = session_id
        # Use 'session_id' as the partition key for the upsert operation
        container.upsert_item(
            conversation_data,
        )
    Store.clear()
    print("Store cleared:", Store)

def load_store_from_cosmosdb(session_idx):
    global Store
    try:
        item = container.read_item(item=session_idx,partition_key=session_idx)
        Store[session_idx] = {
            "id": item["id"],
            "buffer": item["buffer"]
        }
    except CosmosResourceNotFoundError:
        pass

Store = {}

# load_store_from_mongodb(session_id)

async def ChatBot(input,session_id):

    # llm = AzureChatOpenAI(azure_deployment='assistants-test-dep', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2024-02-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()]) 
    llm = AzureChatOpenAI(azure_deployment='gpt-4o-maricogpt', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2023-03-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/",streaming=True,callbacks=[StreamingStdOutCallbackHandler()]) 

    existing_memory = load_memory_from_store(session_id)

    temp_memory = ConversationBufferMemory()
    if existing_memory:
        temp_memory.chat_memory.add_messages(existing_memory)

    memory = ConversationBufferWindowMemory(k=3)
    if temp_memory:
        memory.chat_memory.add_messages(temp_memory.chat_memory.messages[-memory.k:])

    # Replace the formatting with corresponding HTML tags excluding the <html> and <head> tags.
    template = """The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context as well. 
    The AI uses information contained in the "Relevant Information" section and does not hallucinate as well as answer any human queries.
    Output format should be in simple language.
    Relevant Information:

    {history}

    Conversation:
    Human: {input}
    AI:"""

    prompt = PromptTemplate(input_variables=["history", "input"], template=template)

    conversation = ConversationChain(llm = llm,prompt=prompt,verbose = False,memory=memory)

    
    conv = conversation.predict(input=input)

    user_message = HumanMessage(content=input)
    temp_memory.chat_memory.add_message(user_message)

    ai_message = AIMessage(content=conv)
    temp_memory.chat_memory.add_message(ai_message)

    save_memory_to_store(temp_memory, session_id)
    return conv,session_id


# upload_store_to_mongodb()