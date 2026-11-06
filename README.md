# 🥬 ORGANIGO – Online Grocery Store

**Fresh Groceries, Delivered with Care!**

ORGANIGO is a modern and responsive online grocery shopping website built using React.js and Vite. It provides customers with an easy way to explore grocery products, add items to their cart, and place orders.

---

## 🚀 Project Overview

ORGANIGO is designed to make online grocery shopping simple and convenient.

Customers can browse fresh fruits, vegetables, dairy products, and other grocery items. The website also includes an Admin Panel to manage products and view customer orders.

## ✨ Features

### 🛒 Customer Features
- Modern and responsive homepage.
- Browse grocery products.
- Product categories.
- Add products to shopping cart.
- Increase and decrease product quantity.
- Remove products from cart.
- Automatic cart total calculation.
- Checkout page.
- Customer delivery information form.
- Current GPS location detection with permission.
- Address auto-fill when available.
- Cash on Delivery option.
- Order confirmation.

### 👨‍💻 Admin Features
- Admin Panel.
- Add new grocery products.
- Upload product images.
- Manage product details.
- View customer orders.
- View customer delivery information.
- View customer GPS location on Google Maps.
- Update order status.

## 💻 Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Website Structure |
| CSS3 | Styling and Responsive Design |
| JavaScript | Website Functionality |
| React.js | Frontend Development |
| Vite | Development Server |
| LocalStorage | Local Data Storage |
| Geolocation API | Customer Location |

## 📂 Project Structure

```text
organigo/
│
├── public/
│
├── src/
│   ├── components/
│   │
│   ├── context/
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Admin.jsx
│   │   ├── Cart.jsx
│   │   └── Checkout.jsx
│   │
│   ├── styles/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
```

## ⚙️ Installation & Setup

Follow these steps to run ORGANIGO on your computer.

### 1. Clone Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_LINK
```

### 2. Open Project Folder

```bash
cd organigo
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Open in Browser

Open the local URL displayed in your terminal.

Usually:

```text
http://localhost:5173/
```

## 📍 Location Feature

ORGANIGO uses the browser Geolocation API to capture the customer's current GPS coordinates after permission is granted.

The captured coordinates can be opened on Google Maps.

## 💳 Payment Information

Currently, Cash on Delivery is available as a demonstration option.

Online payment gateway integration is planned for a future version.

## 🔮 Future Improvements

- Node.js and Express.js Backend.
- MongoDB Database Integration.
- Secure Admin Authentication.
- Customer Registration and Login.
- Online Payment Gateway.
- Real-time Order Tracking.
- Delivery Management System.
- Android Application using React Native.

## 📱 Responsive Design

ORGANIGO is designed to work on:

- Desktop Computers
- Laptops
- Tablets
- Mobile Phones

## 👨‍💻 Developer

**Paramjeet Mahato**

Project: ORGANIGO – Online Grocery Store

Technologies: React.js | JavaScript | HTML | CSS

---

⭐ If you like this project, consider giving it a star on GitHub!

**ORGANIGO – Freshness Delivered to Your Doorstep.**