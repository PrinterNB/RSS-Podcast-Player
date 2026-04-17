# RSS Podcast Player

A modern, feature-rich podcast player that allows users to search for podcasts and play episodes from RSS feeds. Built with vanilla HTML, CSS, and JavaScript.

## Features

### Podcast Discovery
- **Search by Podcast Name**: Use the iTunes Search API to find podcasts without needing RSS URLs
- **Direct RSS Feed Input**: Enter any RSS feed URL directly for more control
- **Podcast Artwork**: View podcast cover images in search results (140x140px cards with hover effects)
- **Responsive Grid Layout**: Search results display as an attractive grid that adapts to screen size
- **Two-Screen Navigation**: Search results on main screen, click podcast to view dedicated detail screen with back button

### Episode Management
- **Paginated Episode Loading**: Episodes load 20 at a time with a "Load More Episodes" button for efficient browsing
- **Auto-Scroll**: Automatically scrolls to episodes when you select a podcast
- **Episode Search**: Quick access to recent episodes from each podcast feed

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
- **Search by Enter Key**: Press Enter in search field to search (no need to click button)

### Technical Features
- **RSS Feed Parsing**: Uses rss2json API for reliable feed parsing
- **Error Handling**: Gracefully handles episodes without audio and displays appropriate messaging
- **Fast Loading**: Optimized for quick episode loading and responsive UI

## Getting Started

### Setup
1. Download or clone all files to a folder
2. Open a terminal in the folder
3. Start a local server:
   - **Python 3**: `python -m http.server 8000`
   - **Python 2**: `python -m SimpleHTTPServer 8000`
   - **Node.js**: `npx http-server`
4. Open `http://localhost:8000` in your browser

## How to Use

1. **Open the Player**: Open `index.html` in a web browser on a local server (e.g., `http://localhost:8000`)

2. **Search for Podcasts**: 
   - Enter a podcast name in the search field
   - Press **Enter** or click the **Search** button
   - Browse the grid of podcast cards with artwork

3. **View Podcast Episodes**:
   - Click on any podcast card to navigate to the podcast detail screen
   - See the podcast artwork and name at the top
   - Browse episodes in the list below
   - Click **Load More Episodes** to see additional episodes (20 at a time)
   - Click the **← Back** button to return to search results

4. **Or Fetch by RSS URL**:
   - Enter an RSS feed URL in the second input field
   - Click "Fetch Feed" to load episodes from that URL

5. **Play Episodes**:
   - Click on any episode title to start playback
   - Use the **play/pause button** (▶/⏸) to control playback
   - Drag the **timeline slider** to seek to a specific time
   - Adjust **volume** with the volume slider
   - View current playback time and total duration

6. **Toggle Theme**:
   - Click the moon/sun button (🌙/☀️) in the top-right corner to switch between light and dark modes

## Files

- `index.html`: Main HTML structure with two-screen navigation (search results and podcast detail), header controls, and custom player
- `styles.css`: Comprehensive styling with light/dark mode support (~600+ lines), responsive grid layout, and animations
- `script.js`: All interactive functionality including search, feed parsing, two-screen navigation, pagination, playback controls, and theme management

## Technical Details

### APIs Used
- **iTunes Search API**: For podcast discovery and metadata (title, artwork, feed URL)
- **rss2json API**: Reliable RSS feed parser that converts XML feeds to JSON format

### Episode Limits
- The rss2json API typically returns the ~10 most recent episodes from each podcast
- Use the "Load More Episodes" button to load batches of 20 episodes at a time
- For complete podcast histories, consider using dedicated podcast apps or downloading via RSS readers

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

- **Local Server Required**: For best results, run the app on a local server (e.g., `python -m http.server 8000`) rather than opening the HTML file directly
- **Internet Connection**: An active internet connection is required to fetch podcasts and episodes
- **Episode Limitations**: rss2json API provides recent episodes only; most podcast feeds show the latest ~10 episodes
- **Audio Playback**: Some podcasts may not work if their audio files are behind authentication, geo-blocking, or tracking prevention measures
- **Tracking Prevention**: The player automatically attempts to resolve tracking redirects to enable audio playback