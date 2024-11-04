from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains import LLMChain
from langchain_core.output_parsers import StrOutputParser
from langchain.callbacks import StreamingStdOutCallbackHandler
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence

async def generate_title(user_input):
    llm = AzureChatOpenAI(azure_deployment='gpt-4o-maricogpt', api_key="df22c6e2396e40c485adc343c9a969ed",api_version="2023-03-15-preview",azure_endpoint= "https://milazdalle.openai.azure.com/") 
    template = """You are an expert at summarizing conversations with concise and meaningful titles.
    Based on the first message of the conversation,
    generate a title using exactly two words that captures the essence of the conversation.
    Here is the first message:
    {input}
    Please provide a two-word title that accurately represents the topic or theme."""

    prompt = PromptTemplate(input_variables=["input"], template=template)
    parser = StrOutputParser()
    chain = prompt | llm | parser
    response = chain.invoke({"input": user_input}) # Call the chain with the input
    return response