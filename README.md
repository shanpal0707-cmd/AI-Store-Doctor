# 🩺 AI Store Doctor

**AI-powered business assistant for smarter retail decisions**

AI Store Doctor is a smart retail business assistant that helps store owners understand their product performance, identify products that need attention, discover business opportunities, and create marketing content using AI.

---

## 🚀 Features

### 🏪 Store Setup

Set up your store by providing:

* Store name
* Business type
* Store size
* Primary business goal

### 📦 Product Management

Add and manage product information including:

* Product name
* Category
* Cost price
* Selling price
* Stock quantity
* Units sold
* Sales period

The application automatically calculates useful product performance indicators.

### 🩺 Product Doctor

AI-powered product analysis that helps identify:

* Healthy products
* Products needing attention
* Critical products
* Sales performance
* Profitability
* Inventory risks
* Recommended actions

### 📊 Business / Market Analysis

Analyze the overall product portfolio and receive AI-powered business insights, including:

* Market opportunities
* Demand signals
* Pricing opportunities
* Category opportunities
* Business recommendations

### ✍️ AI Content Creator

Generate ready-to-use marketing content for products.

Supported content types:

* Instagram Caption
* Facebook Post
* Product Description
* WhatsApp Promotion
* Advertisement

Available tones:

* Friendly
* Professional
* Creative
* Luxury
* Urgent

Marketing goals include:

* Increase Sales
* Clear Inventory
* Launch Product
* Build Brand Awareness
* Promote Offer

AI can also generate:

* Headlines
* Calls to action
* Marketing tips
* Suggested hashtags

---

## 🤖 AI Integration

AI Store Doctor uses **Google Gemini API** for intelligent product analysis, business insights, and marketing content generation.

The backend includes a centralized Gemini service with robust JSON response handling for reliable AI responses.

> **Important:** Never commit your Gemini API key to GitHub or expose it in frontend code.

---

## 🛠️ Tech Stack

### Frontend

* Angular
* TypeScript
* HTML
* CSS

### Backend

* Node.js
* Express.js
* REST APIs

### AI

* Google Gemini API

### Data

* Product and store data persistence
* Local storage fallback where applicable

---

## 📁 Project Structure

```text
AiStoreDoctor/
│
├── src/
│   └── app/
│       ├── dashboard/
│       ├── products/
│       ├── store-setup/
│       ├── ai-content-creator/
│       └── services/
│
├── server/
│   ├── routes/
│   │   ├── analyze.js
│   │   ├── content.js
│   │   └── market.js
│   │
│   ├── services/
│   │   └── gemini.service.js
│   │
│   └── package.json
│
├── package.json
├── angular.json
└── README.md
```

---

## ⚙️ Installation

### 1. Clone or download the project

```bash
git clone <your-repository-url>
cd AiStoreDoctor
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure Gemini API

Create a `.env` file inside the `server` folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Do not share or commit this file.**

---

## ▶️ Run the Application

### Start the backend

From the `server` folder:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:3000
```

### Start the Angular frontend

Open another terminal in the project root:

```bash
ng serve
```

Then open:

```text
http://localhost:4200/
```

---

## 🔄 Application Flow

```text
Store Setup
     ↓
Add Products
     ↓
Product Performance
     ↓
Product Doctor
     ↓
AI Business Analysis
     ↓
AI Content Creator
     ↓
Marketing-ready Content
```

---

## 🎯 Problem Solved

Small retailers often have product data but lack the time, tools, or expertise to understand what that data means.

AI Store Doctor converts basic store and product information into practical business intelligence.

Instead of simply showing numbers, the application helps answer questions such as:

* Which products are performing well?
* Which products need attention?
* Is inventory becoming a risk?
* Are products priced effectively?
* Where are the business opportunities?
* What should the store owner do next?
* How can a product be promoted effectively?

---

## 💡 Why AI Store Doctor?

AI Store Doctor brings multiple business tasks into one simple platform:

**Analyze → Understand → Recommend → Act**

It combines product intelligence, business analysis, and AI-powered marketing content creation to help retailers make faster and smarter decisions.

---

## 🔐 Security

API credentials should always remain on the backend.

Never add your Gemini API key directly to Angular frontend files or commit `.env` files to a public repository.

Recommended:

```text
server/.env
```

Add `.env` to `.gitignore`.

---

## 🧪 Build & Verification

To check the Angular TypeScript project:

```bash
npx tsc --noEmit --project tsconfig.app.json
```

To create an Angular build:

```bash
ng build
```

---

## 📌 Project Status

**Core application: Complete and tested**

Implemented modules:

* ✅ Store Setup
* ✅ Dashboard
* ✅ Product Management
* ✅ Product Doctor
* ✅ Business / Market Analysis
* ✅ AI Content Creator
* ✅ Gemini AI Integration
* ✅ Product persistence
* ✅ AI response handling

---

## 👩‍💻 Project

**AI Store Doctor**

An AI-powered retail business assistant designed to help small retailers make smarter, data-driven decisions.
