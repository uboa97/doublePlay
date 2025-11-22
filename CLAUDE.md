# Double Play - YouTube Video & Audio Player

## Overview
Double Play is a web application that allows users to simultaneously play video from one YouTube link while playing audio from a different YouTube link. This is useful for scenarios like watching a video with alternative commentary, different language audio tracks, or any situation where you want to combine visual content from one source with audio from another.

## Key Features

### Core Functionality
- **Dual Player System**: Plays two YouTube videos simultaneously - one muted (video only) and one hidden (audio only)
- **Synchronized Controls**: Main play/pause button controls both players together
- **Independent Audio Control**: Separate button to pause/play just the audio track
- **Timestamp Navigation**: Jump to specific timestamps in the audio track (video continues playing normally) using flexible input formats (seconds, mm:ss, or hh:mm:ss)

### User Experience Features
- **Recently Played History**: Stores last 3 video pairs in localStorage with video titles
- **Video Title Fetching**: Uses YouTube oEmbed API to display actual video titles instead of IDs
- **Current Time Display**: Shows current playback position and total duration (e.g., "⏱ 1:30 / 5:42")
- **Responsive Layout**: Wide layout (1600px max-width) for optimal video viewing
- **Keyboard Support**: Press Enter in timestamp input to jump immediately

## Technical Details

### Technologies Used
- **HTML/CSS**: Bootstrap 5.3.8 for styling and layout
- **JavaScript**: Vanilla JS with YouTube IFrame Player API
- **Storage**: localStorage for persisting recently played videos
- **APIs**:
  - YouTube IFrame Player API (for video playback control)
  - YouTube oEmbed API (for fetching video titles)

### How It Works

#### Player Initialization
1. User enters two YouTube URLs (video link and audio link)
2. App extracts video IDs using regex pattern matching
3. Creates two YouTube IFrame players:
   - Video player: autoplay, muted, controls visible
   - Audio player: autoplay, hidden (1px size, positioned off-screen with `pointer-events: none`)

#### State Management
- `isPlaying`: Tracks if both players are playing
- `isAudioPlaying`: Tracks audio player state independently
- `videoPlayer` & `audioPlayer`: References to YouTube player instances
- `YTReady`: Ensures YouTube API is loaded before player creation

#### Time Tracking
- Polls audio player every 500ms using `setInterval`
- Calls `getCurrentTime()` and `getDuration()` from YouTube API
- Formats time as mm:ss or hh:mm:ss depending on duration

#### Recently Played
- Fetches video titles asynchronously when "Double Play" is clicked
- Stores up to 3 most recent pairs with:
  - `videoLink`, `audioLink`: Full YouTube URLs
  - `videoTitle`, `audioTitle`: Human-readable titles
  - `timestamp`: When the pair was played (for "X ago" display)
- Deduplicates entries (same pair moves to top)
- Clicking a recent item auto-fills the input fields

### Video Title Fetching
Uses YouTube's oEmbed endpoint (no API key required):
```
https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoID}&format=json
```
Falls back to video ID if fetch fails.

### YouTube URL Pattern Support
Supports various YouTube URL formats via regex:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/embed/VIDEO_ID`
- `youtube.com/v/VIDEO_ID`

## File Structure

### HTML Structure
- Input fields for video and audio URLs
- Recently played section (conditionally visible)
- Player container (shown after "Double Play" clicked):
  - Video player (responsive 16:9 container)
  - Hidden audio player (off-screen)
  - Time display
  - Control buttons (Play/Pause, Pause Audio, Reset)
  - Timestamp jump interface

### CSS Classes
- `.video-container`: 16:9 responsive video wrapper
- `.audio-player`: Hidden, off-screen, non-interactive
- `.btn-custom`: Rounded button styling
- `.recent-item`: Hover effects for recently played items

## localStorage Schema

**Key**: `doublePlayRecent`

**Value**: JSON array of objects (max 3 items):
```json
[
  {
    "videoLink": "https://youtube.com/watch?v=...",
    "audioLink": "https://youtube.com/watch?v=...",
    "videoTitle": "Video Title Here",
    "audioTitle": "Audio Title Here",
    "timestamp": 1699564800000
  }
]
```

## Known Limitations

1. **YouTube API Loading**: Users must wait for API to load before playing (shows alert if not ready)
2. **Title Fetching**: Video titles are fetched asynchronously, so they may not appear immediately in recently played on first load
3. **Synchronization**: YouTube IFrame API has slight delays in command execution, so perfect sync is not guaranteed
4. **Browser Restrictions**: Autoplay may be blocked by browser policies (though YouTube embed typically bypasses this)
5. **No Seek Bar**: Currently only timestamp input for navigation, no draggable seek bar

## Future Enhancement Ideas

- Add visual progress bar/seek slider
- Allow saving favorite pairs with custom names
- Volume controls for audio player
- Playback speed controls
- Loop functionality
- Export/import recently played list
- Show video thumbnails in recently played
- Keyboard shortcuts (space for play/pause, arrow keys for seek)

## Browser Compatibility

Tested and working in modern browsers that support:
- ES6+ JavaScript (arrow functions, async/await, template literals)
- YouTube IFrame API
- localStorage
- Fetch API

## File Location

`/Users/levi/Documents/webApps/nihongoVerbQuiz/text_to_speech/templates/text_to_speech/doublePlay.html`
