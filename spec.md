# Unrot

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Authentication (sign up / log in) with onboarding screen after first login
- Main dashboard: coin balance, active tasks, completed tasks
- Task system:
  - Create/edit/delete tasks
  - Task types: push-ups (camera-detected), sit-ups (camera-detected), custom (manual)
  - Preset tasks: 5 push-ups, 20 sit-ups
  - Coin reward per task (user-defined)
  - Repeat options: daily, weekly, custom schedule, never (one-time)
  - Priority toggle
- Camera-based exercise detection using device camera + pose tracking (MediaPipe or similar)
  - Real-time rep counting for push-ups and sit-ups
- Coin system:
  - 1 coin = 1 minute screen time
  - Users earn coins by completing tasks
  - Debt allowed up to -20 coins
  - Debt blocks reward redemption
  - Debt resets at midnight
- Redeem screen time: 15 min (15 coins), 1 hour (60 coins), all day (custom input)
- Custom rewards: name + coin cost, user-created
- Analyze tab: simulated screen time usage display (total today, per-app breakdown)
- Settings: light/dark mode toggle
- Haptic feedback on all button interactions (navigator.vibrate)
- Smooth animations throughout

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: user profile with coin balance, task CRUD, custom reward CRUD, screen time redemption log, debt tracking
2. Select components: authorization, camera
3. Frontend tabs: Dashboard, Tasks, Redeem, Rewards, Analyze, Settings
4. Onboarding flow shown once after first sign-in
5. Camera exercise modal: uses MediaPipe Pose for rep detection (push-ups via shoulder/elbow angle, sit-ups via hip/shoulder angle)
6. Coin transactions recorded on backend for each task completion and redemption
7. Debt enforcement: block redeem if balance <= -20
8. Midnight reset handled by storing lastDebtReset date on user profile
