from langchain_core.prompts import ChatPromptTemplate
from langchain.sql_database import SQLDatabase
from langgraph.checkpoint.memory import MemorySaver

import pandas as pd
from urllib.parse import quote
from sqlalchemy import create_engine

from typing import Any

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableLambda, RunnableWithFallbacks
from langgraph.prebuilt import ToolNode

from langchain_openai import AzureChatOpenAI

from langchain.agents import Tool
from langchain_core.tools import tool

from typing import Annotated, Literal

from langchain_core.messages import AIMessage, ToolMessage, HumanMessage
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

from langgraph.graph import END, StateGraph, START
from langgraph.graph.message import AnyMessage, add_messages
from dotenv import load_dotenv
import re, json
from cosmos_db import CosmosDBSaver
from azure.cosmos import CosmosClient, exceptions

load_dotenv()
import os

def check_partition_key(partition_key_value):
    client = CosmosClient(os.getenv("COSMOS_DB_ENDPOINT"), os.getenv("COSMOS_DB_KEY"))
    database = client.get_database_client(os.getenv("COSMOS_DB_NAME"))
    container = database.get_container_client(os.getenv("COSMOS_DB_CONTAINER"))

    # Query to check for the existence of the partition key
    query = f"SELECT * FROM c WHERE c.key = @partition_key"
    parameters = [{"name": "@partition_key", "value": partition_key_value}]

    try:
        items = list(container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
        if items:
            print(f"Partition key '{partition_key_value}' exists in the container.")
            return True
        else:
            print(f"Partition key '{partition_key_value}' does not exist in the container.")
            return False
    except exceptions.CosmosHttpResponseError as e:
        print(f"An error occurred: {e.message}")
        
def _print_event(event: dict, _printed: set, max_length=1500):
    current_state = event.get("dialog_state")
    if current_state:
        print("Currently in: ", current_state[-1])
    message = event.get("messages")
    if message:
        if isinstance(message, list):
            message = message[-1]
        if message.id not in _printed:
            msg_repr = message.pretty_repr(html=True)
            if len(msg_repr) > max_length:
                msg_repr = msg_repr[:max_length] + " ... (truncated)"
            print(msg_repr)
            _printed.add(message.id)

def create_snowflake_conn():
    username = os.environ['SNOWFLAKE_USERNAME']
    password = os.environ['SNOWFLAKE_PASSWORD']
    snowflake_account = os.environ['SNOWFLAKE_ACCOUNT'] 
    database = os.environ['SNOWFLAKE_DB'] 
    schema = os.environ['SNOWFLAKE_SCHEMA']
    warehouse = os.environ['SNOWFLAKE_WAREHOUSE'] 
    role = os.environ['SNOWFLAKE_ROLE']
    snowflake_url = f"snowflake://{username}:{quote(password)}@{snowflake_account}/{database}/{schema}?warehouse={warehouse}&role={role}"
    connection_string = snowflake_url
    engine = create_engine(connection_string)
    return engine

def get_df_from_query(query:str):
    """
    Fetch the data from snowflake and return a dataframe.

    Args:
        query (str): query to fetch the data

    Returns:
        pd.DataFrame: dataframe consisting the data
    """
    engine = create_snowflake_conn()
    with engine.connect() as connection:
        df = pd.read_sql(query, connection)
        
    df.columns = [' '.join(col.split('_')).upper() for col in df.columns]
    df = df.round(4)
    return df

def get_db_conn() -> SQLDatabase:
    """
    Creates the Snowflake DB connection.
    """
    engine = create_snowflake_conn()
    db = SQLDatabase(engine)
    return db



def execute_sql_queries(ai_message):
    # Connect to the Snowflake database
    resp = ai_message
    results = {}

    try:
        columns = re.findall(r"`([^`]*)`", resp)
        sql_queries = re.findall(r"```sql(.*?)```", resp, re.DOTALL)
        db = get_db_conn()
        for i, query in enumerate(sql_queries):
            result = db.run_no_throw(query)
            result = re.findall(r"'([^']*)'", result)
            # Fetch all rows and get column names
            results[columns[i]] = result
    except Exception as e:
        results["error"] = str(e)

    # Return the results as a JSON object
    return results


def check_filters(sql_result):
    """
    Check the sql query for the check filters.
    """
    
    filter_check_system ="""
    Your task is to evaluate the input sql query and check if the user wants filter any of the columns in the table.
    Also provide the columns which have the filters applied and wrap the filter inside `` i.e. 
    `column_name`.
    If user wants to filter any of the columns write a query to find the unique values in the column using "ilike %keyword%" for fuzzy match form the table. Put the limit 10 in query.
    Else return 'NO FILTER REQUIRED'.
    """
    result = llm.invoke([("system", filter_check_system), ('user',sql_result)])
    return result


def create_tool_node_with_fallback(tools: list) -> RunnableWithFallbacks[Any, dict]:
    """
    Create a ToolNode with a fallback to handle errors and surface them to the agent.
    """
    return ToolNode(tools).with_fallbacks(
        [RunnableLambda(handle_tool_error)], exception_key="error"
    )


def handle_tool_error(state) -> dict:
    error = state.get("error")
    tool_calls = state["messages"][-1].tool_calls
    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n please fix your mistakes.",
                tool_call_id=tc["id"],
            )
            for tc in tool_calls
        ]
    }
    
table_schema = "\nCREATE TABLE dwh_query_ai_billwise (\n\tdate DATE, \n\tdistributor_code VARCHAR(50), \n\tmaterial_code VARCHAR(50), \n\tmaterial_group_code VARCHAR(100), \n\tsales_volume DECIMAL(30, 6), \n\tprimary_discount DECIMAL(30, 6), \n\tsecondary_discount DECIMAL(30, 6), \n\ttotal_discount DECIMAL(31, 6), \n\tquantity DECIMAL(38, 0), \n\tgross_value FLOAT, \n\tnet_value DECIMAL(30, 6), \n\tcustomer_name VARCHAR(200), \n\tstate_name VARCHAR(200), \n\tchannel_name VARCHAR(200), \n\tcluster_name VARCHAR(16777216), \n\tcluster_code VARCHAR(16777216), \n\tasm_area_code VARCHAR(50), \n\tasm_area_name VARCHAR(200), \n\tmaterial_group_desc VARCHAR(100), \n\tparent_material_desc VARCHAR(100), \n\tportfolio_name VARCHAR(100)\n)\n\n/*\n3 rows from dwh_query_ai_billwise table:\ndate\tdistributor_code\tmaterial_code\tmaterial_group_code\tsales_volume\tprimary_discount\tsecondary_discount\ttotal_discount\tquantity\tgross_value\tnet_value\tcustomer_name\tstate_name\tchannel_name\tcluster_name\tcluster_code\tasm_area_code\tasm_area_name\tmaterial_group_desc\tparent_material_desc\tportfolio_name\n2021-09-27\t6895\t718093\tPA-BDYLOT\t0.005000\t0.000000\t1904.800000\t1904.800000\t20\t2000.0\t2000.000000\tWest Bengal Trading Agency\tWest Bengal\tGT\tCluster 1 East\tCE1\tKOL\tKolkata\tP Adv Body Lot\tPA BODY LOTION DEEP NOURISH 250ml BTL\tSkin Care\n2021-07-10\t12678\t706247\tSW HRGEL\t0.000700\t0.000000\t11.069000\t11.069000\t14\t636.4399999999999\t625.371000\tA & A Traders\tHaryana\tGT\tCluster 2 North\tCN2\tHAR\tHaryana & HP\tSet Wet Hair Gel\tSETWET HAIRGEL WET LOOK 50ml TUB\tMale Grooming\n2021-06-19\t135\t705058\tPCNO(R)\t0.012775\t0.000000\t132.312000\t132.312000\t73\t4844.28\t4689.049000\tJ.K. AGENCIES\tBihar\tGT\tCluster 2 East\tCE2\tBIHW\tBihar West\tParachute Rigids\tPCNO 175ml BTL\tCNO\n*/"

    
def fetch_table_schema(table_name):
    """Fetch the schema of the specified table."""
    try:
        # db = get_db_conn()
        # schema = db.get_table_info([table_name])
        schema = table_schema
        return schema
    except Exception as e:
        return str(e)
    
    
@tool
def db_query_tool(query: str) -> str:
    """
    Execute a SQL query against the database and get back the result.
    If the query is not correct, an error message will be returned.
    If an error is returned, rewrite the query, check the query, and try again.
    """
    db = get_db_conn()
    result = db.run_no_throw(query)
    if not result:
        return "Error: Query failed. Please rewrite your query and try again."
    return result



# Create a LangChain Tool
table_schema_tool = Tool(
    name="FetchTableSchema",
    func=fetch_table_schema,
    description="Fetch the schema of a specified table in the SQL database."
)

query_check_system ="""
You will be acting as an AI Snowflake SQL Expert named QueryAI.
Your goal is to give correct, executable sql query to users.

Here are 6 critical rules for the interaction you must abide:
<rules>
2. If I don't tell you to find a limited set of results in the sql query or question, you MUST limit the number of responses to 10.
3. Text / string where clauses must be fuzzy match e.g ilike %keyword%
4. Make sure to generate a single snowflake sql code, not multiple. 
5. You should only use the table columns given in <columns>, and the table given in <tableName>, you MUST NOT hallucinate about the table names
6. DO NOT put numerical at the very front of sql variable.
7. Make for mathematical calculation handle divide by 0 case.
8. If I don't tell to sort the results in any specific order then sort the result the into descending order of the numerical column or set of columns which you find more suitable.
9. DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
10. Before writing the query make sure the query is correct and it should not generate any error.
11. Make sure the information is asked is returned no extra information is included in the query, aggregate  data for the information asked do not return any extra column information.
</rules>

Don't forget to use "ilike %keyword%" for fuzzy match queries (especially for variable_name column)

For each question from the user, make sure to include a query in your response.

"""


llm = AzureChatOpenAI(
    azure_deployment=os.environ['AZURE_OPENAI_DEPLOYMENT'],
    azure_endpoint=os.environ['AZURE_OPENAI_ENDPOINT'],
    api_key=os.environ['AZURE_OPENAI_API_KEY'],
    api_version=os.environ['AZURE_OPEN_AI_VERSION'],
    temperature=0
    )

query_check_prompt = ChatPromptTemplate.from_messages(
    [("system", query_check_system), ("placeholder", "{messages}")]
)
query_check = query_check_prompt | llm.bind_tools(
    [db_query_tool], tool_choice="auto"
)

query_gen_system = """You are a SQL expert with a strong attention to detail.

Here is some information about the data table:
This table has information of FMCG product sales of an Indian organization along with product and demographic information.
The Gross sales is the total sales value, and net sales is sales after tax. The material group code can be considered as
brand code and material group description is brand description.

Given an input question, output a syntactically correct Snowflake query to run, then look at the results of the query and return the answer.

DO NOT CALL TOOL BESIDE SubmitFinalAnswer TO SUBMIT THE FINAL ANSWER and MUST INCLUDE THE SQL QUERY IN THE FINAL ANSWER THAT GENERATE THE FINAL ANSWER.
Only  wrap the generated sql code with ``` sql code markdown in this format e.g:
```sql
(select 1) union (select 2)
``` 

When generating the query:

Output the SQL query that answers the input question without a tool call and the Answer must start with 'final_answer' followed by the sql query.

You can order the results by a relevant column to return the most interesting examples in the database.

Never query for all the columns from a specific table, only ask for the relevant columns given the question.

If you have enough information to answer the input question, simply invoke the appropriate tool to submit the final answer to the user.

Here are critical rules for the interaction you must abide:
<rules>
1. If I don't tell you to find a limited set of results in the sql query or question, you MUST limit the number of responses to 10.
2. Text / string where clauses must be fuzzy match e.g ilike %keyword%
3. Make sure to generate a single snowflake sql code, not multiple. 
4. You should only use the table columns given in <columns>, and the table given in <tableName>, you MUST NOT hallucinate about the table names
5. DO NOT put numerical at the very front of sql variable.
6. Make for mathematical calculation handle divide by 0 case.
7. If I don't tell to sort the results in any specific order then sort the result the into descending order of the numerical column or set of columns which you find more suitable.
8. DO NOT make any DML statements (INSERT, UPDATE, DELETE, DROP etc.) to the database.
9. Before writing the query make sure the query is correct and it should not generate any error.
10. Make sure the information is asked is returned no extra information is included in the query, aggregate  data for the information asked do not return any extra column information.
11. NEVER make stuff up if you don't have enough information to answer the query... just say you don't have enough information.
12. Divide the net values and gross values by 10000000 to convert the values in the crore also rename the column name accordingly.
</rules>

Don't forget to use "ilike %keyword%" for fuzzy match queries (especially for variable_name column)

If you get an error while executing a query, rewrite the query and try again.

If you get an empty result set, you should try to rewrite the query to get a non-empty result set.
"""


# while submitting final answer.

# Define the state for the agent
class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    

# Define a new graph
workflow = StateGraph(State)


def question_check(state: State) -> dict[str, list[AIMessage]]:
    """
    This node validates if the user's query can be answered using the provided schema.
    """
    question_check_system ="""
    You will be acting as an AI Snowflake SQL Expert. You goal is to check the user input and decide the weather user input can be answered by using the available table schema.
    Ignore the system messages and tool messages and focus on user inputs only.
    If a query can be generated for the user question or the input is a sql query, respond with 'Proceed'.
    There are few exceptions input which can be answered with 'Proceed' are as follwoing:
        - Input is to do some changes in previous data
        - Input is to correction in previous data
        - Input is to apply any filter
    Otherwise, Output with 'This question can not be answered please ask correct question.'.
    Do not generate anything else in the given responses.
    """
    question_check_prompt = ChatPromptTemplate.from_messages(
        [("system", question_check_system), ("placeholder", "{messages}")]
    )
    question_check_llm = question_check_prompt | llm
        
    result  = question_check_llm.invoke(state)
    
    if result.content != 'Proceed':
        return {
            "messages": [
                AIMessage(
                    content=f"This question can not be answered please ask correct question."
                )
            ]
        }
        
    return {
        "messages": [
            AIMessage(content="Proceed"),
        ]
    }


def question_check_gate(state: State) -> Literal[END, "query_gen"]:
    
    messages = state["messages"]
    last_message = messages[-1]
    # If there is a tool call, then we finish
    if last_message.content.startswith("Proceed"):
        return "query_gen"
    else:
        return END



def model_check_query(state: State) -> dict[str, list[AIMessage]]:
    """
    Use this tool to double-check if your query is correct before executing it.
    """
    return {"messages": [query_check.invoke({"messages": [state["messages"][-1]]})]}

# Add a node for a model to choose the relevant tables based on the question and available tables
model_get_schema = llm.bind_tools(
    [table_schema_tool]
)



# Describe a tool to represent the end state
class SubmitFinalAnswer(BaseModel):
    """Submit the final answer to the user based on the query results."""
    final_answer: str = Field(..., description="The final answer to the user")


query_gen_prompt = ChatPromptTemplate.from_messages(
    [("system", query_gen_system), ("placeholder", "{messages}")]
)

query_gen = query_gen_prompt | llm.bind_tools(
    [SubmitFinalAnswer]
)
# query_gen = query_gen_prompt | llm


def query_gen_node(state: State):
    message = query_gen.invoke(state)
    # Sometimes, the LLM will hallucinate and call the wrong tool. We need to catch this and return an error message.
    tool_messages = []
    if message.tool_calls:
        for tc in message.tool_calls:
            if tc["name"] != "SubmitFinalAnswer":
                tool_messages.append(
                    ToolMessage(
                        content=f"Error: The wrong tool was called: {tc['name']}. Please fix your mistakes. Remember to only call SubmitFinalAnswer to submit the final answer. Generated queries should be outputted WITHOUT a tool call.",
                        tool_call_id=tc["id"],
                    )
                )
    else:
        tool_messages = []
    return {"messages": [message] + tool_messages}


# Define a conditional edge to decide whether to continue or end the workflow
def should_continue(state: State) -> Literal[END, "correct_query", "query_gen"]:
    messages = state["messages"]
    last_message = messages[-1]
    # if len(re.findall(r"```sql(.*?)```", last_message, re.DOTALL))>0:
    # if 'final_answer' in last_message.content:
    if getattr(last_message, "tool_calls", None):
        return END
    if last_message.content.startswith("Error:"):
        return "query_gen"
    else:
        return "correct_query"
    
    
# adding all the nodes to the graph
workflow.add_node("check_user_question", question_check )
workflow.add_node("get_schema_tool", create_tool_node_with_fallback([table_schema_tool]))
workflow.add_node( "model_get_schema", lambda state: { "messages": [model_get_schema.invoke(state["messages"])],},)
workflow.add_node("query_gen", query_gen_node)
workflow.add_node("correct_query", model_check_query)
workflow.add_node("execute_query", create_tool_node_with_fallback([db_query_tool]))


# adding the edge between the nodes
workflow.add_edge(START, "model_get_schema")
workflow.add_edge("model_get_schema", "get_schema_tool")
workflow.add_edge("get_schema_tool", "check_user_question")
workflow.add_conditional_edges("check_user_question",question_check_gate)
workflow.add_conditional_edges("query_gen", should_continue,)
workflow.add_edge("correct_query", "execute_query")
workflow.add_edge("execute_query", "query_gen")

memory = MemorySaver()

app = workflow.compile(checkpointer=memory)


def extract_result(input:str):
    """_summary_

    Args:
        input (str): _description_

    Returns:
        str: _description_
    """
    try:
        result = eval(input['messages'][-1].additional_kwargs['tool_calls'][-1]['function']['arguments'])['final_answer']
    except KeyError:
        result = input['messages'][-1].content
    return result


def validate_filter_values(filter_vals):
    
    final_filters = {}
    user_input_filters = {}
    for key in filter_vals:
        final_filters[key] = filter_vals[key]
        user_input_filters[key] = filter_vals[key]
    # return {'final_filters':final_filters, 'user_input_filters': user_input_filters}
    return final_filters, user_input_filters
    
    
def fetch_query_ai_result( session_id, messages):
    
    config = {"configurable": {"thread_id": session_id}}
    with CosmosDBSaver.from_conn_info(
        endpoint=os.environ['COSMOS_DB_ENDPOINT'],
        key=os.environ['COSMOS_DB_KEY'],
        db_name=os.environ['COSMOS_DB_NAME'],
        container_name=os.environ['COSMOS_DB_CONTAINER']
    ) as checkpointer:
        app = workflow.compile(checkpointer=checkpointer)
        result = app.invoke(input={"messages": messages}, config=config)
        
    return result


def fetch_latest_checkpoint(session_id):
    config = {"configurable": {"thread_id": session_id}}
    with CosmosDBSaver.from_conn_info(
        endpoint=os.environ['COSMOS_DB_ENDPOINT'],
        key=os.environ['COSMOS_DB_KEY'],
        db_name=os.environ['COSMOS_DB_NAME'],
        container_name=os.environ['COSMOS_DB_CONTAINER']
    ) as checkpointer:
        checkpoint = checkpointer.get(config)
    return checkpoint

def get_answer(user_input, session_id, not_first_message = False, filter_input=None):
    """_summary_

    Args:
        user_input (str): _description_
        config (str): _description_
        not_first_message (bool, optional): _description_. Defaults to False.
        filter_input (dict, optional): _description_. Defaults to None.

    Returns:
        _type_: _description_
    """
    not_first_message = check_partition_key(session_id)
    if not_first_message:
        last_message = fetch_latest_checkpoint(session_id)['channel_values']['messages'][-1]
        print(last_message)
        if ('tool_calls' in last_message.additional_kwargs) ==False:
            print("USING AI MESSAGE METHOD")
            message = AIMessage( content=user_input)
        elif filter_input:
            input = f'Filter the data for columns and values {filter_input} in the final result query.'
            message = ToolMessage(
                    tool_call_id=last_message.tool_calls[0]["id"],
                    content=input,
                )
        else:
            message = ToolMessage(
                    tool_call_id=last_message.tool_calls[0]["id"],
                    content=user_input,
                )
    
        result = fetch_query_ai_result(session_id=session_id, messages=[message])
    else:
        messages = [
                ("system", "You will be acting as an AI Snowflake SQL Expert named QueryAI. Your goal is to give correct, executable sql query to users. Anything else asked can not be answered by you.For each question user asked refer the table dwh_query_ai_billwise"),
                ("user", user_input)
        ]
        result = fetch_query_ai_result(session_id=session_id, messages=messages)

    return result

def df_to_dict(data):
    data = data.fillna(0)
    data_dict = data.to_dict('records')
    return data_dict

async def apply_filters(filter_input, session_id, ):
    
    result = get_answer(user_input=None, session_id=session_id, not_first_message=True, filter_input=filter_input)
    last_message = extract_result(result)
    sql_query = re.findall(r"```sql(.*?)```", last_message, re.DOTALL)[0]
    data = get_df_from_query(query=sql_query)
    data_dict = df_to_dict(data)
    return { 'text': sql_query, 'data': data_dict } 


async def give_input(user_input, session_id, not_first_message = False):
    """
    Take the user input and return the output.
    Args:
        user_input (_type_): _description_
    """
    
    result = get_answer(user_input, session_id, not_first_message)
    last_message = extract_result(result)

    if last_message != 'This question can not be answered please ask correct question.':
        sql_query = re.findall(r"```sql(.*?)```", last_message, re.DOTALL)[0]
        data = get_df_from_query(query=sql_query)
        # check_query_result = check_filters(sql_query)
        
        # if check_query_result.content == 'NO FILTER REQUIRED':        
        #     data = get_df_from_query(query=sql_query)
        # else:
        #     # print(check_query_result.content)
        #     filters_required = execute_sql_queries(check_query_result.content)
        #     final_filters, user_input_filters = validate_filter_values(filter_vals=filters_required)
            
        #     if len(user_input_filters)>0:
        #         return {'user_input_required': user_input_filters}
                # return apply_filters(filter_input=user_input_filters, session_id=session_id)
            # else:
            #     apply_filters( final_filters, config)
        data_dict = df_to_dict(data)
        return { 'text': sql_query, 'data':data_dict }
    else:
        return { 'text': last_message, 'data':None }


if __name__ == "__main__":
    import uuid

    thread_id = str(uuid.uuid4())

    user_input = str(input("Hey! I'am Query AI. How can I help you today?\n"))
    not_first_message = False
    while user_input != 'quit' or user_input != 'q':
        result = give_input(user_input=user_input, session_id=thread_id, not_first_message=not_first_message)
        sql_query = result['sql_query']
        data = result['data']
        print('SQL Query: ', sql_query)
        print('Here is the data you asked for: \nInput: ',data)
        not_first_message = True
        user_input = str(input("Input: "))