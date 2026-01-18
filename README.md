# 🫖 Tea Management System

نظام SaaS متعدد المستأجرين (Multi-tenant) لإدارة طلبات الشاي والمشروبات في الشركات.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

## 📋 المحتويات

- [نظرة عامة](#-نظرة-عامة)
- [المميزات](#-المميزات)
- [التقنيات المستخدمة](#-التقنيات-المستخدمة)
- [البنية المعمارية](#-البنية-المعمارية)
- [التثبيت والإعداد](#-التثبيت-والإعداد)
- [الاستخدام](#-الاستخدام)
- [API Documentation](#-api-documentation)
- [الأمان](#-الأمان)
- [الإطلاق في Production](#-الإطلاق-في-production)
- [Troubleshooting](#-troubleshooting)

## 🎯 نظرة عامة

Tea Management System هو حل متكامل لإدارة طلبات المشروبات في الشركات. يدعم النظام:

- **Multi-tenancy**: كل شركة لها بيانات منفصلة ومعزولة تماماً
- **Real-time Updates**: تحديثات فورية عبر Socket.IO بدون polling
- **Role-based Access**: أدوار مختلفة (Super Admin, Admin, Tea Boy, Room Access)
- **Meeting Room Interface**: واجهة بسيطة للطلب من غرف الاجتماعات بدون login

## ✨ المميزات

### 1. Database (Docker)
```bash
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm start
```

### 3. Frontend Apps

Build all apps:
```bash
# Super Admin
cd frontend/super-admin-web
npm install
npm run build

# Admin
cd ../admin-web
npm install
npm run build

# Tea Boy
cd ../tea-boy-web
npm install
npm run build

# Meeting Room
cd ../meeting-room-web
npm install
npm run build
```

## Environment Variables

Edit `backend/.env` with your production values:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Change to a secure random key
- `EMAIL_*`: Email service credentials
- `CORS_ORIGIN`: Your frontend domains
- `FRONTEND_URL`: Super admin frontend URL

## Deployment

1. Upload entire project to server via FileZilla
2. SSH into server
3. Start Docker: `docker-compose up -d`
4. Run backend setup commands
5. Copy built frontend files to web server
6. Configure Nginx/Apache with reverse proxy

## Production URLs to Update

### Backend (.env):
- `DATABASE_URL`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `APP_URL`

### Frontend (each app needs API URL update):
Look for `localhost:4000` in these files:
- `frontend/*/src/**/*.jsx`
- `frontend/*/src/**/*.js`

Replace with your production API URL.

## Default Access

**Super Admin:**
- Create via backend script or directly in database

**Admin/Tea Boy:**
- Created by admin
- Activation via email link

**Meeting Room:**
- Access via room code (created by admin)

## Tech Stack

- Backend: Node.js + Express + Prisma
- Database: PostgreSQL (Docker)
- Frontend: React + Vite + TailwindCSS
- Real-time: Socket.IO
