# Production Readiness Audit - Stewardship Keeper

**Date**: March 2026
**Scope**: Full app store release readiness assessment
**Severity Levels**: P0 (blocker), P1 (must fix before release), P2 (should fix), P3 (nice to have)

---

## Executive Summary

The app has a solid foundation but has several gaps that need to be addressed before an app store release. The most critical issues are: crashes from missing imports, no error boundaries, no data validation at the DB layer, hardcoded goals, and an incomplete HomeScreen that shows static marketing content instead of live user data. Security handling needs tightening, and the app lacks any form of testing.

---

## 1. CRITICAL BUGS (P0 - Release Blockers)

### 1.1 GivingScreen: Missing ScrollView Import
**File**: `src/screens/GivingScreen.js:2`
**Issue**: `ScrollView` is used on line 163 but not imported. This causes a runtime crash when the GivingScreen renders.
**Fix**: Add `ScrollView` to the react-native import.

> Note: This is already fixed in PR #2 (Expo upgrade).

### 1.2 RecipientForm: Schema Field Mismatch
**File**: `src/components/RecipientForm.js` + `src/database/Database.js`
**Issue**: `RecipientForm` submits `{ name, type, notes }` but `addRecipient()` in Database.js inserts `recipient.category` into the `category` column. The form sends `type`, not `category`. This means **every recipient is saved with `category = undefined`**, which gets stored as an empty string or null.

Meanwhile, `RecipientsScreen` reads `recipient.type` for display and filtering, but the recipients table only has a `category` column -- there is no `type` column. The `getRecipients()` query does `SELECT *`, so what comes back is `{ name, category, notes, isDefault }` -- no `type` field.

**Impact**: Recipient filtering by type is broken. Recipient type displays as `undefined` in the list.
**Fix**: Either:
- (a) Rename the schema column from `category` to `type`, or
- (b) Map `type` -> `category` in the form submission and `category` -> `type` in the query results

### 1.3 IncomeForm: processed Field Sent as Integer, Expected as Boolean
**File**: `src/components/IncomeForm.js:54`
**Issue**: The form sends `processed: processed ? 1 : 0` (integer), but the updated `addIncome()` in Database.js does `income.processed ? 1 : 0`. When the form sends `0` (falsy) or `1` (truthy), this works by coincidence. But if someone passes `processed: false` directly, the DB layer converts it correctly. The inconsistency between integer and boolean representations is fragile.
**Fix**: Standardize on boolean throughout the app. Forms should send `processed: true/false`, and the DB layer should handle the conversion.

---

## 2. DATA INTEGRITY & DATABASE (P1)

### 2.1 No Input Sanitization on SQL Values
**File**: `src/database/Database.js`
**Issue**: While parameterized queries are used (good), there is no validation that amounts are positive numbers, dates are valid ISO strings, or required fields are non-empty at the database layer. All validation lives only in UI forms, meaning any programmatic call to `addDonation()` or `addIncome()` could insert garbage data.
**Fix**: Add validation functions in the database layer:
```javascript
const validateDonation = (donation) => {
  if (!donation.amount || donation.amount <= 0) throw new Error('Invalid amount');
  if (!donation.date || !/^\d{4}-\d{2}-\d{2}$/.test(donation.date)) throw new Error('Invalid date');
  if (!donation.type) throw new Error('Type is required');
};
```

### 2.2 No Database Migration Strategy
**File**: `src/database/Database.js`, `src/database/schema.js`
**Issue**: `CREATE TABLE IF NOT EXISTS` is used, which means if you add a column to the schema in a future version, existing users will NOT get the new column. Their tables already exist, so the CREATE statement is skipped.
**Fix**: Implement a versioned migration system:
```javascript
const MIGRATIONS = [
  { version: 1, sql: 'CREATE TABLE IF NOT EXISTS ...' },
  { version: 2, sql: 'ALTER TABLE donations ADD COLUMN recurring INTEGER DEFAULT 0' },
];
```
Store the current schema version in the settings table and run pending migrations on app startup.

### 2.3 No Foreign Key Enforcement
**File**: `src/database/schema.js`
**Issue**: The `donations.recipientId` references `recipients.id` but there is no `FOREIGN KEY` constraint. Deleting a recipient would leave orphaned donation records with a stale `recipientId`, and the LEFT JOIN in `getDonations()` would show "Unknown Recipient".
**Fix**: Add `FOREIGN KEY (recipientId) REFERENCES recipients(id) ON DELETE SET NULL` and enable foreign keys with `PRAGMA foreign_keys = ON`.

### 2.4 No Indexes on Frequently Queried Columns
**File**: `src/database/schema.js`
**Issue**: The `donations.date` and `income.date` columns are used in every range query (`WHERE date BETWEEN ? AND ?`) but have no indexes. As the dataset grows, queries will slow down.
**Fix**: Add indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(date);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_donations_recipientId ON donations(recipientId);
```

### 2.5 Unused Tables
**File**: `src/database/schema.js`
**Issue**: The `categories` table is created but never read, written to, or referenced by any screen or component. The `reminders` table has full CRUD in Database.js but no UI whatsoever.
**Fix**: Either remove unused tables or implement the missing UI. For release, at minimum remove `categories` to avoid confusion.

---

## 3. SCREEN-BY-SCREEN AUDIT (P1-P2)

### 3.1 HomeScreen - Static Content Instead of Live Dashboard

**File**: `src/screens/HomeScreen.js`
**Severity**: P1

The PRD specifies: "Home Screen: Greeting, summary cards (This Month's Giving, Pending Tithe), quick actions." The current implementation shows a static welcome card with marketing copy and a feature bullet list. It does not fetch or display any user data.

**What's missing**:
- This month's total giving (SummaryCard component exists but is unused)
- Pending tithe amount (PendingTitheCard component exists but is only used on IncomeScreen)
- Year-to-date giving total
- Quick action buttons that navigate to add donation/income

**Fix**: Replace the static welcome card and features list with live data:
```jsx
const [monthlyTotal, setMonthlyTotal] = useState(0);
const [pendingTithe, setPendingTithe] = useState(0);

useFocusEffect(useCallback(() => {
  const load = async () => {
    const { start, end } = getCurrentMonthStartEnd();
    const total = await getDonationTotal(start, end);
    setMonthlyTotal(total);
    const tithe = await getPendingTitheTotal();
    setPendingTithe(tithe);
  };
  load();
}, []));
```

### 3.2 GivingScreen - No Edit or Delete

**File**: `src/screens/GivingScreen.js`
**Severity**: P1

Users can add donations but cannot edit or delete them. For a financial tracking app, this is a significant gap -- typos in amounts or accidental entries have no recourse.

**What's missing**:
- Long-press or swipe-to-delete on donation items
- Tap to edit existing donations
- Confirmation dialog before deletion
- `deleteDonation()` and `updateDonation()` functions in Database.js

### 3.3 IncomeScreen - No Edit or Delete

**File**: `src/screens/IncomeScreen.js`
**Severity**: P1

Same issue as GivingScreen. Income entries cannot be edited or deleted. If a user enters the wrong income amount, they cannot correct it.

### 3.4 ReportsScreen - Hardcoded Goals

**File**: `src/screens/ReportsScreen.js:43-44`
**Severity**: P1

```javascript
const monthlyGoal = 500;
const annualGoal = 6000;
```

Giving goals are hardcoded as $500/month and $6000/year. Different users will have very different giving goals. These should be stored in the settings table and configurable from the Settings screen.

### 3.5 ReportsScreen - Division by Zero

**File**: `src/screens/ReportsScreen.js:177`
**Severity**: P0

```javascript
{Math.round((donationTotal / donationGoal) * 100)}%
```

If `donationGoal` is 0 (which could happen if the settings are corrupted or during an edge case), this produces `Infinity%` or `NaN%` in the UI.

**Fix**: Guard against division by zero:
```javascript
{donationGoal > 0 ? Math.round((donationTotal / donationGoal) * 100) : 0}%
```

### 3.6 SettingsScreen - Settings Not Persisted to AsyncStorage for Security

**File**: `src/screens/SettingsScreen.js`
**Severity**: P2

The security enabled/type settings are saved to the SQLite settings table via `updateSetting()`, but the `AppNavigator` reads security settings from `AsyncStorage`. This means after toggling security in settings, the auth gate may not work until the AsyncStorage values are also updated.

**Fix**: When saving security settings, also write to AsyncStorage:
```javascript
await AsyncStorage.setItem('securityEnabled', securityEnabled ? 'true' : 'false');
await AsyncStorage.setItem('securityType', securityType);
```

### 3.7 OnboardingScreen - Cannot Be Re-Triggered

**File**: `src/screens/OnboardingScreen.js`
**Severity**: P2

Once onboarding is completed, `hasOnboarded` is set to `true` in AsyncStorage and there is no way to re-run the onboarding flow. There should be a "Reset Onboarding" or "Show Tutorial" option in Settings.

### 3.8 OnboardingScreen - Navigation After Completion

**File**: `src/screens/OnboardingScreen.js:119`
**Severity**: P1

```javascript
navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
```

This tries to navigate to a route called `'Main'`, but the root `AppNavigator` conditionally renders screens based on `hasOnboarded` state. Since `hasOnboarded` is set in App.js state and doesn't get re-evaluated after AsyncStorage write, the navigation reset may fail or show a blank screen. The `hasOnboarded` state in App.js needs to be lifted into context or a callback needs to be passed down.

---

## 4. ERROR HANDLING & UX (P1)

### 4.1 No Error Boundaries

**Severity**: P0

There are zero React Error Boundaries in the app. If any component throws during render (e.g., bad data from the database, undefined property access), the entire app crashes with a white screen.

**Fix**: Add a root-level ErrorBoundary component:
```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <ErrorFallbackScreen />;
    return this.props.children;
  }
}
```

### 4.2 No User-Facing Error Messages

**Severity**: P1

Every `catch` block in the app does `console.error(...)` and nothing else. Users get no feedback when:
- Database operations fail
- Network requests fail (notifications registration)
- Export fails
- Settings fail to save (except SettingsScreen which does show an Alert)

**Fix**: Use `Snackbar` from react-native-paper or `Alert.alert()` to show actionable error messages.

### 4.3 No Loading States on Data-Fetching Screens

**Severity**: P2

GivingScreen, IncomeScreen, ReportsScreen, and RecipientsScreen all fetch data on focus but show no loading indicator while data is being fetched. The screen appears empty momentarily before data populates.

**Fix**: Show a centered `ActivityIndicator` when `refreshing` is true and data arrays are empty.

### 4.4 No Empty State Call-to-Action on HomeScreen

**Severity**: P2

HomeScreen shows the same static content whether the user has zero donations or thousands. For a new user, the experience should guide them to add their first recipient and donation.

---

## 5. SECURITY (P1)

### 5.1 PIN Not Actually Implemented

**File**: `src/utils/authentication.js:54-64`
**Severity**: P1

The "PIN" authentication option just delegates to `LocalAuthentication.authenticateAsync()` which uses the device's screen lock (fingerprint/face/device PIN). There is no custom PIN entry screen. If a user selects "PIN" they get the same biometric prompt. This is misleading.

**Fix**: Either:
- (a) Remove the PIN option and only offer biometric/device authentication, or
- (b) Implement a custom PIN entry screen with hashed PIN storage

### 5.2 Security Settings Stored in Plaintext

**File**: `src/utils/authentication.js:79-80`
**Severity**: P2

```javascript
await AsyncStorage.setItem('securityType', 'pin');
await AsyncStorage.setItem('securityEnabled', 'true');
```

Security configuration is stored in unencrypted AsyncStorage. A rooted device could easily read and modify these values.

**Fix**: Use `expo-secure-store` for security-sensitive settings.

### 5.3 Console Logging in Production

**Severity**: P2

The codebase has 30+ `console.log` and `console.error` calls. These leak internal information in production builds and can cause performance issues on Android.

**Fix**: Either remove all console statements or use a logging utility that disables in production:
```javascript
const log = __DEV__ ? console.log : () => {};
```

Or add `babel-plugin-transform-remove-console` to the production babel config.

---

## 6. PERFORMANCE (P2)

### 6.1 Database Called on Every Tab Focus

**Severity**: P2

Every screen uses `useFocusEffect` to reload all data every time the tab is focused. If a user rapidly switches between tabs, this triggers redundant database queries.

**Fix**: Add a data staleness check -- only reload if data is older than N seconds, or use a simple cache/state management layer.

### 6.2 No List Virtualization Optimization

**File**: `src/screens/GivingScreen.js`, `src/screens/IncomeScreen.js`
**Severity**: P2

`FlatList` is used (good), but `renderItem` renders the entire month section including all items. For months with many donations, this defeats FlatList's virtualization benefit since each "item" in the FlatList is a whole month group containing potentially dozens of sub-items.

**Fix**: Use `SectionList` instead of `FlatList` to get proper per-item virtualization within sections.

### 6.3 Chart Components Re-Process Data on Every Render

**File**: `src/components/ChartGivingOverTime.js`, `src/components/ChartGivingByRecipient.js`
**Severity**: P3

Chart data preparation happens in `useEffect` but the components create intermediate objects on every render. For large datasets this could cause jank.

**Fix**: Memoize chart data computation with `useMemo`.

---

## 7. APP STORE REQUIREMENTS (P1)

### 7.1 No Privacy Policy

**Severity**: P0

Both Apple App Store and Google Play require a privacy policy URL. The app stores income and financial data locally. A privacy policy must be in place.

**Fix**: Create a privacy policy and add the URL to `app.json` and the app store listings.

### 7.2 app.json Placeholder Values

**File**: `app.json`
**Severity**: P1

```json
"bundleIdentifier": "com.yourcompany.stewardshipkeeper"
"package": "com.yourcompany.stewardshipkeeper"
```

These placeholder values need to be replaced with the actual company/developer identifiers before building for the app stores.

### 7.3 No App Icons Verification

**Severity**: P1

The `assets/` directory contains icon files, but they need to be verified against app store requirements:
- iOS: 1024x1024 App Store icon
- Android: 512x512 Play Store icon
- Adaptive icon foreground/background properly configured

### 7.4 No Versioning Strategy

**File**: `app.json`
**Severity**: P2

`version` is "1.0.0" and Android `versionCode` is 1. For subsequent updates, there needs to be a process to bump these values. Consider using `expo-updates` for OTA updates.

### 7.5 Missing Splash Screen Configuration for SDK 55

**Severity**: P2

The splash screen config in `app.json` uses the old format. SDK 55 supports the new `expo-splash-screen` plugin format for more control. Verify the splash screen renders correctly on all device sizes.

---

## 8. ACCESSIBILITY (P2)

### 8.1 No accessibilityLabel or accessibilityHint Props

**Severity**: P2

No screen or component uses `accessibilityLabel`, `accessibilityHint`, or `accessibilityRole`. Screen readers will not be able to meaningfully describe:
- Summary card amounts
- Chart data points
- FAB buttons (will just say "button")
- Filter chips

**Fix**: Add accessibility labels to all interactive and informational elements:
```jsx
<FAB
  accessibilityLabel="Add new donation"
  accessibilityRole="button"
  ...
/>
```

### 8.2 Hardcoded Colors

**Severity**: P3

Several components use hardcoded colors like `'rgba(0, 0, 0, 0.54)'` for text instead of using the theme. This means dark mode (which has a theme defined but is not wired up) would show dark text on a dark background.

---

## 9. MISSING FEATURES FOR MVP (P1-P2)

### 9.1 Dark Mode Not Wired Up (P2)
`theme.js` defines both light and dark themes with a `getTheme()` helper, but `App.js` always uses the light theme. The `themeSetting` stored in settings is never consumed.

### 9.2 No Recurring Donations (P2)
The PRD specifies recurring gifts with reminders. The `reminders` table exists but there is no UI.

### 9.3 No Donation Deletion (P1)
No `deleteDonation()` function exists in Database.js, and no UI affordance exists for deletion.

### 9.4 No Data Backup/Restore (P3)
All data is local SQLite with no backup mechanism. If the user uninstalls the app, all data is lost.

---

## 10. RELEASE CHECKLIST

### Must Fix Before Release (P0-P1)
- [ ] Fix RecipientForm `type`/`category` field mismatch
- [ ] Add Error Boundary at root level
- [ ] Fix ReportsScreen division by zero on goals
- [ ] Make HomeScreen show live data (monthly giving, pending tithe)
- [ ] Add donation edit and delete functionality
- [ ] Add income edit and delete functionality
- [ ] Make giving goals configurable in settings
- [ ] Sync security settings between SQLite and AsyncStorage
- [ ] Fix onboarding -> main app navigation state handoff
- [ ] Add user-facing error messages (Snackbar/Alert)
- [ ] Replace `app.json` placeholder bundle identifiers
- [ ] Create and link a privacy policy
- [ ] Verify app icons meet store requirements
- [ ] Remove or gate `console.log` statements for production
- [ ] Add database indexes on date columns
- [ ] Implement database migration system for future updates

### Should Fix Before Release (P2)
- [ ] Wire up dark mode theme switching
- [ ] Add accessibility labels to all interactive elements
- [ ] Add loading indicators on data-fetching screens
- [ ] Replace hardcoded colors with theme values
- [ ] Use SectionList for proper list virtualization
- [ ] Use expo-secure-store for security settings
- [ ] Add "Show Tutorial" option in Settings
- [ ] Implement proper versioning strategy

### Nice to Have (P3)
- [ ] Add data backup/restore functionality
- [ ] Implement recurring donation reminders UI
- [ ] Add chart data memoization
- [ ] Remove unused `categories` table
- [ ] Add a test framework and initial test coverage
