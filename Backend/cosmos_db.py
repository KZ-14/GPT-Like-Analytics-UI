from contextlib import asynccontextmanager, contextmanager
from typing import Any, AsyncIterator, Dict, Iterator, Optional, Sequence, Tuple

from langchain_core.runnables import RunnableConfig
# from azure.cosmos.aio import CosmosClient as AsyncCosmosClient
from azure.cosmos import CosmosClient, PartitionKey
import pickle
import os
from azure.cosmos import CosmosClient, exceptions
from dotenv import load_dotenv

load_dotenv()

from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    ChannelVersions,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    get_checkpoint_id,
)

def fetch_cosmosdb_data(partition_key_value,checkpoint_id):
    
    client = CosmosClient(os.environ["COSMOS_DB_ENDPOINT"], os.environ["COSMOS_DB_KEY"]+'==')
    database = client.get_database_client(os.environ["COSMOS_DB_NAME"])
    container = database.get_container_client(os.environ["COSMOS_DB_CONTAINER"])

    # Query to check for the existence of the partition key
    query = f"SELECT * FROM c WHERE c.key = @partition_key and c.id = @checkpoint_id"
    parameters = [{"name": "@partition_key", "value": partition_key_value},{"name":"@checkpoint_id","value":checkpoint_id}]
    items = list(container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
    return items[0]
    # try:
    #     items = list(container.query_items(query=query, parameters=parameters, enable_cross_partition_query=True))
    #     if items:
    #         # print(f"Partition key '{partition_key_value}' exists in the container.")
    #         return True
    #     else:
    #         # print(f"Partition key '{partition_key_value}' does not exist in the container.")
    #         return False
    # except exceptions.CosmosHttpResponseError as e:
    #     print(f"An error occurred: {e.message}")

class CosmosDBSaver(BaseCheckpointSaver):
    """A checkpoint saver that stores checkpoints in an Azure Cosmos DB database."""

    client: CosmosClient
    db: Any
    container: Any

    def __init__(self, client: CosmosClient, db_name: str, container_name: str) -> None:
        super().__init__()
        self.client = client
        self.db = self.client.get_database_client(db_name)
        self.container = self.db.get_container_client(container_name)

    @classmethod
    @contextmanager
    def from_conn_info(cls, *, endpoint: str, key: str, db_name: str, container_name: str) -> Iterator["CosmosDBSaver"]:
        client = None
        # try:
        client = CosmosClient(endpoint, key)
        yield CosmosDBSaver(client, db_name, container_name)
        # finally:
        #     if client:
        #         client.close()

    
    def get_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        """Get a checkpoint tuple from the database."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        query = f"SELECT * FROM c WHERE c.thread_id = @thread_id AND c.checkpoint_ns = @checkpoint_ns"
        parameters = [{"name": "@thread_id", "value": thread_id}, {"name": "@checkpoint_ns", "value": checkpoint_ns}]

        if checkpoint_id := get_checkpoint_id(config):
            query += " AND c.checkpoint_id = @checkpoint_id"
            parameters.append({"name": "@checkpoint_id", "value": checkpoint_id})
        query += " ORDER BY c.checkpoint_id DESC OFFSET 0 LIMIT 1"
        
        items = list(self.container.query_items(query, parameters=parameters, enable_cross_partition_query=True))
        if items:
            doc = items[0]
            config_values = {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": doc["checkpoint_id"]}
            checkpoint = pickle.loads(doc["checkpoint"].encode('UTF-8'))
            pending_writes = [
                (
                    write["task_id"],
                    write["channel"],
                    # self.serde.loads_typed((write["type"], write["value"])),
                    pickle.loads( write["value"].encode('UTF-8')),
                )
                for write in doc.get("writes", [])
            ]
            return CheckpointTuple(
                {"configurable": config_values},
                checkpoint,
                pickle.loads(doc["metadata"].encode('UTF-8')),
                (
                    {"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": doc["parent_checkpoint_id"]}}
                    if doc.get("parent_checkpoint_id") else None
                ),
                pending_writes,
            )

    def list(self, config: Optional[RunnableConfig], *, filter: Optional[Dict[str, Any]] = None,
            before: Optional[RunnableConfig] = None, limit: Optional[int] = None) -> Iterator[CheckpointTuple]:
        """List checkpoints from the database."""
        query = "SELECT * FROM c WHERE 1=1"
        parameters = []

        if config:
            query += " AND c.thread_id = @thread_id AND c.checkpoint_ns = @checkpoint_ns"
            parameters.append({"name": "@thread_id", "value": config["configurable"]["thread_id"]})
            parameters.append({"name": "@checkpoint_ns", "value": config["configurable"].get("checkpoint_ns", "")})

        if filter:
            for key, value in filter.items():
                query += f" AND c.metadata.{key} = @{key}"
                parameters.append({"name": f"@{key}", "value": value})

        if before:
            query += " AND c.checkpoint_id < @checkpoint_id"
            parameters.append({"name": "@checkpoint_id", "value": before["configurable"]["checkpoint_id"]})

        query += " ORDER BY c.checkpoint_id DESC"
        if limit:
            query += f" OFFSET 0 LIMIT {limit}"

        result = self.container.query_items(query, parameters=parameters, enable_cross_partition_query=True)
        for doc in result:
            checkpoint = pickle.loads(doc["checkpoint"].encode('UTF-8'))
            yield CheckpointTuple(
                {"configurable": {"thread_id": doc["thread_id"], "checkpoint_ns": doc["checkpoint_ns"], "checkpoint_id": doc["checkpoint_id"]}},
                checkpoint,
                pickle.loads(doc["metadata"].encode('UTF-8')),
                (
                    {"configurable": {"thread_id": doc["thread_id"], "checkpoint_ns": doc["checkpoint_ns"], "checkpoint_id": doc["parent_checkpoint_id"]}}
                    if doc.get("parent_checkpoint_id") else None
                ),
            )

    def put(self, config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata, new_versions: ChannelVersions) -> RunnableConfig:
        """Save a checkpoint to the database."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"]["checkpoint_ns"]
        checkpoint_id = checkpoint["id"]
        type_, serialized_checkpoint = self.serde.dumps_typed(checkpoint)
        doc = {
            "thread_id": thread_id,
            "checkpoint_ns": checkpoint_ns,
            "checkpoint_id": checkpoint_id,
            "parent_checkpoint_id": config["configurable"].get("checkpoint_id"),
            "type": type_,
            "checkpoint": str(pickle.dumps(checkpoint,0), 'UTF-8'),
            "metadata": str(pickle.dumps(metadata,0), 'UTF-8'),
        }
        doc['id'] = checkpoint_id
        doc['key'] = thread_id
        self.container.upsert_item(doc)
        return {"configurable": {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": checkpoint_id}}

    def put_writes(self, config: RunnableConfig, writes: Sequence[Tuple[str, Any]], task_id: str) -> None:
        """Store intermediate writes linked to a checkpoint."""
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"]["checkpoint_ns"]
        checkpoint_id = config["configurable"]["checkpoint_id"]

        writes_data = []
        for idx, (channel, value) in enumerate(writes):
            type_, serialized_value = self.serde.dumps_typed(value)
            writes_data.append({
                "task_id": task_id,
                "idx": idx,
                "channel": channel,
                "type": type_,
                "value": str(pickle.dumps(value,0), 'UTF-8'),
            })
        upsert_query = {"thread_id": thread_id, "checkpoint_ns": checkpoint_ns, "checkpoint_id": checkpoint_id}
        # doc = self.container.read_item(item=checkpoint_id, partition_key=thread_id)
        try:
            doc = self.container.read_item(item=checkpoint_id, partition_key=thread_id)
        except Exception as e:
            doc = fetch_cosmosdb_data(partition_key_value=thread_id,checkpoint_id=checkpoint_id)
            print("COSMOS DB ERROR",thread_id,checkpoint_id)
            pass
            # import traceback
            # print(str(traceback.format_exc()))
        doc["writes"] = writes_data
        self.container.upsert_item(doc)
        
        
if __name__ == "__main__":
    print(fetch_cosmosdb_data(partition_key_value="harshil.agrawal@marico.com_75e14c70-58f7-4ba2-bba4-c8134b9a528f",checkpoint_id="1efa1980-f524-6dd1-800a-816650f78f27"))