# Smart TV App - Multi-Screen Navigation Flow

## Overview
The smart TV app now features a complete multi-screen navigation structure integrating the Figma-generated video detail screen.

## Navigation Flow
```
Landing (index.html) → Home (home.html) → Video Detail (video-detail.html)
       ↑                      ↑                        ↑
    Enter/Login            Video Cards              Figma Screen
```

## Screen Details

### 1. Landing Screen (index.html)
- **Purpose**: Entry point with prominent call-to-action buttons
- **Navigation**: Enter button → Home, Login button → Login page
- **Remote Support**: Arrow keys to navigate between buttons, Enter to activate
- **Back**: Not applicable (entry point)

### 2. Home Screen (home.html)
- **Purpose**: Main content browser with video rails
- **Navigation**: All video cards route to video-detail.html
- **Remote Support**: Full DPAD navigation across menu and content rails
- **Back**: Returns to Landing screen

### 3. Video Detail Screen (video-detail.html)
- **Purpose**: Integrated Figma screen showing detailed video information
- **Features**: 
  - Channel information and program metadata
  - Action buttons (Schedule, Play, Info, Favorite, Share, Options)
  - Live date/time display
  - TV-friendly scaling and layout
- **Remote Support**: Navigate between action buttons, top menu, and back button
- **Back**: Returns to Home screen

## Key Features

### Remote Navigation
- **Arrow Keys**: Navigate between focusable elements
- **Enter/OK**: Activate focused element
- **Back/Escape**: Navigate to previous screen in flow
- **Tizen Hardware Back**: Supported for Samsung TV

### Responsive Design
- Figma screen scales properly on different TV sizes
- Maintains 16:9 aspect ratio
- TV-friendly focus indicators with yellow outline

### Integration Points
- `app.js`: Main navigation logic and page-specific handlers
- `assets/app.js`: Video detail screen specific navigation
- `assets/35-4077-14472.js`: Figma screen scaling and functionality
- Shared CSS variables for consistent styling

## Usage
1. Start at Landing screen
2. Press Enter to go to Home
3. Navigate to any video using arrow keys
4. Press Enter to view Video Detail (Figma screen)
5. Use Back button or remote back key to return to Home
6. Use Back from Home to return to Landing

The navigation flow creates a seamless experience from landing → browsing → detailed view using the Figma-generated screen as the video detail interface.
