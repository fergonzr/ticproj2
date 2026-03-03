# **SIEE App — Architecture & Decision  Making**

## **What is this document?**

This document explains the architectural decisions made during the development of the SIEE app. It is meant to help any developer — current or future — understand not just what the code does, but why it was structured the way it was. Every decision here was made with maintainability, scalability, and professionalism in mind.

## **Project Context**

SIEE is an emergency medical assistance app built for the Alcaldía de Envigado. It allows citizens to request emergency help, register their medical data, and submit PQRS reports. The app was built using React Native with Expo (bare workflow) and TypeScript, using React Navigation for routing and no third-party UI libraries — everything is built from scratch using plain React Native.

## **The Core Problem We Solved**

When developers start building mobile apps, the most common mistake is putting everything in one place — styles, logic, and UI all mixed together inside a single screen file. This works fine for small projects, but as the app grows it becomes a maintenance nightmare. Changing a color means searching through dozens of files. Reusing a button means copy-pasting code. Testing logic means untangling it from the UI first.

The architecture we chose solves all of this by enforcing a clear separation of concerns: every file has one job, and only one job.

## **Folder Structure & What Lives Where**

### `theme/`

This folder is the single source of truth for all visual values in the app. It contains three files: one for colors, one for typography, and one for spacing.

The colors file defines every color used in the app by name and purpose, not by value. Instead of writing the red hex code directly in a component, you reference it by its meaning — "primary color". This means if the brand color ever changes, you update it in exactly one place and it propagates everywhere automatically.

The typography file defines all font sizes and font weights used across the app. This ensures text is consistent everywhere and avoids situations where one screen uses size 14 and another uses size 13 for the same type of content.

The spacing file defines a scale of spacing values — from extra small to extra extra large. This keeps margins and paddings consistent across all screens, giving the app a visually coherent rhythm.

Decision: We chose to have a theme folder instead of defining these values inline because the app has 8+ screens that share the same visual language. Without a central theme, maintaining visual consistency is nearly impossible.

---

### `styles/`

This folder contains one styles file per component and per screen. Each styles file is exclusively responsible for the visual layout of its corresponding component or screen, and it always imports its values from the theme folder — never uses raw numbers or color strings directly.

The reason styles are separated from components is readability and maintainability. A component file should be easy to read as a UI structure, not cluttered with dozens of style definitions. When a designer asks to change the padding of a button, you go directly to the button's styles file — you don't have to scroll through JSX to find it.

Decision: We separated styles from components rather than keeping them in the same file because as the app grows, mixed files become harder to navigate. A developer looking at a component should see its structure, not its visual rules.

---

### `components/`

This folder contains reusable UI pieces that appear in more than one screen. A component only earns its place here if it is truly reusable — meaning it accepts props that allow it to adapt to different contexts without being rewritten.

The components we built are:

HamburgerHeader — the navigation menu icon that appears at the top right of every screen. It accepts an optional press handler so each screen can decide what happens when the user taps it.

SIEELogo — the circular logo with the ambulance image that appears on every screen. It accepts a size prop and a border color prop, so it can be rendered large on some screens and smaller on others without creating a new component each time.

AppInput — the styled text input used in all forms across the app, including login, registration, and PQRS. It accepts a label and all standard text input properties, so it works for email fields, password fields, and multiline message fields equally.

AppButton — the button used throughout the app. It accepts a variant prop that determines its visual style: outlined for secondary actions, filled for primary actions like registration, and cancel for destructive or dismissal actions. One component covers every button in the entire app.

Decision: We made components flexible through props rather than creating separate components for each variation. This keeps the codebase small and ensures visual consistency — all buttons behave the same way because they are literally the same component.

---

### `hooks/`

This folder contains reusable logic that is shared across screens. A hook is a JavaScript function that manages state, side effects, or business logic — but contains no visual elements whatsoever.

The planned hooks for this app are an authentication hook that manages login, logout, and token storage; an emergency hook that handles the three-second press detection, call status, and connection state; and a location hook that retrieves the user's GPS coordinates to be sent during an emergency request.

The reason logic lives in hooks and not inside screens is testability and reuse. If the login logic lives inside the LoginScreen component, you cannot test it without rendering the entire screen. If it lives in a hook, you can test it independently. Additionally, if two screens need the same logic, hooks allow sharing it without duplication.

Decision: We follow the principle that screens should be dumb — they only know how to display things. Hooks are smart — they know how things work. This separation makes both easier to understand and maintain.

---

### `screens/`

This folder contains one file per screen in the app. A screen file is responsible for one thing only: assembling components together and passing them the right props. Screens do not define styles, do not contain business logic, and do not hardcode any values.

A screen imports its components from the components folder, its styles from the styles folder, and its logic from the hooks folder. The result is a file that reads almost like plain English — you can look at a screen and immediately understand what it shows and what it does, without needing to understand how any of it is implemented.

Decision: Keeping screens as pure assembly points means that when something looks wrong visually, you look at styles. When something behaves wrong, you look at hooks. When a UI piece is broken, you look at components. The screen itself is rarely where the problem is, which makes debugging dramatically faster.

---

### `navigation/`

This folder contains the app's navigation configuration. It defines which screens exist, what they are called, and how to move between them. The navigation is set up with React Navigation's native stack, which provides native-feeling transitions on both iOS and Android.

We chose to hide the default navigation header on all screens because the app uses its own custom header — the HamburgerHeader component — which gives us full control over its appearance and behavior.

## **Safe Area Decision**

On iPhones, the screen has areas reserved for system UI elements like the battery indicator, signal strength, and time. Content that renders behind these elements is hidden or overlaps with them, which looks broken.

We solved this using the safe area insets hook, which gives us the exact pixel measurements of these reserved areas on any device. We then apply those measurements as padding to our screens so content always starts in the visible area. We chose the hook approach over the deprecated SafeAreaView component because it gives us more precise control and works correctly with our KeyboardAvoidingView setup.

---

## **The Six Rules**

Every file in this project follows six rules that keep the codebase professional and consistent:

The first rule is that no hardcoded values exist anywhere outside the theme folder. Every color, font size, and spacing value has a name and lives in theme.

The second rule is that no styles exist inside component or screen files. They always live in their dedicated styles file.

The third rule is that no business logic exists inside screens. Logic belongs in hooks.

The fourth rule is that no JSX or visual elements exist inside hooks. Hooks are pure logic.

The fifth rule is that a component only belongs in the components folder if it is used in more than one screen and accepts props to adapt to different contexts.

The sixth rule is that every file has exactly one responsibility. If you find yourself asking "should this go here or there?", the answer is to split it into two files.