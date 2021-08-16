import pymongo
import time


class DBManager:

    def __init__(self, db_address: str, db_name: str) -> None:
        """
        Initializes DBManager object
        @param db_address: database address
        @param db_name: database name
        """
        self.client = pymongo.MongoClient(db_address)
        self.col = self.client[db_name]['data']

    def get_latest_n(self, n: int) -> list[dict]:
        """
        Gets latest n messages
        @param n: number of messages to get
        @return: list of latest n messages
        """
        if n == 0:
            return []
        documents = list(self.col.find().sort('id', pymongo.DESCENDING).limit(n))
        for document in documents:
            del document['_id']
        return documents

    def insert_new_document(self, message: str, image_url: str) -> None:
        """
        Inserts new message document
        @param message: The message content string
        @param image_url: URL pointing to the instagram image
        """
        document = {
            'id': self.col.count_documents({}),
            'msg': message,
            'url': image_url,
            'timestamp_ms': int(round(time.time() * 1000))
        }
        self.col.insert_one(document)
