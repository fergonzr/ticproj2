# **SIEE Emergency App \- Setup & Run Guide**

## **Prerequisites**

Before starting, make sure you have:

* Node.js (v16 or newer) \- Download from [nodejs.org](https://nodejs.org/)  
* Expo Go app on your iPhone \- Available on the App Store  
* Git (optional, for cloning) \- Download from [git-scm.com](https://git-scm.com/)  
* WebStorm or any code editor

## **Installation Steps**

### **1\. Clone or Download the Project**

Option A: Clone with Git

`bash`

`git clone https://github.com/YOUR_USERNAME/ticproj2.git`

`cd ticproj2/front`

Option B: If you already have the files

`bash`

`cd C:\Users\USER\WebstormProjects\front`

### **2\. Install Dependencies**

`bash`

*`# Install all required packages`*  
`npm install`

*`# Install navigation dependencies`*  
`npm install @react-navigation/native @react-navigation/stack`  
`npx expo install react-native-screens react-native-safe-area-context`

`npx expo install react-native-gesture-handler`

### **3\. Verify Folder Structure**

Make sure your project looks like this:

`text`

`front/`  
`├── src/`  
`│   └── presentation/`  
`│       ├── screens/`  
`│       │   ├── LoginScreen.tsx`  
`│       │   └── HomeScreen.tsx`  
`│       ├── components/`  
`│       │   └── WelcomeSection.tsx`  
`│       ├── navigation/`  
`│       │   └── AppNavigator.tsx`  
`│       └── types/`  
`│           └── navigation.types.ts`  
`├── App.tsx`  
`├── app.json`

`└── package.json`

## **Running the App**

### **1\. Start the Development Server**

`bash`

`npx expo start`

You should see output like:

`text`

`Starting project at C:\Users\USER\WebstormProjects\front`  
`Starting Metro Bundler`

`Metro waiting on exp://192.168.x.x:8081`

### **2\. Connect Your iPhone**

Make sure your Windows PC and iPhone are on the SAME WiFi network

Option A: Scan QR Code (Easiest)

* Open the Camera app on your iPhone  
* Point it at the QR code in the terminal  
* Tap the notification "Open in Expo Go"

Option B: Enter URL Manually

* Look for a line in terminal: `Metro waiting on exp://192.168.x.x:8081`  
* Open Expo Go on iPhone  
* Tap "Enter URL manually"  
* Type exactly: `exp://192.168.x.x:8081` (use YOUR IP address)  
* Tap "Connect"

### **3\. If QR Code Doesn't Appear**

Try the tunnel mode (works across different networks):

`bash`

`npx expo start --tunnel`

This uses ngrok and will give you a public URL that works anywhere.

## **Testing the App**

Once connected, you should see:

1. Login Screen with:  
   * SIEE logo  
   * Email and password fields  
   * "Iniciar Sesión" button  
   * Hamburger menu (top-right)  
2. Try these actions:  
   * Enter any email/password and tap Login to go to Home screen  
   * Tap hamburger menu to go to Settings  
   * Tap "Test Emergency" button to go to Emergency screen

## **Available Screens**

| Screen | How to Access |
| :---- | :---- |
| Login | App starts here |
| Home/Dashboard | Login with any credentials |
| Emergency | Tap "Test Emergency" on Login or SOS button on Home |
| Vehicle Status | Tap "Vehicle Status" on Home |
| Settings | Tap hamburger menu on Login or Settings on Home |

## **Development Workflow**

1. Edit code in WebStorm  
2. Save the file (Ctrl+S)  
3. See changes instantly on your iPhone (hot reload)

## **Common Issues & Fixes**

### **"Connection timeout"**

* Make sure phone and computer are on same WiFi  
* Try: `npx expo start --tunnel`

### **"Metro bundler not starting"**

`bash`

*`# Clear cache and restart`*

`npx expo start -c`

### **"Module not found" errors**

`bash`

*`# Reinstall dependencies`*  
`rm -rf node_modules`

`npm install`

### **QR code too small or blurry**

* Make terminal font smaller (Ctrl \+ mouse wheel)  
* Take a photo and zoom in  
* Use URL method instead

## **Sharing with Friends**

### **To push changes to GitHub:**

`bash`

`git add .`  
`git commit -m "Description of changes"`

`git push origin front-end`

### **Friends can then:**

`bash`

`git clone https://github.com/YOUR_USERNAME/ticproj2.git`  
`cd ticproj2/front`  
`npm install`

`npx expo start`

## **Quick Commands Reference**

| Command | What it does |
| :---- | :---- |
| npx expo start | Start the app (LAN mode) |
| npx expo start \--tunnel | Start with tunnel (works anywhere) |
| npx expo start \-c | Start with cleared cache |
| npm install | Install all dependencies |
| npm install \[package\] | Install a specific package |



