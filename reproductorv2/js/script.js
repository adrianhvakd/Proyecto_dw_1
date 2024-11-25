let player;
        let currentVideo = null;
        let isExpanded = false;
        let playerReady = false;
        let progressInterval;
        let playlist = JSON.parse(localStorage.getItem('playlist')) || [];

        function savePlaylist() {
            localStorage.setItem('playlist', JSON.stringify(playlist));
        }

        function updatePlaylistDisplay() {
            const playlistContainer = document.getElementById('playlist');
            playlistContainer.innerHTML = '';

            playlist.forEach((video, index) => {
                const item = document.createElement('div');
                item.className = 'playlist-item';
                item.innerHTML = `
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <div class="playlist-item-info">
                        <p class="playlist-item-title">${video.title}</p>
                        <p class="playlist-item-channel">${video.channel}</p>
                    </div>
                    <button class="delete-from-playlist" onclick="removeFromPlaylist(${index})">×</button>
                `;
                item.onclick = (e) => {
                    // Evitar que el click en el botón de eliminar también reproduzca el video
                    if (e.target.className !== 'delete-from-playlist') {
                        playVideo(video.videoId);
                    }
                };
                playlistContainer.appendChild(item);
            });
        }

        function addToPlaylist(videoId, title, thumbnail, channel) {
            // Evitar duplicados
            if (!playlist.some(video => video.videoId === videoId)) {
                playlist.push({
                    videoId,
                    title,
                    thumbnail,
                    channel
                });
                savePlaylist();
                updatePlaylistDisplay();
            }
        }

        function removeFromPlaylist(index) {
            playlist.splice(index, 1);
            savePlaylist();
            updatePlaylistDisplay();
        }

        function onYouTubeIframeAPIReady() {
            player = new YT.Player('player', {
                height: '100%',
                width: '100%',
                videoId: '',
                playerVars: {
                    'playsinline': 1,
                    'controls': 0
                },
                events: {
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                }
            });
        }

        function startProgressUpdate() {
            if (progressInterval) clearInterval(progressInterval);
            progressInterval = setInterval(updateProgressBar, 1000);
        }

        function stopProgressUpdate() {
            if (progressInterval) {
                clearInterval(progressInterval);
                progressInterval = null;
            }
        }

        function toggleExpand() {
            if (!currentVideo) return;

            const playerContainer = document.getElementById('player-container');
            const expandButton = document.getElementById('expand-button');
            
            isExpanded = !isExpanded;
            
            if (isExpanded) {
                playerContainer.classList.remove('mini');
                playerContainer.classList.add('expanded');
                expandButton.textContent = 'Contraer';
            } else {
                playerContainer.classList.remove('expanded');
                playerContainer.classList.add('mini');
                expandButton.textContent = 'Expandir';
            }
        }

        async function searchVideos() {
            const searchInput = document.getElementById('search-input');
            const query = searchInput.value.trim();
            
            if (!query) return;

            const API_KEY = 'AIzaSyBHjS_nD0BWDk_wmSWGMCLo3umZ2hohKe4';
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.items) {
                    displaySearchResults(data.items);
                } else {
                    throw new Error('No se encontraron resultados');
                }
            } catch (error) {
                handleError(error);
            }
        }

        function displaySearchResults(videos) {
            const container = document.getElementById('search-results');
            container.innerHTML = '';

            videos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                card.innerHTML = `
                    <img src="${video.snippet.thumbnails.high.url}" alt="${video.snippet.title}">
                    <div class="video-card-info">
                        <h3>${video.snippet.title}</h3>
                        <p>${video.snippet.channelTitle}</p>
                    </div>
                `;
                card.onclick = () => playVideo(video.id.videoId);
                
                // Agregar el video a la playlist cuando se hace clic en el botón
                document.getElementById('add-to-playlist').onclick = () => {
                    if (currentVideo) {
                        const currentVideoData = videos.find(v => v.id.videoId === currentVideo);
                        if (currentVideoData) {
                            addToPlaylist(
                                currentVideo,
                                currentVideoData.snippet.title,
                                currentVideoData.snippet.thumbnails.high.url,
                                currentVideoData.snippet.channelTitle
                            );
                        }
                    }
                };
                
                container.appendChild(card);
            });
        }

        function playVideo(videoId) {
            if (!playerReady) {
                setTimeout(() => playVideo(videoId), 1000);
                return;
            }
            
            currentVideo = videoId;
            player.loadVideoById(videoId);
            startProgressUpdate();
        }

        function onPlayerReady(event) {
            playerReady = true;
            setupControls();
        }

        function onPlayerStateChange(event) {
            const playPauseButton = document.getElementById('play-pause');
            
            if (event.data === YT.PlayerState.PLAYING) {
                playPauseButton.textContent = '⏸';
                startProgressUpdate();
            } else if (event.data === YT.PlayerState.PAUSED) {
                playPauseButton.textContent = '▶';
                stopProgressUpdate();
            } else if (event.data === YT.PlayerState.ENDED) {
                playPauseButton.textContent = '▶';
                stopProgressUpdate();
            }
        }

        function updateProgressBar() {
            if (player && typeof player.getCurrentTime === 'function') {
                try {
                    const currentTime = player.getCurrentTime() || 0;
                    const duration = player.getDuration() || 0;
                    const percent = (currentTime / duration) * 100;

                    const progress = document.getElementById('progress');
                    const currentTimeDisplay = document.getElementById('current-time');
                    const durationDisplay = document.getElementById('duration');

                    if (progress && !isNaN(percent)) {
                        progress.style.width = `${percent}%`;
                    }
                    if (currentTimeDisplay) {
                        currentTimeDisplay.textContent = formatTime(currentTime);
                    }
                    if (durationDisplay) {
                        durationDisplay.textContent = formatTime(duration);
                    }
                } catch (error) {
                    console.error('Error updating progress:', error);
                }
            }
        }

        function setupControls() {
            const playPauseButton = document.getElementById('play-pause');
            const progressBar = document.getElementById('progress-bar');
            const volumeControl = document.getElementById('volume-control');
            const expandButton = document.getElementById('expand-button');

            playPauseButton.addEventListener('click', () => {
                if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }
            });

            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                const duration = player.getDuration();
                player.seekTo(duration * percent);
            });

            volumeControl.addEventListener('input', (e) => {
                const volume = e.target.value;
                player.setVolume(volume);
            });

            expandButton.addEventListener('click', toggleExpand);
        }

        function formatTime(seconds) {
            if (isNaN(seconds)) return '0:00';
            
            const minutes = Math.floor(seconds / 60);
            seconds = Math.floor(seconds % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        function handleError(error) {
            console.error('Error:', error);
            const errorMessage = document.createElement('div');
            errorMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #ff4444;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 1000;
            `;
            errorMessage.textContent = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
            document.body.appendChild(errorMessage);
            setTimeout(() => errorMessage.remove(), 3000);
        }

        document.addEventListener('DOMContentLoaded', () => {
            updatePlaylistDisplay();
            const searchInput = document.getElementById('search-input');
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchVideos();
                }
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!player) return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                        player.pauseVideo();
                    } else {
                        player.playVideo();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    player.seekTo(player.getCurrentTime() - 5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    player.seekTo(player.getCurrentTime() + 5);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const newVolume = Math.min(player.getVolume() + 5, 100);
                    player.setVolume(newVolume);
                    document.getElementById('volume-control').value = newVolume;
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    const lowerVolume = Math.max(player.getVolume() - 5, 0);
                    player.setVolume(lowerVolume);
                    document.getElementById('volume-control').value = lowerVolume;
                    break;
            }
        });

        function handleError(error) {
            console.error('Error:', error);
            // Implementa aquí la visualización de errores para el usuario
            const errorMessage = document.createElement('div');
            errorMessage.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #ff4444;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                z-index: 1000;
            `;
            errorMessage.textContent = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
            document.body.appendChild(errorMessage);
            setTimeout(() => errorMessage.remove(), 3000);
        }

        function cleanup() {
            if (player) {
                player.stopVideo();
                player.destroy();
            }
        }

        // Evento para limpiar recursos
        window.addEventListener('beforeunload', cleanup);

        // Inicializar controles al cargar la página
        document.addEventListener('DOMContentLoaded', () => {
            updatePlaylistDisplay();
            
            const searchInput = document.getElementById('search-input');
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchVideos();
                }
            });

            // Asegurarse de que el botón de búsqueda existe y tiene un evento
            const searchButton = document.querySelector('#search-container button');
            if (searchButton) {
                searchButton.addEventListener('click', searchVideos);
            }
        });