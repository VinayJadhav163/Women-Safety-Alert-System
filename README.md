# 🌸 Sisterhood Safety Alert System

A modern, responsive, and fully-functional emergency alert web application built specifically for women's safety. This system allows users to maintain a dedicated network of trusted contacts and trigger an immediate SOS alert that captures precise GPS coordinates, plays a distress sound, and dispatches automated emails containing Google Maps location data to their predefined safety circle.

---

## ✨ Features

- **Empowering Women-Centric UI**: A stunning, custom glassmorphism interface styled with soft rose gold, pink, and lavender gradients. Features dynamic CSS animations (such as the SOS pulse ring) and dark/light mode toggle.
- **Persistent Safety Network**: Built on a local `Node.js` + `SQLite` backend, ensuring emergency contacts are securely stored and rapidly retrieved.
- **One-Tap Emergency Alert**: Clicking the SOS button triggers a multi-step emergency protocol seamlessly.
- **Live Geolocation Tracking**: Uses the browser's native `navigator.geolocation` API to instantly lock onto precise Latitude & Longitude coordinates.
- **Automated Distress Dispatches**: Integrates with [EmailJS](https://www.emailjs.com/) to silently loop through your trusted network and dispatch real emails containing an auto-generated Google Maps URL of your current location.
- **Local Audio Fallbacks**: Plays an audible looping emergency alarm (`alarm.mp3`) to attract attention, alongside a JavaScript synthesized audio fallback mechanism in the event the file unloads.
- **Alert History Logs**: Securely saves the time and location data of every triggered SOS directly to the database.

---

## 🛠️ Technology Stack

**Frontend:**
- Semantic **HTML5**
- Custom Vanilla **CSS3** (Glassmorphism, Flexbox, Custom Variables, SVG Icons via Font Awesome)
- Modern Vanilla **JavaScript** (Fetch API, Async/Await, Web Audio API)

**Backend:**
- **Node.js**
- **Express.js** API Framework
- **SQLite3** Relational Database
- **CORS** 

**Third-Party Integrations:**
- **EmailJS SDK** for direct-from-client email routing without setting up heavy SMTP relays.

---

## 📁 Project Structure

```text
📦 Women Safety Alert System
 ┣ 📜 index.html         # The main Application View & UI layout
 ┣ 📜 style.css          # Core styling, animations, and dark mode themes
 ┣ 📜 script.js          # Client-side logic (Geolocation, EmailJS loops, DOM Manipulation)
 ┣ 📜 server.js          # Node.js Backend Server & REST API configuration
 ┣ 📜 package.json       # Node dependencies and project scripts
 ┣ 📜 alarm.mp3          # Emergency looping siren audio artifact
 ┗ 📜 database.sqlite    # Auto-generated SQLite Database (Contacts & Alert logs)
```

---

## 🚀 How to Run Locally

Because this application runs on a dedicated database to preserve your contacts, it requires starting the backend server before opening the page.

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### 2. Installation
Open your Command Prompt or Terminal, navigate (cd) into this project directory, and install the dependencies:
```bash
npm install
```

### 3. Start the Backend Server
Initialize the Express framework and SQLite connections by running:
```bash
node server.js
```
*You should see a message in the console indicating the database successfully connected on port 3000.*

### 4. Launch the App
Once the server is running, simply double-click the `index.html` file to open it in your favorite modern browser (Chrome, Edge, Firefox, Safari). 

---

## 🔧 Configuring EmailJS (Optional)
If you wish to configure the application to send emails to your own personal Gmail inbox:
1. Create a free account at [EmailJS.com](https://www.emailjs.com/).
2. Add a new **Email Service** (e.g. Gmail) and copy your *Service ID*.
3. Go to **Email Templates**, create a template with the variable `{{message}}` in the body, and copy your *Template ID*.
4. Grab your *Public Key* from the Account page.
5. In `index.html`, replace the key parameter inside `emailjs.init("...")`.
6. In `script.js` line 230, replace the parameters inside `emailjs.send("service_x", "template_x", ...)` with your new exact IDs.

---
*Designed & Developed by Akshayni Ashok Jagtap*
