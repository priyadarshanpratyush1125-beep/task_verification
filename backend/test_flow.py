import requests

def test_flow():
    # Login as admin
    res = requests.post("http://localhost:8000/api/auth/login", data={"username": "admin@example.com", "password": "password"})
    admin_token = res.json()["access_token"]
    
    # Get employees
    res = requests.get("http://localhost:8000/api/users/employees", headers={"Authorization": f"Bearer {admin_token}"})
    employees = res.json()
    emp_id = employees[0]["id"]
    
    # Create task
    task_data = {
        "title": "Test Task",
        "description": "Test Desc",
        "assigned_to": emp_id,
        "department": "Maintenance",
        "priority": "High"
    }
    res = requests.post("http://localhost:8000/api/tasks/", json=task_data, headers={"Authorization": f"Bearer {admin_token}"})
    print("Create task:", res.status_code, res.text)
    
    # Login as employee
    emp_email = employees[0]["email"]
    res = requests.post("http://localhost:8000/api/auth/login", data={"username": emp_email, "password": "password"})
    emp_token = res.json()["access_token"]
    
    # Fetch tasks
    res = requests.get("http://localhost:8000/api/tasks/employee", headers={"Authorization": f"Bearer {emp_token}"})
    print("Employee tasks:", res.status_code, res.text)

if __name__ == "__main__":
    test_flow()
