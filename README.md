# Kaarkun: A Comprehensive Job Marketplace Platform

Kaarkun is a full-stack, multi-platform solution designed to bridge the gap between skilled service providers and customers in need of professional assistance. Whether it's plumbing, electrical work, or general cleaning, Kaarkun provides a seamless ecosystem for posting jobs, bidding, and managing bookings.

## 🚀 Project Overview

This project consists of three primary components:
1.  **Mobile Application**: A cross-platform Flutter app catering to both Customers and Service Providers.
2.  **Admin Dashboard**: A modern Next.js web portal for administrative oversight and system management.
3.  **Backend API**: A robust Node.js/Express server handling data persistence, authentication, and business logic.

---

## 🛠️ Technology Stack

### Mobile (Flutter)
- **Framework**: [Flutter](https://flutter.dev/) (Dart)
- **State Management**: [Provider](https://pub.dev/packages/provider)
- **Navigation**: [GoRouter](https://pub.dev/packages/go_router)
- **Networking**: [Dio](https://pub.dev/packages/dio)
- **Maps & Location**: [Google Maps Flutter](https://pub.dev/packages/google_maps_flutter), [Geolocator](https://pub.dev/packages/geolocator)
- **UI/UX**: Google Fonts, Flutter SVG, Image Picker

### Admin Panel (Web)
- **Framework**: [Next.js 15+](https://nextjs.org/) (React 19)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MySQL](https://www.mysql.com/)
- **Authentication**: JWT (JSON Web Tokens) with Refresh Token rotation
- **Security**: Password hashing, OTP-based verification

---

## ✨ Key Features

### 👤 Customer Features
- **Job Posting**: Describe tasks, set budgets, and attach images.
- **Location Awareness**: Pinpoint job locations using Google Maps.
- **Bid Management**: Review competitive bids from verified providers and hire the best fit.
- **Review System**: Rate and review providers after job completion to ensure quality.
- **Secure Auth**: OTP-verified signup and secure login.

### 🛠️ Service Provider Features
- **Professional Profiles**: Highlight experience, skills, and upload certifications.
- **Smart Bidding**: Browse open jobs in nearby areas and place competitive bids.
- **Booking Management**: Track active jobs, completed tasks, and upcoming schedules.
- **Identity Verification**: Securely upload CNIC and certificates for admin approval.

### 🛡️ Admin Features
- **User Management**: Monitor and manage both customer and provider accounts.
- **Provider Verification**: Review and approve/reject provider credentials.
- **Job Oversight**: Track system-wide job statuses and resolve disputes.
- **Category Management**: Dynamically update service categories (Plumber, Electrician, etc.).
- **Analytics Dashboard**: View platform growth and activity metrics.

---

## 📂 Project Structure

```text
├── admin/               # Next.js Admin Dashboard
├── backend/             # Node.js/Express API & MySQL Schema
├── mobile/              # Flutter Mobile Application (Shared)
├── Customer/            # UI Mockups & Assets for Customer App
├── Service Provider/    # UI Mockups & Assets for Provider App
└── root/                # Project documentation and shared assets
```

---

## ⚙️ Getting Started

### Prerequisites
- Flutter SDK (`^3.10.1`)
- Node.js & npm
- MySQL Server

### Backend Setup
1. Navigate to `/backend`.
2. Install dependencies: `npm install`.
3. Configure your `.env` file (Database credentials, JWT secrets).
4. Import `schema.sql` into your MySQL database.
5. Start the server: `npm start`.

### Admin Setup
1. Navigate to `/admin`.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

### Mobile Setup
1. Navigate to `/mobile`.
2. Get packages: `flutter pub get`.
3. Configure `.env` for API base URL.
4. Run the app: `flutter run`.

---

## 📄 License

This project was developed as a **Final Year Project**. All rights reserved.

---

## 👥 Contributors
- **Zaheer Abbas** - Lead Developer

---
*Created with ❤️ by the Kaarkun Team.*
