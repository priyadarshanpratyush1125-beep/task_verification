import requests

BASE_URL = "http://localhost:8000/api"

users = [
    {"name": "Admin User", "email": "admin@example.com", "password": "password", "role": "admin"},
    {"name": "Employee One", "email": "emp1@example.com", "password": "password", "role": "employee"},
    {"name": "Employee Two", "email": "emp2@example.com", "password": "password", "role": "employee"}
]

print("Registering users...")
for u in users:
    r = requests.post(f"{BASE_URL}/auth/register", json=u)
    if r.status_code == 201:
        print(f"Registered {u['email']}")
    else:
        print(f"Failed to register {u['email']} (might already exist):", r.text)

print("\nLogging in as admin...")
r = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@example.com", "password": "password"})
admin_token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {admin_token}"}

print("\nFetching employees to assign tasks...")
r = requests.get(f"{BASE_URL}/users/employees", headers=headers)
employees = r.json()

if not employees:
    print("No employees found.")
else:
    emp1_id = next((e["id"] for e in employees if e["email"] == "emp1@example.com"), employees[0]["id"])
    emp2_id = next((e["id"] for e in employees if e["email"] == "emp2@example.com"), employees[0]["id"] if len(employees) == 1 else employees[1]["id"])

    tasks = [
        {
            "title": "Review Onboarding Documents",
            "description": "Please review the new employee handbook and sign the acknowledgement form.",
            "assigned_to": emp1_id,
            "deadline": "2026-12-31T23:59:59Z",
            "priority": "High",
            "department": "HR"
        },
        {
            "title": "Setup Development Environment",
            "description": "Install required IDEs, Docker, and clone the repository.",
            "assigned_to": emp1_id,
            "deadline": "2026-12-31T23:59:59Z",
            "priority": "Medium",
            "department": "Engineering"
        },
        {
            "title": "Client Meeting Preparation",
            "description": "Prepare the slide deck for the Q3 kickoff meeting.",
            "assigned_to": emp2_id,
            "deadline": "2026-12-31T23:59:59Z",
            "priority": "High",
            "department": "Sales"
        }
    ]

    print("\nCreating tasks...")
    for t in tasks:
        r = requests.post(f"{BASE_URL}/tasks/", json=t, headers=headers)
        if r.status_code == 201:
            print(f"Created task: {t['title']}")
        else:
            print(f"Failed to create task {t['title']}:", r.text)

print("\nSeeding complete!")
