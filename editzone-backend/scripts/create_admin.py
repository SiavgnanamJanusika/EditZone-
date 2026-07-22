"""
Run from editzone-backend/ with the venv active:
    python scripts/create_admin.py

Creates (or upgrades) a user to the 'admin' role so they can access /admin/* routes.
"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.mongodb import users_col
from app.core.security import hash_password
from app.core.utils import now_utc


async def main():
    email = input("Admin email: ").strip()
    username = input("Admin username: ").strip()
    password = input("Admin password (min 8 chars): ").strip()

    existing = await users_col.find_one({"email": email})
    if existing:
        await users_col.update_one({"_id": existing["_id"]}, {"$set": {"role": "admin", "registration_complete": True}})
        print(f"Existing user '{email}' upgraded to admin.")
        return

    await users_col.insert_one({
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "nic": f"ADMIN{int(now_utc().timestamp())}",
        "role": "admin",
        "registration_complete": True,
        "is_email_verified": True,
        "is_banned": False,
        "created_at": now_utc(),
    })
    print(f"Admin user '{email}' created.")


if __name__ == "__main__":
    asyncio.run(main())
