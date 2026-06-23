import requests

def test():
    # login as admin to create task
    # or just login as employee and fetch tasks
    res = requests.post("http://localhost:8000/api/auth/login", data={"username": "emp1@example.com", "password": "password"})
    print("Login:", res.status_code, res.text)
    token = res.json()["access_token"]
    
    res = requests.get("http://localhost:8000/api/tasks/employee", headers={"Authorization": f"Bearer {token}"})
    print("Tasks:", res.status_code, res.text)

test()
