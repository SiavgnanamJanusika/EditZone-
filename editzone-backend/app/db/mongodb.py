from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]

# Collections
users_col = db["users"]
editors_col = db["editors"]
requests_col = db["requests"]
messages_col = db["messages"]
payments_col = db["payments"]
reviews_col = db["reviews"]
notifications_col = db["notifications"]
otps_col = db["otps"]


async def ensure_indexes():
    await client.admin.command("ping")
    await users_col.create_index("email", unique=True)
    await users_col.create_index("nic", unique=True, sparse=True)
    await editors_col.create_index("user_id", unique=True)
    await requests_col.create_index([("user_id", 1)])
    await requests_col.create_index([("editor_id", 1)])
    await messages_col.create_index([("request_id", 1), ("created_at", 1)])
    await messages_col.create_index([("sender_id", 1), ("created_at", -1)])
    await payments_col.create_index([("request_id", 1)])
    await payments_col.create_index(
        [("user_id", 1), ("billing_period", 1), ("payment_type", 1)],
        unique=True,
        partialFilterExpression={"payment_type": "monthly_admin_fee"},
    )
    await reviews_col.create_index([("request_id", 1)], unique=True)
