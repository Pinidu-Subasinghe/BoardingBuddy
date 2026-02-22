# 🏠 BoardingBuddy  
### Smart Boarding & Accommodation Finder for University Students

BoardingBuddy is a web application that helps university students find verified boarding houses near their campus.  
It connects students with boarding owners, allows visit scheduling, and ensures listings are approved by an admin for safety and reliability.

---

## 📌 Project Objectives

- Help students find safe and nearby boarding places  
- Provide verified listings through admin approval  
- Allow visit scheduling before staying  
- Manage boarding capacity automatically  
- Maintain reviews and feedback system  
- Provide role-based access control  

---

## 👥 Stakeholders

- **Students** – search and book visits  
- **Boarding Owners** – list and manage properties  
- **Admin** – approve users & properties  
- **Inspector (optional)** – verify properties  

---

## 🔑 Core Features

### 👤 User Management
- Public registration (Student / Owner)
- Admin approval required before login
- Role-based access system
- Admin can create inspectors and admins

### 🏡 Property Management (CRUD)
- Owners create boarding listings
- Admin approves listings
- Optional inspector verification
- Capacity tracking (beds/rooms)
- Status: Pending → Active → Full → Inactive

### 📅 Visit Booking System (CRUD)
- Students request visit date/time
- Owners approve/reject/reschedule
- After visit → student marks interested/not interested
- If interested → capacity reduces automatically

### ⭐ Review System (CRUD)
- Students can review after visiting/staying
- Ratings and comments
- Owners can reply
- Admin moderation

### 🔔 Notifications
- Account approval alerts
- Booking updates
- Property approval updates

---

## 🧠 System Workflow Summary

1. User registers → Admin approves  
2. Owner creates property → Admin approves  
3. Student requests visit → Owner approves  
4. Visit happens → Student selects interested  
5. Capacity reduces automatically  
6. When capacity = 0 → Property marked **Full**

---

## 🛠️ Tech Stack

**Frontend**
- React (Create React App)
- Tailwind CSS

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB

**Tools**
- GitHub
- Postman
- Cloudinary

---

## 🗄️ Database Tables

- users  
- properties  
- property_images  
- inspections  
- bookings  
- reviews  
- notifications  

---

## 🚀 Stay Tuned