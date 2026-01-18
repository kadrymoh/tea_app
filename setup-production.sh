#!/bin/bash

# ===========================================
# Tea Management System - Production Setup
# ===========================================

echo "🫖 Tea Management System - Production Setup"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update API URLs
echo -e "${BLUE}📝 Step 1: Updating API URLs in all files...${NC}"
node update-api-urls.js
echo -e "${GREEN}✅ API URLs updated${NC}"
echo ""

# Step 2: Setup Environment Files
echo -e "${BLUE}📝 Step 2: Setting up environment files...${NC}"

# Super Admin
if [ ! -f "frontend/super-admin-web/.env" ]; then
    cp frontend/super-admin-web/.env.example frontend/super-admin-web/.env
    echo -e "${GREEN}✅ Created frontend/super-admin-web/.env${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/super-admin-web/.env already exists, skipping${NC}"
fi

# Admin
if [ ! -f "frontend/admin-web/.env" ]; then
    cp frontend/admin-web/.env.example frontend/admin-web/.env
    echo -e "${GREEN}✅ Created frontend/admin-web/.env${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/admin-web/.env already exists, skipping${NC}"
fi

# Tea Boy
if [ ! -f "frontend/tea-boy-web/.env" ]; then
    cp frontend/tea-boy-web/.env.example frontend/tea-boy-web/.env
    echo -e "${GREEN}✅ Created frontend/tea-boy-web/.env${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/tea-boy-web/.env already exists, skipping${NC}"
fi

# Meeting Room
if [ ! -f "frontend/meeting-room-web/.env" ]; then
    cp frontend/meeting-room-web/.env.example frontend/meeting-room-web/.env
    echo -e "${GREEN}✅ Created frontend/meeting-room-web/.env${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/meeting-room-web/.env already exists, skipping${NC}"
fi

echo ""

# Step 3: Build Frontend Apps
echo -e "${BLUE}📝 Step 3: Building frontend applications...${NC}"

# Super Admin
echo -e "${BLUE}Building Super Admin...${NC}"
cd frontend/super-admin-web
npm install --production
npm run build
cd ../..
echo -e "${GREEN}✅ Super Admin built${NC}"

# Admin
echo -e "${BLUE}Building Admin Panel...${NC}"
cd frontend/admin-web
npm install --production
npm run build
cd ../..
echo -e "${GREEN}✅ Admin Panel built${NC}"

# Tea Boy
echo -e "${BLUE}Building Tea Boy Dashboard...${NC}"
cd frontend/tea-boy-web
npm install --production
npm run build
cd ../..
echo -e "${GREEN}✅ Tea Boy Dashboard built${NC}"

# Meeting Room
echo -e "${BLUE}Building Meeting Room Interface...${NC}"
cd frontend/meeting-room-web
npm install --production
npm run build
cd ../..
echo -e "${GREEN}✅ Meeting Room Interface built${NC}"

echo ""

# Summary
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✨ Production setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "📦 Built files are located in:"
echo "  - frontend/super-admin-web/dist/"
echo "  - frontend/admin-web/dist/"
echo "  - frontend/tea-boy-web/dist/"
echo "  - frontend/meeting-room-web/dist/"
echo "  - frontend/landing-page/index.html"
echo ""
echo "🚀 Next steps:"
echo "  1. Upload entire project to server"
echo "  2. Follow DEPLOYMENT_GUIDE.md on server"
echo "  3. Configure Nginx"
echo "  4. Setup SSL with Certbot"
echo "  5. Launch! 🎉"
echo ""
