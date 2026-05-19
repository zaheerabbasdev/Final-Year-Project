# Kaarkun Backend

Node.js + Express + MySQL API for the Kaarkun marketplace.

## Prerequisites
- Node.js installed
- MySQL Server running
- A database named `kaarkun_db` created

## Setup
1. `cd backend`
2. `npm install`
3. Configure `.env` with your DB credentials
4. Run `mysql -u your_user -p kaarkun_db < schema.sql` to setup tables
5. `npm run dev` to start the server on port 5000

## Features
- JWT Authentication (Register/Login)
- Role-based Access (Customer/Provider/Admin)
- Job Posting with Multi-image Upload
- Bidding System (Place/Compare/Accept Bids)
- Profile Management with Avatar Upload
- Service Categories
- Admin Stats
