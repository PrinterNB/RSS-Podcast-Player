function displayEpisodes(episodes) {
    const episodesList = document.getElementById('episodes');
    episodesList.innerHTML = '';
    
    console.log('Displaying episodes, count:', episodes.length);

    if (!episodes || episodes.length === 0) {
        episodesList.innerHTML = '<li>No episodes found.</li>';
        return;
    }

    episodes.forEach((episode, index) => {
        let audioUrl = null;
        
        // Try to find audio URL from various sources
        if (episode.enclosure && episode.enclosure.link) {
            audioUrl = episode.enclosure.link;
        } else if (episode.enclosure && episode.enclosure.url) {
            audioUrl = episode.enclosure.url;
        } else if (episode.link && episode.link.includes('mp3')) {
            audioUrl = episode.link;
        }
        
        console.log(`Episode ${index}:`, {
            title: episode.title,
            audioUrl: audioUrl,
            enclosure: episode.enclosure,
            fullEpisode: episode
        });
        
        if (episode.title) {
            const listItem = document.createElement('li');
            
            if (audioUrl) {
                listItem.textContent = episode.title;
                listItem.addEventListener('click', () => playEpisode(audioUrl, episode.title));
                listItem.style.cursor = 'pointer';
            } else {
                listItem.textContent = episode.title + ' (No audio)';
                listItem.style.color = '#999';
                listItem.style.textDecoration = 'line-through';
            }
            
            episodesList.appendChild(listItem);
        }
    });

    // Scroll to episodes list on mobile
    setTimeout(() => {
        episodesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

async function resolveRedirectUrl(url) {
    try {
        console.log('Resolving redirect URL:', url);
        
        // Try to extract the actual audio URL from tracking wrapper URLs
        // URLs often look like: https://www.podtrac.com/pts/redirect.mp3/pdst.fm/e/pscrb.fm/rss/p/mgln.ai/e/257/traffic.megaphone.fm/VMP3680398678.mp3
        // We want to extract: https://traffic.megaphone.fm/VMP3680398678.mp3
        
        const urlParts = url.split('/');
        let extractedUrl = null;
        
        // Look for known audio hosts in the URL path
        const audioHosts = ['megaphone.fm', 'traffic.megaphone.fm', 'castbox.fm', 'mcdn.podbean.com', 'podcastaddict.com', 'cdn.simplecast.com'];
        
        for (const host of audioHosts) {
            if (url.includes(host)) {
                // Extract from the host onwards
                const hostIndex = urlParts.findIndex(part => part.includes(host));
                if (hostIndex !== -1) {
                    const host_with_protocol = urlParts[hostIndex];
                    const remaining = urlParts.slice(hostIndex + 1).join('/');
                    
                    // Check if it starts with https or http
                    if (host_with_protocol.includes('http')) {
                        extractedUrl = host_with_protocol + '/' + remaining;
                    } else {
                        extractedUrl = 'https://' + host_with_protocol + '/' + remaining;
                    }
                    
                    // Clean up query params if needed
                    if (extractedUrl.includes('?')) {
                        extractedUrl = extractedUrl.split('?')[0] + '?' + url.split('?')[1];
                    }
                    
                    console.log('Extracted audio host URL:', extractedUrl);
                    break;
                }
            }
        }
        
        // If we extracted a URL, try to use it
        if (extractedUrl) {
            console.log('Using extracted URL instead of redirect');
            return extractedUrl;
        }
        
        // If extraction didn't work, try fetch with HEAD method
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            mode: 'no-cors',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const finalUrl = response.url || url;
        console.log('Redirect resolved to:', finalUrl);
        return finalUrl;
    } catch (error) {
        console.error('Could not resolve redirect:', error);
        
        // Last resort: try to extract from URL structure
        try {
            const match = url.match(/traffic\.megaphone\.fm\/([^?]+)/);
            if (match) {
                const cleanUrl = `https://traffic.megaphone.fm/${match[1]}`;
                console.log('Extracted fallback URL:', cleanUrl);
                return cleanUrl;
            }
        } catch (e) {
            console.error('Extraction failed:', e);
        }
        
        return url; // Return original URL if resolution fails
    }
}

function playEpisode(audioUrl, episodeTitle) {
    console.log('Playing episode:', audioUrl);
    const audioPlayer = document.getElementById('audio-player');
    
    if (!audioUrl) {
        alert('No audio URL available.');
        return;
    }
    
    // Update episode title display
    const episodeTitleElement = document.getElementById('episode-title');
    episodeTitleElement.textContent = episodeTitle || 'Playing...';
    
    // Display podcast artwork if available
    const podcastArtwork = document.getElementById('podcast-artwork');
    if (window.currentPodcastArtwork) {
        podcastArtwork.src = window.currentPodcastArtwork;
        podcastArtwork.style.display = 'block';
    } else {
        podcastArtwork.style.display = 'none';
    }
    
    // Validate URL
    try {
        new URL(audioUrl);
    } catch (e) {
        console.error('Invalid audio URL:', audioUrl);
        alert('Invalid audio URL format.');
        return;
    }
    
    // Resolve redirect and play
    resolveRedirectUrl(audioUrl).then(resolvedUrl => {
        attemptPlayback(resolvedUrl || audioUrl);
    });
}

function attemptPlayback(audioUrl) {
    const audioPlayer = document.getElementById('audio-player');
    
    // Clear any existing event listeners
    audioPlayer.onerror = null;
    audioPlayer.onloadstart = null;
    audioPlayer.oncanplay = null;
    audioPlayer.onstalled = null;
    
    // Set crossOrigin for CORS support
    audioPlayer.crossOrigin = 'anonymous';
    
    // Track what we're trying
    let currentAttempt = 'direct';
    let originalUrl = audioUrl;
    
    // Error handler
    audioPlayer.onerror = (e) => {
        console.error('Audio error occurred:', {
            error: audioPlayer.error,
            errorCode: audioPlayer.error?.code,
            errorMessage: audioPlayer.error?.message,
            networkState: audioPlayer.networkState,
            readyState: audioPlayer.readyState,
            url: audioUrl,
            attempt: currentAttempt
        });
        
        if (currentAttempt === 'direct') {
            console.log('Direct URL failed, trying without source element...');
            currentAttempt = 'method2';
            
            audioPlayer.innerHTML = '';
            audioPlayer.src = originalUrl;
            audioPlayer.crossOrigin = 'anonymous';
            audioPlayer.type = 'audio/mpeg';
            audioPlayer.load();
            
            // Try to play after a short delay
            setTimeout(() => {
                audioPlayer.play().catch(playErr => {
                    console.error('Play attempt 2 failed:', playErr);
                    trySimpleApproach();
                });
            }, 300);
        } else if (currentAttempt === 'method2') {
            trySimpleApproach();
        }
    };
    
    // Last attempt - just set src and play without any special handling
    function trySimpleApproach() {
        currentAttempt = 'simple';
        console.log('Trying simple src approach...');
        
        audioPlayer.crossOrigin = '';
        audioPlayer.innerHTML = '';
        audioPlayer.src = originalUrl;
        
        audioPlayer.play().catch(finalErr => {
            console.error('All playback attempts failed:', {
                direct: audioUrl,
                originalUrl: originalUrl,
                errors: finalErr
            });
            alert(`Unable to play this audio file.\n\nPossible reasons:\n- Browser tracking prevention is blocking the request\n- The podcast file is not available or restricted\n\nTry:\n1. Opening the app on a local server instead of file://\n2. Disabling tracking prevention for this site\n3. Trying a different podcast\n\nURL: ${originalUrl}`);
        });
    }
    
    // Add loading handlers
    audioPlayer.onloadstart = () => {
        console.log('Audio loading started...');
    };
    
    audioPlayer.oncanplay = () => {
        console.log('Audio ready to play');
    };
    
    audioPlayer.onstalled = () => {
        console.warn('Audio playback stalled');
    };
    
    // Initial attempt with resolved URL
    audioPlayer.innerHTML = '';
    audioPlayer.src = audioUrl;
    audioPlayer.load();
    
    audioPlayer.play().catch(error => {
        console.error('Initial play attempt failed:', error);
        // Trigger the error handler logic
        audioPlayer.onerror();
    });
}

function displaySearchResults(results) {
    const searchContainer = document.getElementById('search-results-container');
    const episodesList = document.getElementById('episodes');
    
    // Clear both displays
    searchContainer.innerHTML = '';
    episodesList.innerHTML = '';
    
    console.log('Displaying search results, count:', results.length);

    if (!results || results.length === 0) {
        searchContainer.innerHTML = '<p style="grid-column: 1/-1; color: white; text-align: center;">No podcasts found.</p>';
        return;
    }

    results.forEach((result, index) => {
        if (result.collectionName) {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            // Get artwork URL (iTunes provides multiple sizes)
            const artworkUrl = result.artworkUrl600 || result.artworkUrl100 || result.artworkUrl60;
            
            if (artworkUrl && result.feedUrl) {
                const img = document.createElement('img');
                img.className = 'search-result-artwork';
                img.src = artworkUrl;
                img.alt = result.collectionName;
                resultItem.appendChild(img);
                
                const title = document.createElement('div');
                title.className = 'search-result-title';
                title.textContent = result.collectionName;
                resultItem.appendChild(title);
                
                resultItem.addEventListener('click', () => {
                    console.log('Clicking podcast:', result.collectionName);
                    fetchFeed(result.feedUrl, artworkUrl, result.collectionName);
                });
            } else {
                const title = document.createElement('div');
                title.className = 'search-result-title';
                title.textContent = result.collectionName + (result.feedUrl ? '' : ' (No feed)');
                resultItem.appendChild(title);
            }
            
            searchContainer.appendChild(resultItem);
        }
    });
}

async function fetchFeed(feedUrl, artworkUrl = null, podcastName = '') {
    if (!feedUrl) {
        alert('No feed URL available for this podcast.');
        return;
    }

    try {
        const encodedUrl = encodeURIComponent(feedUrl);
        console.log('Fetching feed from:', feedUrl);
        
        // Store artwork URL and podcast info globally
        window.currentPodcastArtwork = artworkUrl;
        window.currentPodcast.name = podcastName;
        window.currentPodcast.artwork = artworkUrl;
        window.currentPodcast.feedUrl = feedUrl;
        
        // Use rss2json API (reliable and fast)
        let response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodedUrl}`);
        
        if (response.ok) {
            let data = await response.json();
            if (data.status === 'ok' && data.items) {
                displayPodcastDetail(data.items, podcastName, artworkUrl);
                return;
            }
        }
        
        throw new Error('Could not fetch podcast episodes');
    } catch (error) {
        console.error('Error fetching feed:', error);
        alert(`Error fetching RSS feed: ${error.message}\n\nMake sure the feed URL is valid and the podcast still exists.`);
    }
}

function displayPodcastDetail(episodes, podcastName, artworkUrl) {
    // Store all episodes
    window.currentPodcast.allEpisodes = episodes;
    
    // Update podcast detail header
    document.getElementById('podcast-name').textContent = podcastName || 'Podcast';
    const detailArtwork = document.getElementById('detail-podcast-artwork');
    if (artworkUrl) {
        detailArtwork.src = artworkUrl;
        detailArtwork.style.display = 'block';
    } else {
        detailArtwork.style.display = 'none';
    }
    
    // Display episodes using the stored function
    if (window.displayDetailEpisodes) {
        window.displayDetailEpisodes(episodes, false);
    }
    
    // Switch screens using the stored function
    if (window.showScreen) {
        window.showScreen('podcast-detail');
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function parseRSSXml(xmlText, podcastName = '', artworkUrl = null) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
            throw new Error('Invalid RSS/XML format');
        }
        
        const items = xmlDoc.getElementsByTagName('item');
        const episodes = [];
        
        for (let i = 0; i < items.length; i++) {
            const title = items[i].getElementsByTagName('title')[0]?.textContent || 'Untitled';
            const enclosure = items[i].getElementsByTagName('enclosure')[0];
            const link = enclosure?.getAttribute('url') || '';
            
            if (link) {
                episodes.push({ title, enclosure: { link } });
            }
        }
        
        displayPodcastDetail(episodes, podcastName, artworkUrl);
    } catch (error) {
        console.error('Error parsing RSS XML:', error);
        alert(`Error parsing RSS feed: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Global state for podcast details
    window.currentPodcast = {
        name: '',
        artwork: '',
        feedUrl: '',
        allEpisodes: [],
        displayedEpisodes: 0
    };

    // Screen switching functions
    function showScreen(screenId) {
        document.querySelectorAll('.view-screen').forEach(screen => {
            screen.classList.remove('active-screen');
        });
        document.getElementById(screenId).classList.add('active-screen');
        
        const backBtn = document.getElementById('back-btn');
        const headerControls = document.getElementById('header-controls');
        
        if (screenId === 'podcast-detail') {
            backBtn.style.display = 'block';
            headerControls.style.display = 'none';
        } else {
            backBtn.style.display = 'none';
            headerControls.style.display = 'flex';
        }
    }

    // Back button
    const backBtn = document.getElementById('back-btn');
    backBtn.addEventListener('click', () => {
        showScreen('podcast-list');
        window.currentPodcast = { name: '', artwork: '', feedUrl: '', allEpisodes: [], displayedEpisodes: 0 };
    });

    // Load more button
    const loadMoreBtn = document.getElementById('load-more-btn');
    loadMoreBtn.addEventListener('click', () => {
        displayDetailEpisodes(window.currentPodcast.allEpisodes, true);
    });

    function displayDetailEpisodes(allEpisodes, isLoadMore = false) {
        const detailEpisodes = document.getElementById('detail-episodes');
        const loadMoreBtn = document.getElementById('load-more-btn');
        const episodesPerLoad = 20;
        
        if (!isLoadMore) {
            detailEpisodes.innerHTML = '';
            window.currentPodcast.displayedEpisodes = 0;
        }
        
        const endIndex = Math.min(
            window.currentPodcast.displayedEpisodes + episodesPerLoad,
            allEpisodes.length
        );
        
        for (let i = window.currentPodcast.displayedEpisodes; i < endIndex; i++) {
            const episode = allEpisodes[i];
            if (!episode || !episode.title) continue;
            
            let audioUrl = null;
            if (episode.enclosure && episode.enclosure.link) {
                audioUrl = episode.enclosure.link;
            } else if (episode.enclosure && episode.enclosure.url) {
                audioUrl = episode.enclosure.url;
            } else if (episode.link && episode.link.includes('mp3')) {
                audioUrl = episode.link;
            }
            
            const listItem = document.createElement('li');
            
            if (audioUrl) {
                listItem.textContent = episode.title;
                listItem.addEventListener('click', () => playEpisode(audioUrl, episode.title));
                listItem.style.cursor = 'pointer';
            } else {
                listItem.textContent = episode.title + ' (No audio)';
                listItem.style.color = '#999';
                listItem.style.textDecoration = 'line-through';
            }
            
            detailEpisodes.appendChild(listItem);
        }
        
        window.currentPodcast.displayedEpisodes = endIndex;
        
        // Always show load more button for better UX
        if (endIndex < allEpisodes.length) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = `Load More Episodes (${endIndex}/${allEpisodes.length})`;
        } else {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.disabled = true;
            loadMoreBtn.textContent = `All Episodes Loaded (${allEpisodes.length})`;
        }
        
        // Scroll to episodes if loading more
        if (isLoadMore) {
            setTimeout(() => {
                loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
        }
    }
    
    // Fetch feed button
    const fetchButton = document.getElementById('fetch-feed');
    if (fetchButton) {
        fetchButton.addEventListener('click', async () => {
            const rssUrl = document.getElementById('rss-url').value.trim();
            console.log('Fetch button clicked with URL:', rssUrl);
            
            if (!rssUrl) {
                alert('Please enter an RSS feed URL.');
                return;
            }

            await fetchFeed(rssUrl, null, 'Direct Feed');
        });
    }

    // Search function (shared between button click and Enter key)
    async function performSearch() {
        const searchTerm = document.getElementById('search-term').value.trim();
        console.log('Performing search with term:', searchTerm);
        
        if (!searchTerm) {
            alert('Please enter a search term.');
            return;
        }

        try {
            console.log('Fetching from iTunes API...');
            const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=podcast&limit=50`);
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Search results:', data.results);
            
            if (!data.results || data.results.length === 0) {
                alert('No podcasts found for that search term.');
                return;
            }
            
            displaySearchResults(data.results);
        } catch (error) {
            console.error('Error searching for podcasts:', error);
            alert(`Error searching for podcasts: ${error.message}`);
        }
    }

    // Search button
    const searchButton = document.getElementById('search-feed');
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }

    // Search input field - Enter key triggers search
    const searchInput = document.getElementById('search-term');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Custom player controls
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const timeline = document.getElementById('timeline');
    const progress = document.getElementById('progress');
    const slider = document.getElementById('slider');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const volumeSlider = document.getElementById('volume-slider');

    // Play/Pause button
    playBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    });

    // Update play button state
    audioPlayer.addEventListener('play', () => {
        playBtn.classList.add('playing');
        playBtn.innerHTML = '<span class="play-icon">⏸</span>';
    });

    audioPlayer.addEventListener('pause', () => {
        playBtn.classList.remove('playing');
        playBtn.innerHTML = '<span class="play-icon">▶</span>';
    });

    // Update time display and progress
    audioPlayer.addEventListener('timeupdate', () => {
        const duration = audioPlayer.duration;
        const currentTime = audioPlayer.currentTime;
        
        // Update progress bar
        const percent = (currentTime / duration) * 100;
        progress.style.width = percent + '%';
        slider.style.left = percent + '%';
        
        // Update time displays
        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    });

    // Timeline click to seek
    timeline.addEventListener('click', (e) => {
        const rect = timeline.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });

    // Slider drag
    let isDragging = false;
    slider.addEventListener('mousedown', () => {
        isDragging = true;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const rect = timeline.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));
        audioPlayer.currentTime = percent * audioPlayer.duration;
    });

    // Volume control
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
    });

    // Set initial volume
    audioPlayer.volume = 0.7;

    // Helper function to format time
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        
        // Update icon
        if (body.classList.contains('dark-mode')) {
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });

    // Store functions globally for access outside DOMContentLoaded
    window.showScreen = showScreen;
    window.displayDetailEpisodes = displayDetailEpisodes;
});

