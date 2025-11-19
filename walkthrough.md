# Shampoo Strategist - Walkthrough & Verification

## Overview
The **Shampoo Strategist** has been updated with enhanced UI, new metrics (Appearance, Composite), and more dynamic gameplay elements like Wind chaos.

## How to Run
1.  Open the folder `Shampoo Optimizer` on your Desktop.
2.  Double-click `index.html` to open it in your default web browser.

## Verification Steps

### 1. Enhanced UI
- [ ] **New Bars**: Check the header for "Appearance" (Purple) and "Overall Vibe" (Blue Gradient) bars alongside Health.
- [ ] **Buttons**: Verify the "WASH" button is now labeled **"SHAMPOO"**.
- [ ] **Forecast**: Look at the top strip. Each day should now have a text label (e.g., "CLIENT", "HOT", "SOCIAL") below the icon.
- [ ] **Styling**: Notice the softer, more rounded corners on cards and buttons.

### 2. New Mechanics
- [ ] **Appearance Score**:
    - Click **SHAMPOO**: Verify Appearance resets to ~6-7/10 (Clean but frizzy/flat).
    - Click **WAIT**: Verify Appearance peaks at Day 1 (10/10) then degrades.
- [ ] **Composite Score**:
    - Watch the "Overall Vibe" bar. It should reflect a balance of your Health and Appearance.
- [ ] **Wind Chaos**:
    - Play through a few times until you see a "Strong winds!" toast.
    - Verify it applies a small penalty to your score/appearance for that day.

### 3. Core Loop (Regression Check)
- [ ] **Health**: Ensure Health still drops by 15% on Shampoo and recovers 5% on Wait.
- [ ] **Game Over**: Ensure 0% Health still triggers Game Over.
- [ ] **End Game**: Verify the chart and score comparison still work correctly.

## Files Modified
- `index.html`: Added new bars, renamed button.
- `style.css`: Updated styling for bars, corners, and text.
- `script.js`: Added logic for new metrics and Wind chaos.
