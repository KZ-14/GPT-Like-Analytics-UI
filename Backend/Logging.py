
import logging
import logging_loki
import json
import socket  # To get server IP
import certifi
# Set LokiEmitter to include the level in tags
logging_loki.emitter.LokiEmitter.level_tag = "level"

# Get the server's IP address
server_ip = socket.gethostbyname(socket.gethostname())

# Create a custom JSON formatter that includes function name, line number
class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "level": record.levelname,
            "message": record.getMessage(),
            "service": record.__dict__.get("service", "my-service"),
            "user_emailID": record.__dict__.get("user_emailID", "unknown"),  # Include user_id in logs
            "user_sessionID": record.__dict__.get("user_sessionID", "unknown"),  # Include user_id in logs
            "App" : "Backend",
            "tags": record.__dict__.get("tags", {}),
            "time": self.formatTime(record, self.datefmt),
            "function": record.funcName,  
            "line_number": record.lineno,  
            "server_ip": server_ip 
        }
        return json.dumps(log_record)

# Configure the Loki handler
handler = logging_loki.LokiHandler(
    url="https://ai.maricoapps.biz/loki/api/v1/push",
    version="1",
)

# Create a logger
def Create_Logger():
    logger = logging.getLogger("my-logger")
    logger.setLevel(logging.DEBUG)

    # Set JSON Formatter for the handler
    json_formatter = JsonFormatter()
    handler.setFormatter(json_formatter)

    # Add handler to logger
    logger.addHandler(handler)
    return logger