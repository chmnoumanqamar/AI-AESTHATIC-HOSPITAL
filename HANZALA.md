# Hanzala Branch Documentation

This file documents all changes made on the `hanzala` branch (`origin/hanzala`).

For the complete, itemized technical changelog, see [HANZALA_CHANGES.md](file:///c:/Users/Honey/Desktop/AI-AESTHATIC-HOSPITAL/HANZALA_CHANGES.md).

---

## Quick Feature Summary

1. **Color Palette Picker & Custom Color Studio**:
   - Located in the HeaderBar between the dynamic search bar and the notification bell.
   - 6 curated palettes: Moss Olive (Default), Warm Walnut & Bronze, Nordic Blue, Teal Marina, Amethyst Plum, and Deep Forest.
   - **Interactive Custom Studio**: Allows picking custom primary and gradient end colors with native color wheel picker (`<input type="color">`), hex inputs, 8 quick inspiration swatches, and live preview.
   - Comprehensively styles all buttons (`clinical-button-primary`, `.bg-[#2D6A4F]`, `.bg-emerald-*`), Brand Header (sidebar & headerbar), Chatbot FAB & drawer, badges, labels, active sidebar tabs, and borders.
   - Persists in `localStorage` (`hospital_theme_color`, `hospital_custom_palette`).

2. **Dynamic Omnibar Search**:
   - `Ctrl+K` shortcut bar in HeaderBar aligned to the left of the notification bell.
   - Searches across all modules/windows, patients, BI reports, and system diagnostics.

3. **Dynamic Sidebar Hover Expansion**:
   - Defaults to compact `w-16` icon rail.
   - Expands to `w-64` on cursor hover (`onMouseEnter`).
   - Sleek 22px bottom strip with drop-up menu for theme toggle and sign-out.

4. **Project-Wide Strict 14px Font Ceiling**:
   - All components, headings, and tables strictly capped at $\le$ 14px across Tailwind and global styles.

5. **Cleaned Header & Greetings**:
   - Removed redundant "Attending Physician" and portal welcome greetings.
   - Window titles elevated with clean icons and bold typography.
