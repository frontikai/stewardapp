# Stewardship Keeper - Codebase Analysis

## 1. Overview

**Stewardship Keeper** is a React Native mobile app built with Expo, designed to help Christians manage their financial stewardship -- specifically tithes and offerings. It provides donation tracking, optional income tracking with tithe calculations, recipient management, reporting/analytics, and scripture-based encouragement.

- **Framework**: React Native (Expo SDK 52)
- **UI Library**: React Native Paper (Material Design 3)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **Database**: expo-sqlite (local SQLite storage)
- **State Management**: React Context API
- **Language**: JavaScript (no TypeScript)
- **Platform targets**: Android (primary), iOS, Web (limited)

---

## 2. Architecture

### 2.1 High-Level Structure

```
App.js                          # Entry point: initializes DB, fonts, notifications, splash
src/
  context/AppContext.js          # Global state (settings) via React Context
  database/
    schema.js                    # Table definitions (donations, recipients, income, settings, reminders, categories)
    Database.js                  # ~607 lines, all CRUD operations via expo-sqlite
  navigation/AppNavigator.js     # Root navigator: Onboarding -> Auth -> MainTabs
  screens/                       # 7 screens
  components/                    # 9 reusable components
  theme/theme.js                 # Light + Dark theme definitions (Material Design 3)
  utils/                         # 6 utility modules
```

### 2.2 Data Flow

```
User Action -> Screen Component -> Database.js (SQLite) -> State Update -> Re-render
                                      |
                              AppContext (settings)
```

Settings are loaded from SQLite into `AppContext` on startup and shared across all screens. Each screen independently queries the database for its own data using `useFocusEffect` to refresh on tab focus.

### 2.3 Navigation Graph

```
Root Stack Navigator (headerless)
  |
  +-- OnboardingScreen           (shown if !hasOnboarded)
  +-- AuthScreen                 (shown if security enabled + not authenticated)
  +-- MainTabNavigator
        |
        +-- Home tab             -> HomeScreen
        +-- Giving tab           -> GivingScreen
        +-- Income tab           -> IncomeScreen
        +-- Reports tab          -> ReportsScreen
        +-- Settings tab         -> SettingsStackNavigator
                                      +-- SettingsMain -> SettingsScreen
                                      +-- Recipients   -> RecipientsScreen
```

---

## 3. Database Schema

Six tables defined in `src/database/schema.js`:

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `donations` | Tracks all giving records | amount, date, type, recipientId, notes, category |
| `recipients` | Churches, charities, individuals | name, category, notes, isDefault |
| `income` | Optional income records | amount, date, source, processed (boolean) |
| `settings` | Key-value configuration store | key, value |
| `reminders` | Scheduled notifications | title, type, frequency, day, hour, minute, enabled |
| `categories` | Donation/recipient categories | name, color, isSystem |

Default settings seeded on init: currency (USD), tithePercentage (10), incomeTrackingEnabled (true), notificationsEnabled (true), themeSetting (auto).

---

## 4. Screens

### HomeScreen
- Displays time-of-day greeting, welcome card, scripture card, and feature highlights
- Static/informational -- no live data from the database
- Uses `ScriptureCard` component for rotating Bible verses

### GivingScreen
- Lists donations from last 6 months, grouped by month
- Search bar + type filter chips (all/tithe/offering/charity)
- FAB opens `DonationForm` in a dialog
- Pull-to-refresh support

### IncomeScreen
- Lists income records from last 12 months with pending/processed filter
- Shows `PendingTitheCard` at top with calculated tithe amount
- "Mark as Tithed" dialog to process income entries
- Conditionally disabled when income tracking is off

### ReportsScreen
- Time period selector (month/quarter/year) via `SegmentedButtons`
- Giving goals with progress bars (hardcoded $500/month, $6000/year)
- `ChartGivingOverTime` (bar chart by day/week/month)
- `ChartGivingByRecipient` (horizontal bar chart with percentages)
- CSV export button

### SettingsScreen
- Tithe percentage input
- Income tracking toggle
- Currency selector (18 currencies)
- App security toggle (biometric/PIN via expo-local-authentication)
- Notifications toggle
- Navigates to RecipientsScreen

### RecipientsScreen
- CRUD for donation recipients
- Search by name/notes/type
- Types: Church, Charity, Missions, Individual, Organization, Other

### OnboardingScreen
- 5-page horizontal scroll wizard
- Configures income tracking and notification preferences
- Saves to AsyncStorage (`hasOnboarded`) and SQLite settings

---

## 5. Components

| Component | Purpose |
|-----------|---------|
| `DonationForm` | Form with amount, date picker, type menu, recipient menu, notes |
| `IncomeForm` | Form with amount, date, source, notes, tithe preview, "already tithed" toggle |
| `RecipientForm` | Form with name, type menu, notes; supports create + edit |
| `ScriptureCard` | Displays random verse from 10 hardcoded scriptures with refresh button |
| `SummaryCard` | Reusable card showing title + amount + icon (currently unused on HomeScreen) |
| `PendingTitheCard` | Shows pending tithe amount based on unprocessed income |
| `ProgressBar` | Custom progress bar (clamped 0-1) with configurable height/color |
| `ChartGivingOverTime` | Custom bar chart grouping donations by day/week/month |
| `ChartGivingByRecipient` | Horizontal bar chart showing giving distribution by recipient |

---

## 6. Utilities

| Module | Exports |
|--------|---------|
| `dateUtils.js` | `formatDate`, `formatDateReadable`, `getCurrentMonthStartEnd`, `getMonthStartEnd`, `getCurrentYearStartEnd`, `getWeekStartEnd`, `getCurrentQuarter`, `getGreeting` |
| `currencies.js` | `currencies` (18 currency objects), `getCurrencySymbol`, `formatCurrency` |
| `scriptures.js` | `getRandomScripture`, `getScriptureByReference`, `getAllScriptures`, `getScripturesByKeyword` |
| `exportData.js` | `exportToCSV`, `exportToJSON` (uses expo-file-system + expo-sharing) |
| `notifications.js` | `registerForPushNotifications`, `scheduleNotification`, `cancelAllNotifications` (uses expo-notifications) |
| `authentication.js` | `authenticateUser`, `setupPinSecurity`, `setupBiometricSecurity`, `checkBiometricHardware` (uses expo-local-authentication) |

---

## 7. Dependencies

### Runtime
- **expo** (^52.0.44) - Core framework
- **react** (^19.1.0) / **react-native** (^0.79.0) - UI runtime
- **react-native-paper** (^5.13.1) - Material Design 3 components
- **@react-navigation/native**, **stack**, **bottom-tabs** - Navigation
- **expo-sqlite** (^15.1.4) - Local database
- **@react-native-async-storage/async-storage** (^2.1.2) - Key-value storage
- **@react-native-community/datetimepicker** (^8.3.0) - Date picker
- **expo-notifications** (^0.29.14) - Push notifications
- **expo-local-authentication** (^15.0.2) - Biometric/PIN auth
- **expo-file-system** (^18.0.12) / **expo-sharing** (^13.0.1) - File export
- **expo-device** (^7.0.3) - Device detection
- **react-native-reanimated** (^3.17.3) - Animations
- **react-native-web** (^0.20.0) - Web support

### Dev/Build
- No dev dependencies listed
- No test framework configured
- No linter/formatter configured
- No CI/CD pipeline

---

## 8. Identified Issues and Risks

### 8.1 Missing Import in GivingScreen
`ScrollView` is used in the filter section of `GivingScreen` but is not imported from `react-native`. The import line only includes `View, StyleSheet, FlatList, RefreshControl`.

### 8.2 Schema Mismatch: Recipients
- The `schema.js` defines recipients with a `category` column
- `RecipientForm` sends/reads a `type` field
- `RecipientsScreen` filters on `recipient.type`
- `addRecipient` in `Database.js` inserts `recipient.category`
- This means the form's `type` value is being stored in the `category` column, which works but is semantically confusing and could lead to bugs

### 8.3 Deprecated SQLite API
The app uses `SQLite.openDatabase()` which is the legacy expo-sqlite API. Expo SDK 52 ships with a new synchronous API (`SQLite.openDatabaseSync()`). The current API may be removed in future SDK versions.

### 8.4 Web Platform Mock
The web SQLite mock in `Database.js` returns empty results for all queries. This means the app is non-functional on web -- all screens will show empty states.

### 8.5 Hardcoded Giving Goals
`ReportsScreen` uses hardcoded goals ($500/month, $6000/year) rather than user-configurable values stored in settings.

### 8.6 No Delete Functionality
- Donations cannot be deleted or edited after creation
- Income records cannot be deleted or edited
- Recipients can be edited but not deleted

### 8.7 No Test Infrastructure
- `package.json` has `"test": "echo \"Error: no test specified\" && exit 1"`
- No testing libraries (Jest, React Native Testing Library, etc.)
- No test files exist

### 8.8 No TypeScript
The entire codebase is JavaScript with no type checking, increasing the risk of runtime errors especially around database operations and form data.

### 8.9 Unused Components and Tables
- `SummaryCard` component exists but is not used by any screen (HomeScreen shows static content instead of live summary data)
- `categories` table is defined in schema but never directly queried or populated (beyond the schema creation)
- `reminders` table has full CRUD in Database.js but no UI for managing reminders

### 8.10 Security Concerns
- PIN authentication falls back to device-level authentication rather than implementing a custom PIN entry
- `setupPinSecurity` does not actually store a hashed PIN (noted as a TODO in comments)
- Security setting is stored in AsyncStorage (unencrypted) rather than expo-secure-store

### 8.11 Missing Error Handling UX
- Database errors are only logged to console with `console.error`
- No user-facing error messages or retry mechanisms for failed database operations
- No loading states shown while data is being fetched (except initial app loading)

---

## 9. PRD Compliance Summary

| PRD Feature | Status | Notes |
|-------------|--------|-------|
| Tithe/Offering Logging | Implemented | Full CRUD via GivingScreen |
| Recurring Gifts | Not implemented | Schema has reminders table but no recurring gift UI |
| Smart Reminders | Partially implemented | Notification infrastructure exists, no custom scheduling UI |
| Income Tracking | Implemented | Full flow with tithe calculation |
| Pending Tithe Management | Implemented | Can mark income as processed |
| Dashboard with Summary Cards | Partially implemented | HomeScreen is static, no live summary data |
| Reports with Charts | Implemented | Custom bar charts, goals, CSV export |
| Recipient Management | Implemented | CRUD with search |
| Scripture Integration | Implemented | 10 hardcoded verses with refresh |
| PIN/Biometric Security | Implemented | Using expo-local-authentication |
| Multi-Currency | Implemented | 18 currencies supported |
| Data Export | Implemented | CSV and JSON export via sharing |
| Material Design 3 | Implemented | React Native Paper with custom theme |
| Onboarding Flow | Implemented | 5-page wizard |

---

## 10. Recommendations

1. **Add TypeScript** - Convert to `.tsx`/`.ts` for type safety across the database layer and form handling
2. **Fix the ScrollView import** in `GivingScreen.js`
3. **Migrate to the new expo-sqlite API** (`openDatabaseSync`) before the legacy API is removed
4. **Make HomeScreen dynamic** - Wire up `SummaryCard` with live donation totals and pending tithe data
5. **Add delete/edit support** for donations and income records
6. **Build a Reminders management UI** to leverage the existing reminders infrastructure
7. **Add a test framework** (Jest + React Native Testing Library) and write tests for database operations and utility functions
8. **Implement configurable giving goals** stored in the settings table
9. **Add proper error handling** with user-facing Snackbar/Toast messages
10. **Use expo-secure-store** for sensitive data (security settings, PIN hash)
