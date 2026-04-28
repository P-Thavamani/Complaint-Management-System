#!/usr/bin/env python3
"""
add_worker.py — Script to add a new worker/agent to the GrievAI database.

Usage:
    python add_worker.py

Run this from the backend directory. It will prompt for worker details
and add them to BOTH the users collection (for login) and the agents 
collection (for AI assignment matching), matching the exact schema used 
by the application.
"""

import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
import bcrypt
import getpass

# Load environment variables from .env file
load_dotenv()

# ─── Supported worker skill/expertise categories ────────────────────────────────
AVAILABLE_EXPERTISE = [
    "hardware",
    "software",
    "network",
    "service",
    "billing",
    "electrical",
    "plumbing",
    "cleaning",
    "maintenance",
    "security",
    "all",
    "other",
]

DEPARTMENTS = [
    "IT Support",
    "Software Support",
    "Technical Support",
    "Customer Support",
    "Hardware Support",
    "Network Support",
    "Billing Support",
    "General Support",
]


def connect_db():
    """Connect to MongoDB and return the database."""
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("❌ Error: MONGO_URI is not set in the .env file.")
        sys.exit(1)

    try:
        client = MongoClient(
            mongo_uri,
            tls=True,
            tlsAllowInvalidCertificates=True,
            serverSelectionTimeoutMS=8000,
        )
        client.admin.command("ping")
        db = client.get_database()
        print(f"✅ Connected to MongoDB: {db.name}\n")
        return db
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        sys.exit(1)


def prompt_expertise():
    """Interactively prompt to select expertise areas."""
    print("Available expertise areas:")
    for i, skill in enumerate(AVAILABLE_EXPERTISE, 1):
        print(f"  {i:2d}. {skill}")
    print()

    while True:
        raw = input("Enter expertise numbers (comma-separated, e.g. 1,3): ").strip()
        try:
            indices = [int(x.strip()) for x in raw.split(",") if x.strip()]
            skills = []
            for idx in indices:
                if 1 <= idx <= len(AVAILABLE_EXPERTISE):
                    skills.append(AVAILABLE_EXPERTISE[idx - 1])
                else:
                    print(f"  ⚠  Skipping invalid number: {idx}")
            if skills:
                return skills
            else:
                print("  No valid skills selected. Please try again.\n")
        except ValueError:
            print("  Invalid input. Please enter numbers separated by commas.\n")


def prompt_department():
    """Interactively prompt to select department."""
    print("Available departments:")
    for i, dept in enumerate(DEPARTMENTS, 1):
        print(f"  {i:2d}. {dept}")
    print()
    
    while True:
        raw = input("Enter department number (or type custom department name): ").strip()
        try:
            idx = int(raw)
            if 1 <= idx <= len(DEPARTMENTS):
                return DEPARTMENTS[idx - 1]
            else:
                print("  Invalid number. Please try again.\n")
        except ValueError:
            if raw:
                return raw
            print("  Please enter a number or department name.\n")


def get_next_agent_id(db):
    """Generate next agent ID in the format 'agent1', 'agent2', etc."""
    existing = list(db.agents.find({}, {"id": 1}))
    existing_ids = [a.get("id", "") for a in existing if a.get("id", "").startswith("agent")]
    max_num = 0
    for aid in existing_ids:
        try:
            num = int(aid.replace("agent", ""))
            max_num = max(max_num, num)
        except Exception:
            pass
    return f"agent{max_num + 1}"


def add_worker():
    """Main function to collect worker details and insert into DB."""
    print("=" * 55)
    print("  GrievAI — Add New Worker / Agent")
    print("=" * 55)
    print()

    db = connect_db()

    # ── Collect worker details ──────────────────────────────────────────────────
    name = input("Full Name: ").strip()
    if not name:
        print("❌ Name cannot be empty.")
        sys.exit(1)

    email = input("Email Address: ").strip().lower()
    if not email or "@" not in email:
        print("❌ Invalid email address.")
        sys.exit(1)

    # Check if user already exists in users collection
    existing_user = db.users.find_one({"email": email})
    
    print()
    expertise = prompt_expertise()
    print()
    department = prompt_department()
    print()

    expertise_level = None
    while expertise_level is None:
        try:
            expertise_level = int(input("Expertise Level (1-5, where 5 is expert): ").strip())
            if not (1 <= expertise_level <= 5):
                print("  Please enter a number between 1 and 5.")
                expertise_level = None
        except ValueError:
            print("  Invalid input. Please enter a number.")

    initial_workload = 0
    try:
        wl = input("Current Workload (number of active tickets, default 0): ").strip()
        if wl:
            initial_workload = int(wl)
    except ValueError:
        initial_workload = 0

    available = True
    avail_input = input("Available for new assignments? (y/n, default y): ").strip().lower()
    if avail_input == 'n':
        available = False

    # ── Password (only needed if creating new login) ────────────────────────────
    user_id = None
    if existing_user:
        print(f"\n⚠  User '{existing_user.get('name', email)}' already exists.")
        role_update = input("Update this user to worker role? (y/n): ").strip().lower()
        if role_update == "y":
            db.users.update_one(
                {"email": email},
                {"$set": {
                    "is_worker": True,
                    "role": "worker",
                    "skills": expertise,
                    "department": department,
                    "updatedAt": datetime.utcnow(),
                }}
            )
            user_id = existing_user["_id"]
            print(f"✅ Updated existing user to worker role.")
        else:
            print("Skipping user update.")
            user_id = existing_user["_id"]
    else:
        print()
        password = getpass.getpass("Password for login (min 6 chars): ")
        if len(password) < 6:
            print("❌ Password must be at least 6 characters long.")
            sys.exit(1)
        password_confirm = getpass.getpass("Confirm Password: ")
        if password != password_confirm:
            print("❌ Passwords do not match.")
            sys.exit(1)

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        user_doc = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "is_admin": False,
            "is_worker": True,
            "role": "worker",
            "skills": expertise,
            "department": department,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "is_active": True,
        }
        result = db.users.insert_one(user_doc)
        user_id = result.inserted_id
        print(f"\n✅ Created new user account.")

    # ── Insert into agents collection (same schema as existing agents) ──────────
    agent_id = get_next_agent_id(db)
    
    # Check if agent already exists by email
    existing_agent = db.agents.find_one({"email": email})
    if existing_agent:
        print(f"\n⚠  Agent with email '{email}' already exists in agents collection.")
        db.agents.update_one(
            {"email": email},
            {"$set": {
                "name": name,
                "expertise": expertise,
                "expertiseLevel": expertise_level,
                "available": available,
                "currentWorkload": initial_workload,
                "department": department,
                "user_id": str(user_id)
            }}
        )
        print(f"✅ Updated existing agent record.")
    else:
        agent_doc = {
            "id": agent_id,           # e.g. "agent4" — matches existing schema
            "name": name,
            "email": email,
            "expertise": expertise,   # Array of strings e.g. ["hardware", "network"]
            "expertiseLevel": expertise_level,  # 1-5
            "available": available,
            "currentWorkload": initial_workload,
            "department": department,
            "user_id": str(user_id),  # Link to users collection
        }
        db.agents.insert_one(agent_doc)
        print(f"✅ Added to agents collection with ID: {agent_id}")

    print()
    print("=" * 55)
    print("✅ Worker added successfully!")
    print(f"   Name:            {name}")
    print(f"   Email:           {email}")
    print(f"   Expertise:       {', '.join(expertise)}")
    print(f"   Expertise Level: {expertise_level}/5")
    print(f"   Department:      {department}")
    print(f"   Agent ID:        {agent_id}")
    print(f"   Available:       {'Yes' if available else 'No'}")
    print("=" * 55)
    print()
    print("The worker can now:")
    print("  1. Log in at /login with their email and password")
    print("  2. Be assigned tasks by admins in the Admin Dashboard")
    print("  3. Claim and resolve tickets from the Worker Dashboard")
    print()
    print("Admin can assign tickets to this worker from:")
    print("  Admin Dashboard → Manage → Assign to Worker dropdown")


if __name__ == "__main__":
    try:
        add_worker()
    except KeyboardInterrupt:
        print("\n\nAborted by user.")
        sys.exit(0)
