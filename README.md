# Task Verification System

A full-stack application built for creating, assigning, tracking, and verifying tasks between Administrators and Employees. This system includes features for automated task assignment (based on workload), proof of work uploads, dynamic input fields, and leave management.

## Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, Axios, Lucide React
*   **Backend:** FastAPI, Python, Motor (Async MongoDB), Pydantic
*   **Database:** MongoDB

## Core Features

*   **Role-Based Access:** Distinct `Admin` and `Employee` dashboards.
*   **Task Management:** Admins can assign tasks manually or let the system automatically assign tasks to the least busy employee.
*   **Proof of Work:** Employees can upload images and provide dynamic form inputs to submit tasks for review.
*   **Leave Management:** Employees can request leaves, and Admins can approve or reject them. Employees receive real-time notifications for leave status updates.
*   **Profile Settings:** Users can dynamically update their profile details and passwords, with real-time UI synchronization.
*   **Analytics:** Admins have access to high-level metrics for pending, completed, and rejected tasks.

## Getting Started

### Prerequisites
*   Node.js & npm
*   Python 3.9+
*   MongoDB (Running locally on default port `27017`)

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Ensure your local MongoDB server (`mongod.exe`) is running.
4.  Start the FastAPI server:
    ```bash
    python -m uvicorn app.main:app --reload
    ```
    The backend will run on `http://localhost:8000`.

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    The frontend will run on `http://localhost:5173/`.

## API Documentation
Once the backend is running, you can view the interactive Swagger API documentation by navigating to:
*   `http://localhost:8000/docs`
