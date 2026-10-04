const VALID_IDS = ['DEMO-001'];
const API_KEY = ""; //it should be here between ""
const MODEL = "gemini-2.5-flash-preview-09-2025";

const state = {
    currentUser: null,
    isPlaying: false,
    player: null,
    history: [],
    currentLayer: 'core',
    currentPlatform: 'youtube',
    playerReady: false,
    recentSearches: [],
    playerInitialized: false
};

class AudioVisualizer {
    constructor() {
        this.canvas = document.getElementById('audio-visualizer');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 100;
        this.centerX = 0;
        this.centerY = 0;
        this.baseRadius = 80;
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.offsetWidth;
        this.canvas.height = parent.offsetHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    addParticle() {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 3;
        const size = 2 + Math.random() * 4;
        
        this.particles.push({
            x: this.centerX,
            y: this.centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            size: size,
            life: 1,
            decay: 0.01 + Math.random() * 0.02
        });

        if (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (state.isPlaying && Math.random() > 0.3) {
            this.addParticle();
        }

        const time = Date.now() * 0.001;
        for (let i = 0; i < 3; i++) {
            const radius = this.baseRadius + (Math.sin(time + i) * 20);
            const alpha = 0.2 + (Math.sin(time + i) * 0.1);
            
            this.ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.centerX, this.centerY, radius + (i * 30), 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            if (p.life > 0) {
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, `rgba(0, 242, 255, ${p.life})`);
                gradient.addColorStop(1, `rgba(0, 242, 255, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();

                return true;
            }
            return false;
        });
    }
}

class ThemeManager {
    constructor() {
        this.themes = {
            neutral: { name: 'Cyan Void', sentiment: 0 },
            positive: { name: 'Toxic Pulse', sentiment: 1 },
            negative: { name: 'Blood Circuit', sentiment: -1 },
            intense: { name: 'Violet Storm', sentiment: 2 }
        };
    }

    applyTheme(sentiment) {
        const root = document.documentElement;
        
        if (sentiment > 0.3) {
            root.setAttribute('data-theme', 'green');
            Terminal.log(`Theme: TOXIC PULSE [+${sentiment.toFixed(2)}]`, "SUCCESS");
        } else if (sentiment < -0.3) {
            root.setAttribute('data-theme', 'red');
            Terminal.log(`Theme: BLOOD CIRCUIT [${sentiment.toFixed(2)}]`, "ERROR");
        } else if (Math.abs(sentiment) > 0.6) {
            root.setAttribute('data-theme', 'purple');
            Terminal.log(`Theme: VIOLET STORM [${sentiment.toFixed(2)}]`);
        } else {
            root.removeAttribute('data-theme');
            Terminal.log(`Theme: CYAN VOID [${sentiment.toFixed(2)}]`);
        }
    }

    analyzeSentiment(text) {
        const positive = ['energetic', 'happy', 'uplifting', 'bright', 'euphoric', 'vibrant', 'positive', 'joyful', 'cheerful'];
        const negative = ['dark', 'sad', 'melancholic', 'aggressive', 'angry', 'intense', 'brutal', 'heavy', 'depressing'];
        
        const lowerText = text.toLowerCase();
        let score = 0;

        positive.forEach(word => {
            if (lowerText.includes(word)) score += 0.2;
        });

        negative.forEach(word => {
            if (lowerText.includes(word)) score -= 0.2;
        });

        return Math.max(-1, Math.min(1, score));
    }
}

class HashGenerator {
    static generate(text, timestamp) {
        const combined = text + timestamp;
        let hash = 0;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
        return `NH-${hex.substring(0, 4)}-${hex.substring(4, 8)}`;
    }
}

const Terminal = {
    log(message, type = 'INFO') {
        const logs = document.getElementById('terminal-logs');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const prefix = type === 'ERROR' ? '[ERR]' : type === 'SUCCESS' ? '[OK]' : '[SYS]';
        
        entry.innerHTML = `<span class="log-prefix">[${time}]${prefix}</span> ${message}`;
        
        if (type === 'ERROR') entry.style.color = '#ff2a6d';
        if (type === 'SUCCESS') entry.style.color = '#00ff9d';
        
        logs.insertBefore(entry, logs.firstChild);
        
        while (logs.children.length > 20) {
            logs.removeChild(logs.lastChild);
        }
    }
};

class Visualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.mesh = null;
    }

    init() {
        const container = document.getElementById('canvas-container');
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        const geometry = new THREE.TorusKnotGeometry(10, 3, 150, 20);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00f2ff,
            wireframe: true,
            transparent: true,
            opacity: 0.15
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.camera.position.z = 35;

        this.animate();
        
        window.addEventListener('resize', () => this.onResize());
        Terminal.log("3D Visualizer initialized");
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.mesh) {
            const speed = state.isPlaying ? 0.012 : 0.003;
            this.mesh.rotation.x += speed;
            this.mesh.rotation.y += speed;
            
            const targetScale = state.isPlaying ? 1.4 : 1.0;
            const targetOpacity = state.isPlaying ? 0.3 : 0.15;
            
            this.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            this.mesh.material.opacity += (targetOpacity - this.mesh.material.opacity) * 0.1;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

class PlayerManager {
    constructor() {
        this.player = null;
        this.playerReady = false;
        this.initAttempts = 0;
        this.maxAttempts = 5;
    }

    init() {
        if (typeof YT === 'undefined' || !YT.Player) {
            Terminal.log("YouTube API not loaded, retrying...", "ERROR");
            if (this.initAttempts < this.maxAttempts) {
                this.initAttempts++;
                setTimeout(() => this.init(), 1000);
            }
            return;
        }

        try {
            this.player = new YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: 'jfKfPfyJRdk',
                playerVars: {
                    'autoplay': 0,
                    'controls': 1,
                    'modestbranding': 1,
                    'rel': 0,
                    'showinfo': 0,
                    'fs': 1,
                    'playsinline': 1
                },
                events: {
                    'onReady': (e) => this.onReady(e),
                    'onStateChange': (e) => this.onStateChange(e),
                    'onError': (e) => this.onError(e)
                }
            });
            
            state.player = this.player;
            state.playerInitialized = true;
            Terminal.log("YouTube player initialized");
        } catch (error) {
            Terminal.log("Player init error: " + error.message, "ERROR");
        }
    }

    onReady(event) {
        this.playerReady = true;
        state.playerReady = true;
        Terminal.log("YouTube player ready", "SUCCESS");
    }

    onStateChange(event) {
        const playBtn = document.querySelector('#play-btn i');
        state.isPlaying = event.data === YT.PlayerState.PLAYING;
        
        if (state.isPlaying) {
            playBtn.className = 'fas fa-pause text-xl';
            Terminal.log("Playback: ACTIVE");
        } else {
            playBtn.className = 'fas fa-play text-xl ml-1';
            if (event.data === YT.PlayerState.PAUSED) {
                Terminal.log("Playback: PAUSED");
            }
        }
    }

    onError(event) {
        Terminal.log(`Player error: ${event.data}`, "ERROR");
    }

    togglePlay() {
        if (!this.player || !this.playerReady) {
            Terminal.log("Player not ready", "ERROR");
            return;
        }
        
        try {
            if (state.isPlaying) {
                this.player.pauseVideo();
            } else {
                this.player.playVideo();
            }
        } catch (error) {
            Terminal.log("Toggle play error: " + error.message, "ERROR");
        }
    }

    loadVideo(videoId) {
        if (this.player && this.playerReady && this.player.loadVideoById) {
            try {
                this.player.loadVideoById(videoId);
                Terminal.log(`Loading video: ${videoId}`);
            } catch (error) {
                Terminal.log("Load video error: " + error.message, "ERROR");
            }
        }
    }

    getCurrentTime() {
        try {
            return this.player && this.player.getCurrentTime ? this.player.getCurrentTime() : 0;
        } catch (error) {
            return 0;
        }
    }

    getDuration() {
        try {
            return this.player && this.player.getDuration ? this.player.getDuration() : 0;
        } catch (error) {
            return 0;
        }
    }
}

class PlatformManager {
    static switchPlatform(platform) {
        const tabs = document.querySelectorAll('.platform-tab');
        tabs.forEach(tab => {
            if (tab.dataset.platform === platform) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        document.getElementById('youtube-container').style.display = 'none';
        document.getElementById('spotify-container').style.display = 'none';
        document.getElementById('web-search-container').style.display = 'none';

        switch(platform) {
            case 'youtube':
                document.getElementById('youtube-container').style.display = 'block';
                break;
            case 'spotify':
                document.getElementById('spotify-container').style.display = 'block';
                break;
            case 'web':
                document.getElementById('web-search-container').style.display = 'block';
                break;
        }

        state.currentPlatform = platform;
        Terminal.log(`Switched to platform: ${platform.toUpperCase()}`);
    }

    static updatePlatformLinks(searchQuery) {
        const query = encodeURIComponent(searchQuery);
        
        document.getElementById('link-spotify').href = `https://open.spotify.com/search/${query}`;
        document.getElementById('link-youtube').href = `https://www.youtube.com/results?search_query=${query}`;
        document.getElementById('link-apple').href = `https://music.apple.com/us/search?term=${query}`;
        document.getElementById('link-soundcloud').href = `https://soundcloud.com/search?q=${query}`;
        document.getElementById('link-google').href = `https://www.google.com/search?q=${query}+music`;

        const spotifyContainer = document.getElementById('spotify-container');
        spotifyContainer.innerHTML = `
            <div class="platform-overlay">
                <div class="text-center">
                    <i class="fab fa-spotify text-6xl mb-4 text-[#1DB954]"></i>
                    <p class="text-lg mb-4">Listen on Spotify</p>
                    <a href="https://open.spotify.com/search/${query}" target="_blank" 
                       class="inline-block px-6 py-3 bg-[#1DB954] text-white rounded-full hover:bg-[#1ed760] transition">
                        <i class="fab fa-spotify mr-2"></i>Open Spotify
                    </a>
                </div>
            </div>
        `;

        document.getElementById('platform-links').classList.remove('hidden');

        Terminal.log(`Platform links updated for: ${searchQuery}`);
    }

    static updateWebSearch(searchQuery) {
        const query = encodeURIComponent(searchQuery);
        const webContainer = document.getElementById('web-search-container');
        webContainer.innerHTML = `
            <div class="platform-overlay">
                <div class="text-center">
                    <i class="fas fa-search text-6xl mb-4 text-cyan-400"></i>
                    <p class="text-lg mb-4">Search for: "${searchQuery}"</p>
                    <a href="https://www.google.com/search?q=${query}+music" target="_blank" 
                       class="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full hover:from-cyan-400 hover:to-blue-500 transition">
                        <i class="fab fa-google mr-2"></i>Search Google
                    </a>
                    <a href="https://www.youtube.com/results?search_query=${query}" target="_blank" 
                       class="inline-block px-6 py-3 ml-3 bg-red-600 text-white rounded-full hover:bg-red-500 transition">
                        <i class="fab fa-youtube mr-2"></i>Search YouTube
                    </a>
                </div>
            </div>
        `;
    }
}

class ResearchManager {
    static init() {
        document.getElementById('research-btn').addEventListener('click', () => {
            this.searchWeb();
        });

        document.getElementById('research-query').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeb();
        });

        document.querySelectorAll('.research-quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                document.getElementById('research-query').value = query;
                this.searchWeb(query);
            });
        });
    }

    static searchWeb(customQuery = null) {
        const query = customQuery || document.getElementById('research-query').value;
        
        if (!query.trim()) {
            Terminal.log("Research: No query provided", "ERROR");
            return;
        }

        if (!state.recentSearches.includes(query)) {
            state.recentSearches.unshift(query);
            if (state.recentSearches.length > 5) state.recentSearches.pop();
            this.updateRecentSearches();
        }

        const encodedQuery = encodeURIComponent(query + ' music');
        const researchFrame = document.getElementById('research-frame');
        researchFrame.src = `https://www.google.com/search?igu=1&q=${encodedQuery}`;

        Terminal.log(`Research search: "${query}"`);
    }

    static updateRecentSearches() {
        const container = document.getElementById('recent-searches');
        if (state.recentSearches.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500 italic">No recent searches yet...</p>';
            return;
        }

        container.innerHTML = state.recentSearches.map(query => `
            <div class="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer" onclick="ResearchManager.searchWeb('${query.replace(/'/g, "\\'")}')">
                <p class="text-sm">${query}</p>
                <p class="text-xs text-gray-500">Click to search again</p>
            </div>
        `).join('');
    }
}

class App {
    constructor() {
        this.visualizer = new Visualizer();
        this.playerManager = new PlayerManager();
        this.audioVisualizer = null;
        this.themeManager = new ThemeManager();
    }

    init() {
        this.setupLogin();
        this.setupNavigation();
        this.setupControls();
        this.setupPlatformTabs();
        ResearchManager.init();
        this.startTelemetry();
        this.loadYouTubeAPI();
    }

    loadYouTubeAPI() {
        if (typeof YT !== 'undefined') {
            this.playerManager.init();
            return;
        }

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            Terminal.log("YouTube API loaded");
            this.playerManager.init();
        };
    }

    setupLogin() {
        const loginBtn = document.getElementById('login-btn');
        const input = document.getElementById('neural-id-input');

        const attemptLogin = () => {
            const id = input.value.trim();
            
            if (!id) {
                Terminal.log("Login failed: No ID provided", "ERROR");
                return;
            }

            if (VALID_IDS.includes(id)) {
                this.loginUser(id);
            } else {
                Terminal.log("Access denied: Invalid Neural ID", "ERROR");
                alert('ACCESS DENIED: Invalid Neural ID');
                input.value = '';
            }
        };

        loginBtn.addEventListener('click', attemptLogin);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptLogin();
        });
    }

    loginUser(neuralId) {
        state.currentUser = neuralId;
        
        const stored = localStorage.getItem(`saifouna_history_${neuralId}`);
        state.history = stored ? JSON.parse(stored) : [];

        const recentSearches = localStorage.getItem(`saifouna_searches_${neuralId}`);
        state.recentSearches = recentSearches ? JSON.parse(recentSearches) : [];

        Terminal.log(`Neural ID verified: ${neuralId}`, "SUCCESS");
        Terminal.log("Initializing NEURO-OS...");

        const loginScreen = document.getElementById('login-screen');
        const appContainer = document.getElementById('app-container');
        const terminal = document.getElementById('terminal-console');

        gsap.to(loginScreen, {
            opacity: 0,
            duration: 1,
            onComplete: () => {
                loginScreen.style.display = 'none';
                appContainer.classList.remove('hidden');
                terminal.classList.remove('hidden');
                gsap.to(appContainer, { opacity: 1, duration: 1 });
                
                this.initializeApp();
            }
        });

        document.getElementById('operator-name').textContent = `OPERATOR`;
        document.getElementById('operator-id').textContent = `ID: #${neuralId}`;
    }

    initializeApp() {
        this.visualizer.init();
        this.audioVisualizer = new AudioVisualizer();
        this.updateHistoryUI();
        this.startProgressUpdater();
        ResearchManager.updateRecentSearches();
        Terminal.log("All systems online", "SUCCESS");
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetLayer = btn.dataset.layer;
                this.switchLayer(targetLayer);
            });
        });
    }

    setupPlatformTabs() {
        document.querySelectorAll('.platform-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                PlatformManager.switchPlatform(platform);
            });
        });
    }

    switchLayer(layerName) {
        Terminal.log(`Switching to layer: ${layerName.toUpperCase()}`);
        
        const layers = document.querySelectorAll('.layer');
        const navBtns = document.querySelectorAll('.nav-btn');
        
        layers.forEach(layer => {
            if (layer.id === `${layerName}-layer`) {
                layer.classList.add('active');
                
                gsap.fromTo(layer,
                    { 
                        opacity: 0, 
                        x: 30,
                        filter: 'blur(20px) hue-rotate(90deg)',
                        scale: 0.95
                    },
                    { 
                        opacity: 1, 
                        x: 0,
                        filter: 'blur(0px) hue-rotate(0deg)',
                        scale: 1,
                        duration: 0.8,
                        ease: 'power3.out'
                    }
                );
            } else {
                layer.classList.remove('active');
            }
        });

        navBtns.forEach(btn => {
            if (btn.dataset.layer === layerName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        state.currentLayer = layerName;
    }

    setupControls() {
        document.getElementById('execute-btn').addEventListener('click', () => {
            this.generateTrack();
        });

        document.getElementById('play-btn').addEventListener('click', () => {
            this.playerManager.togglePlay();
        });

        document.getElementById('progress-bar').addEventListener('click', (e) => {
            const bar = e.currentTarget;
            const rect = bar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const duration = this.playerManager.getDuration();
            
            if (duration > 0 && this.playerManager.player && this.playerManager.player.seekTo) {
                try {
                    this.playerManager.player.seekTo(duration * percent);
                    Terminal.log(`Seeking to ${Math.floor(percent * 100)}%`);
                } catch (error) {
                    Terminal.log("Seek error: " + error.message, "ERROR");
                }
            }
        });

        document.getElementById('clear-archives-btn').addEventListener('click', () => {
            if (confirm('Purge all neural archives?')) {
                this.clearHistory();
            }
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Disconnect from Neural Network?')) {
                if (state.currentUser) {
                    localStorage.setItem(`saifouna_searches_${state.currentUser}`, 
                        JSON.stringify(state.recentSearches));
                }
                
                Terminal.log("Disconnecting...", "ERROR");
                setTimeout(() => location.reload(), 1000);
            }
        });

        document.getElementById('uplink-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUplinkSubmit(e.target);
        });
    }

    async handleUplinkSubmit(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>TRANSMITTING...';
        
        Terminal.log("Initiating uplink transmission...");

        try {
            const formData = new FormData(form);
            
            const emailBody = `
New SAIFOUNA Operator Uplink

Operator: ${formData.get('operator_name')}
Email: ${formData.get('email')}

Neural Preferences:
${formData.get('preferences')}

---
Sent from SAIFOUNA NEURO-OS
Neural ID: ${state.currentUser}
Timestamp: ${new Date().toLocaleString()}
            `.trim();

            const accessKey = ""; //It should be here between ""
            
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    access_key: accessKey,
                    subject: 'New SAIFOUNA Operator Uplink',
                    from_name: 'SAIFOUNA NEURO-OS',
                    message: emailBody
                })
            });

            const result = await response.json();

            if (result.success) {
                Terminal.log("Uplink transmission successful", "SUCCESS");
                alert('✓ Data transmitted successfully!');
                form.reset();
            } else {
                throw new Error(result.message || 'Transmission failed');
            }

        } catch (error) {
            console.error(error);
            Terminal.log("Uplink transmission failed", "ERROR");
            Terminal.log(error.message, "ERROR");
            alert('✗ Transmission failed. Check console for details.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    async generateTrack() {
        const prompt = document.getElementById('neural-prompt').value.trim();
        
        if (!prompt) {
            Terminal.log("Error: No neural prompt provided", "ERROR");
            return;
        }

        // The Gemini API key is needed for this functionality
        if (!API_KEY) {
            Terminal.log("API key not configured. Demo mode activated.", "ERROR");
            this.demoMode(prompt);
            return;
        }

        const btn = document.getElementById('execute-btn');
        const loader = document.getElementById('track-loader');
        const display = document.getElementById('track-display');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>PROCESSING';
        loader.classList.remove('hidden');
        display.style.opacity = '0.5';

        Terminal.log(`Neural synthesis request: "${prompt}"`);
        Terminal.log("Connecting to Gemini AI uplink...");

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Create a music concept for: "${prompt}". Return ONLY valid JSON with no markdown formatting: {"title": "creative track title", "description": "brief 1-sentence description", "searchQuery": "youtube search term for this music style", "genres": ["genre1", "genre2"], "mood": "mood description"}`
                            }]
                        }]
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const rawText = data.candidates[0].content.parts[0].text;
            const cleanText = rawText.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanText);

            const sentiment = this.themeManager.analyzeSentiment(prompt + ' ' + result.description);
            this.themeManager.applyTheme(sentiment);

            Terminal.log(`Track synthesized: "${result.title}"`, "SUCCESS");

            document.getElementById('track-title').textContent = result.title.toUpperCase();
            document.getElementById('track-description').textContent = result.description;

            let videoId = await this.findYoutubeVideo(result.searchQuery);
            
            if (!videoId) {
                videoId = 'jfKfPfyJRdk';
                Terminal.log("Using fallback video ID", "ERROR");
            }

            this.playerManager.loadVideo(videoId);

            const timestamp = Date.now();
            const neuralHash = HashGenerator.generate(prompt + result.title, timestamp);

            const historyItem = {
                ...result,
                videoId,
                prompt,
                timestamp,
                neuralHash,
                sentiment: sentiment.toFixed(2),
                date: new Date(timestamp).toLocaleString()
            };

            state.history.unshift(historyItem);
            if (state.history.length > 50) state.history.pop();

            this.saveHistory();
            this.updateHistoryUI();

            PlatformManager.updatePlatformLinks(result.searchQuery);
            PlatformManager.updateWebSearch(result.searchQuery);

            Terminal.log(`Video loaded: ${videoId}`);
            Terminal.log(`Neural Hash: ${neuralHash}`, "SUCCESS");

        } catch (error) {
            console.error(error);
            Terminal.log("Neural synthesis failed", "ERROR");
            Terminal.log(error.message, "ERROR");
            alert('Synthesis failed. Check console for details.');
        } finally {
            loader.classList.add('hidden');
            display.style.opacity = '1';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bolt mr-2"></i>EXECUTE';
        }
    }

    demoMode(prompt) {
        // Demo mode for presentation without API key
        const btn = document.getElementById('execute-btn');
        const loader = document.getElementById('track-loader');
        const display = document.getElementById('track-display');
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>DEMO MODE';
        loader.classList.remove('hidden');
        display.style.opacity = '0.5';

        Terminal.log(`Demo mode activated for: "${prompt}"`);
        
        // Simulate API delay
        setTimeout(() => {
            const demoResults = {
                "Dark Phonk in Tokyo Rain": {
                    title: "Neon Drizzle - Tokyo Midnight",
                    description: "Dark phonk beats with heavy bass and cyberpunk atmosphere",
                    searchQuery: "dark phonk tokyo rain",
                    genres: ["Phonk", "Dark Trap", "Cyberpunk"],
                    mood: "dark atmospheric"
                },
                "Cyberpunk Chase Music": {
                    title: "Circuit Chase - Neon Escape",
                    description: "High-energy synthwave for futuristic chase sequences",
                    searchQuery: "cyberpunk chase music synthwave",
                    genres: ["Synthwave", "Cyberpunk", "Electronic"],
                    mood: "energetic intense"
                },
                "Lofi Study Beats for Rainy Day": {
                    title: "Rainy Window - Lofi Study Session",
                    description: "Calm lofi hip hop with rain sounds for focused studying",
                    searchQuery: "lofi study beats rainy day",
                    genres: ["Lofi", "Chillhop", "Ambient"],
                    mood: "calm relaxing"
                }
            };

            let result;
            if (demoResults[prompt]) {
                result = demoResults[prompt];
            } else {
                // Default response for other prompts
                result = {
                    title: "Neural Synthesis - " + prompt.substring(0, 20),
                    description: "AI-generated music based on your neural input: " + prompt,
                    searchQuery: prompt + " music",
                    genres: ["Experimental", "AI-Generated", "Electronic"],
                    mood: "experimental"
                };
            }

            const sentiment = this.themeManager.analyzeSentiment(prompt + ' ' + result.description);
            this.themeManager.applyTheme(sentiment);

            Terminal.log(`Track synthesized: "${result.title}"`, "SUCCESS");

            document.getElementById('track-title').textContent = result.title.toUpperCase();
            document.getElementById('track-description').textContent = result.description;

            // Use fallback video for demo
            this.playerManager.loadVideo('jfKfPfyJRdk');

            const timestamp = Date.now();
            const neuralHash = HashGenerator.generate(prompt + result.title, timestamp);

            const historyItem = {
                ...result,
                videoId: 'jfKfPfyJRdk',
                prompt,
                timestamp,
                neuralHash,
                sentiment: sentiment.toFixed(2),
                date: new Date(timestamp).toLocaleString()
            };

            state.history.unshift(historyItem);
            if (state.history.length > 50) state.history.pop();

            this.saveHistory();
            this.updateHistoryUI();

            PlatformManager.updatePlatformLinks(result.searchQuery);
            PlatformManager.updateWebSearch(result.searchQuery);

            Terminal.log(`Demo video loaded`, "SUCCESS");
            Terminal.log(`Neural Hash: ${neuralHash}`, "SUCCESS");

            loader.classList.add('hidden');
            display.style.opacity = '1';
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-bolt mr-2"></i>EXECUTE';
        }, 1500);
    }

    async findYoutubeVideo(query) {
        try {
            // In demo mode, just return a fallback video
            return 'jfKfPfyJRdk'; // Lofi hip hop radio - beats to relax/study to
        } catch (error) {
            console.error("YouTube search failed:", error);
            return null;
        }
    }

    updateHistoryUI() {
        const container = document.getElementById('history-container');
        const clearBtn = document.getElementById('clear-archives-btn');

        if (state.history.length === 0) {
            container.innerHTML = `
                <div class="glass-card p-8 text-center text-gray-600">
                    <i class="fas fa-database text-4xl mb-4 opacity-30"></i>
                    <p class="italic">No previous neural sessions found...</p>
                    <p class="text-xs mt-2 opacity-50">Neural hashes will appear here after synthesis</p>
                </div>
            `;
            clearBtn.classList.add('hidden');
            return;
        }

        clearBtn.classList.remove('hidden');

        container.innerHTML = state.history.map((item, index) => `
            <div class="glass-card history-item p-6 border-l-4 border-cyan-900" onclick="app.loadHistoryTrack(${index})">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h3 class="font-bold text-lg text-white mb-1">${item.title}</h3>
                        <div class="flex items-center gap-3 text-[10px] font-mono">
                            <span class="text-cyan-500">${item.neuralHash || 'NH-LEGACY'}</span>
                            <span class="text-gray-600">•</span>
                            <span class="text-gray-500">SENTIMENT: ${item.sentiment || '0.00'}</span>
                        </div>
                    </div>
                    <span class="text-xs text-gray-600 font-mono">${item.date || new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <p class="text-sm text-cyan-500 mb-2 uppercase tracking-wide">${item.prompt}</p>
                <p class="text-xs text-gray-500 leading-relaxed">${item.description}</p>
                ${item.genres ? `<div class="flex flex-wrap gap-2 mt-3">
                    ${item.genres.map(genre => `<span class="px-2 py-1 bg-cyan-900/30 text-cyan-400 text-xs rounded">${genre}</span>`).join('')}
                </div>` : ''}
            </div>
        `).join('');
    }

    loadHistoryTrack(index) {
        const item = state.history[index];
        if (!item) return;

        Terminal.log(`Loading from archives: "${item.title}"`);

        document.getElementById('track-title').textContent = item.title.toUpperCase();
        document.getElementById('track-description').textContent = item.description;
        document.getElementById('neural-prompt').value = item.prompt;

        this.playerManager.loadVideo(item.videoId);
        
        if (item.searchQuery) {
            PlatformManager.updatePlatformLinks(item.searchQuery);
            PlatformManager.updateWebSearch(item.searchQuery);
        }
        
        this.switchLayer('core');
    }

    clearHistory() {
        state.history = [];
        this.saveHistory();
        this.updateHistoryUI();
        Terminal.log("Archives purged", "SUCCESS");
    }

    saveHistory() {
        if (state.currentUser) {
            localStorage.setItem(`saifouna_history_${state.currentUser}`, JSON.stringify(state.history));
        }
    }

    startProgressUpdater() {
        setInterval(() => {
            const current = this.playerManager.getCurrentTime();
            const total = this.playerManager.getDuration();

            if (total > 0) {
                const percent = (current / total) * 100;
                document.getElementById('progress-fill').style.width = percent + '%';
                document.getElementById('time-current').textContent = this.formatTime(current);
                document.getElementById('time-total').textContent = this.formatTime(total);
            }
        }, 500);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    startTelemetry() {
        setInterval(() => {
            const sync = (98 + Math.random() * 2).toFixed(1);
            const latency = Math.floor(8 + Math.random() * 12);

            document.getElementById('sync-value').textContent = sync + '%';
            document.getElementById('latency-value').textContent = latency + 'ms';
        }, 3000);
    }
}

const app = new App();
window.app = app;
window.PlatformManager = PlatformManager;
window.ResearchManager = ResearchManager;

app.init();

Terminal.log("NEURO-OS kernel loaded");
Terminal.log("Awaiting neural handshake...");
