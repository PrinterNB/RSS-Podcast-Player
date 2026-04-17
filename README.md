# RSS Podcast Player

A modern, feature-rich podcast player that allows users to search for podcasts and play episodes from RSS feeds. Built with vanilla HTML, CSS, and JavaScript.

## Features

### Podcast Discovery
- **Search by Podcast Name**: Use the iTunes Search API to find podcasts without needing RSS URLs
- **Direct RSS Feed Input**: Enter any RSS feed URL directly for more control
- **Podcast Artwork**: View podcast cover images in search results (140x140px cards with hover effects)
- **Responsive Grid Layout**: Search results display as an attractive grid that adapts to screen size

### Audio Player
- **Custom Controls**: Play/pause button, draggable timeline for seeking, and volume slider
- **Episode Information**: Display podcast artwork and episode title while playing
- **Time Display**: Shows current playback time and total duration
- **Tracking Prevention Bypass**: Automatically resolves redirect URLs to extract actual audio files

### User Interface
- **Light/Dark Mode Toggle**: Theme button in the top-right corner with localStorage persistence
- **Modern Styling**: Gradient backgrounds, smooth shadows, and polished animations
- **Dark Mode Friendly**: All text and interface elements properly themed for both modes
- **Responsive Design**: Works seamlessly on different screen sizes

### Technical Features
- **RSS Feed Parsing**: Primary API (rss2json) with automatic fallback to CORS proxy (allorigins.win)
- **HTTP 422 Error Handling**: Seamless fallback when primary API returns errors
- **Error Tolerance**: Gracefully handles episodes without audio and displays appropriate messaging

## How to Use

1. **Open the Player**: Open `index.html` in a web browser
2. **Search for Podcasts**: 
   - Enter a podcast name in the search field
   - Press Enter or click the Search button
   - Click on any podcast card to load its episodes
3. **Or Fetch by RSS URL**:
   - Enter an RSS feed URL in the second input field
   - Click "Fetch Feed"
4. **Play Episodes**:
   - Click on any episode title to start playback
   - Use the play/pause button to control playback
   - Drag the timeline slider to seek to a specific time
   - Adjust volume with the volume slider

## Files

- `index.html`: Main HTML structure with search inputs, podcast list, and custom player controls
- `styles.css`: Comprehensive styling with light/dark mode support (~500+ lines)
- `script.js`: All interactive functionality including search, feed parsing, playback, and theme management

## Technical Details

### APIs Used
- **iTunes Search API**: For podcast discovery and metadata (title, artwork, feed URL)
- **rss2json API**: Primary RSS feed parser (with fallback)
- **allorigins.win**: CORS proxy for handling 422 errors from rss2json

### Audio Handling
- Native HTML5 `<audio>` element with custom JavaScript controls
- Automatic redirect URL resolution to bypass browser tracking prevention
- Support for various RSS enclosure formats (link, url, direct)

### Storage
- **localStorage**: Used to persist light/dark mode preference across sessions

## Browser Compatibility

Works best on modern browsers with:
- HTML5 Audio support
- CSS Grid and Flexbox
- ES6 JavaScript (async/await, arrow functions)

## Notes

- An active internet connection is required to fetch podcasts and episodes
- Some podcasts may not work if their audio files are behind authentication or geo-blocking
- The player automatically attempts to resolve tracking redirects to enable audio playback
- Large podcast feeds may take a moment to load; please wait for the episodes to appear