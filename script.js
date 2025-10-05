// Audio context for sound effects
let audioContext;
let sounds = {};

// Initialize audio context and create sound effects
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSounds();
    } catch (error) {
        console.log('Audio not supported');
    }
}

// Create subtle sound effects
function createSounds() {
    // Hover sound - soft chime
    sounds.hover = () => {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    };
    
    // Click sound - soft pop
    sounds.click = () => {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
    };
    
    // Expand sound - gentle whoosh
    sounds.expand = () => {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };
    
    // Collapse sound - reverse whoosh
    sounds.collapse = () => {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    };
}

// Play sound effect
function playSound(soundName) {
    if (sounds[soundName]) {
        sounds[soundName]();
    }
}

// Game data and iframe management
class GameManager {
    constructor() {
        this.gamesData = {
            games: [
                {
                    id: "snake-game",
                    title: "Snake Game",
                    description: "Classic snake game with multiple themes",
                    icon: "🐍",
                    status: "Complete",
                    category: "games",
                    versions: [
                        { name: "Classic", path: "Games/Snake/snake-game.html" },
                        { name: "Nature", path: "Games/Snake/nature-organic-snake.html" },
                        { name: "Neon", path: "Games/Snake/neon-cyber-snake.html" },
                        { name: "Space", path: "Games/Snake/space-cosmic-snake.html" }
                    ]
                },
                {
                    id: "verbal-memory-grid",
                    title: "Verbal Memory Grid",
                    description: "Test your verbal memory skills",
                    icon: "🧠",
                    status: "Complete",
                    category: "games",
                    versions: [
                        { name: "Original", path: "Games/Verbal%20Memory%20Grid/index.html" }
                    ]
                },
                {
                    id: "orb-survival",
                    title: "Orb Survival",
                    description: "Survival game with orb-based gameplay",
                    icon: "🛡️",
                    status: "In Progress",
                    category: "games",
                    versions: [
                        { name: "Version A1", path: "Games/Orb%20Survival/Orb%20Survival%20A1/index.html" },
                        { name: "Version A2", path: "Games/Orb%20Survival/Version%20A2/index.html" }
                    ]
                },
                {
                    id: "pi-trainer",
                    title: "Pi Trainer",
                    description: "Train your memory with Pi digits",
                    icon: "🧮",
                    status: "In Progress",
                    category: "games",
                    versions: [
                        { name: "Main Version", path: "Games/PiTrainer/index.html" },
                        { name: "Nature Organic", path: "Games/PiTrainer/pitrainer-nature-organic.html" },
                        { name: "Retro Vaporwave", path: "Games/PiTrainer/pitrainer-retro-vaporwave.html" },
                        { name: "Minimalist Glass", path: "Games/PiTrainer/pitrainer-minimalist-glass.html" }
                    ]
                },
                {
                    id: "top-down-survival",
                    title: "Top-Down Survival",
                    description: "Survival game with top-down perspective",
                    icon: "🏃",
                    status: "Early Concept",
                    category: "games",
                    versions: [
                        { name: "Main Version", path: "Games/Top-Down%20Survival%20Game/index.html" }
                    ]
                },
                {
                    id: "orb-royale",
                    title: "Orb Royale",
                    description: "Battle royale game with orb mechanics",
                    icon: "⚔️",
                    status: "Early Concept",
                    category: "games",
                    versions: [
                        { name: "Main Version", path: "Games/Orb Royale/index.html" }
                    ]
                }
            ],
            tools: [
                {
                    id: "password-analyzer",
                    title: "Password Analyzer",
                    description: "Analyze and improve your password security",
                    icon: "🔐",
                    status: "Complete",
                    category: "tools",
                    versions: [
                        { name: "Main Version", path: "Tools/Password%20Analyzer/password-analyzer.html" }
                    ]
                },
                {
                    id: "task-board",
                    title: "Task Board",
                    description: "Organize tasks with multiple visual themes",
                    icon: "📋",
                    status: "In Progress",
                    category: "tools",
                    versions: [
                        { name: "Default", path: "Tools/Task%20Board/index.html" },
                        { name: "Cyberpunk", path: "Tools/Task%20Board/cyberpunk.html" },
                        { name: "Doom Metal", path: "Tools/Task%20Board/doom-metal.html" },
                        { name: "Doom Reimagined", path: "Tools/Task%20Board/doom-reimagined.html" },
                        { name: "Impressionist", path: "Tools/Task%20Board/impressionist.html" },
                        { name: "Kawaii", path: "Tools/Task%20Board/kawaii.html" },
                        { name: "Minimalist", path: "Tools/Task%20Board/minimalist.html" },
                        { name: "Neopets", path: "Tools/Task%20Board/neopets.html" },
                        { name: "Rainbow", path: "Tools/Task%20Board/rainbow.html" },
                        { name: "Surrealist", path: "Tools/Task%20Board/surrealist.html" }
                    ]
                },
                {
                    id: "pantry-tracker",
                    title: "Pantry Tracker",
                    description: "Track food items and expiration dates",
                    icon: "🍎",
                    status: "In Progress",
                    category: "tools",
                    versions: [
                        { name: "Original Design", path: "tools/pantry tracker/pantry-tracker-a1.html" },
                        { name: "Neon Cyberpunk", path: "tools/pantry tracker/pantry-tracker-neon-cyberpunk.html" },
                        { name: "Nature Organic", path: "tools/pantry tracker/pantry-tracker-nature-organic.html" },
                        { name: "Minimal Glass", path: "tools/pantry tracker/pantry-tracker-minimal-glass.html" },
                        { name: "Vintage Kitchen", path: "tools/pantry tracker/pantry-tracker-vintage-kitchen.html" }
                    ]
                },
                {
                    id: "notes",
                    title: "Notes",
                    description: "Minimalist note taking with auto-save and beautiful design",
                    icon: "📝",
                    status: "Early Concept",
                    category: "tools",
                    versions: [
                        { name: "Minimalist Dark", path: "tools/notes/notes.html" }
                    ]
                }
            ],
            feedback: [
                {
                    id: "send-bug-notes",
                    title: "Send Bug Notes",
                    description: "Report bugs or issues you've encountered",
                    icon: "🐛",
                    status: "Complete",
                    category: "feedback",
                    versions: [
                        { name: "Bug Report Form", path: "https://forms.gle/8CndsP9zxMvh3om5A" }
                    ]
                },
                {
                    id: "give-ideas-inspiration",
                    title: "Give Ideas/Inspiration",
                    description: "Share your ideas and suggestions for new projects",
                    icon: "💡",
                    status: "Complete",
                    category: "feedback",
                    versions: [
                        { name: "Ideas Form", path: "https://forms.gle/2XRrKB2atyQ91xZF8" }
                    ]
                },
                {
                    id: "general-feedback",
                    title: "General Feedback",
                    description: "Share your thoughts and general feedback",
                    icon: "💬",
                    status: "Complete",
                    category: "feedback",
                    versions: [
                        { name: "Feedback Form", path: "https://forms.gle/1Z39SUWsZx7fcSP3A" }
                    ]
                }
            ]
        };
        this.iframeOverlay = document.getElementById('iframeOverlay');
        this.gameFrame = document.getElementById('gameFrame');
        this.closeButton = document.getElementById('closeButton');
        this.init();
    }
    
    init() {
        this.renderCategories();
        this.setupIframeHandlers();
    }
    
    renderCategories() {
        const categoriesContainer = document.getElementById('categories');
        
        // Render Games category
        if (this.gamesData.games.length > 0) {
            categoriesContainer.appendChild(this.createCategory('games', '🎮 Games', this.gamesData.games));
        }
        
        // Render Tools category
        if (this.gamesData.tools.length > 0) {
            categoriesContainer.appendChild(this.createCategory('tools', '🛠️ Tools', this.gamesData.tools));
        }
        
        // Render Feedback category
        if (this.gamesData.feedback.length > 0) {
            categoriesContainer.appendChild(this.createCategory('feedback', '💬 Feedback', this.gamesData.feedback));
        }
        
        // Initialize interactions after rendering
        this.initializeInteractions();
    }
    
    createCategory(categoryId, title, items) {
        const category = document.createElement('div');
        category.className = 'category';
        category.setAttribute('data-category', categoryId);
        
        const projectGrid = document.createElement('div');
        projectGrid.className = 'project-grid';
        
        if (items.length === 0) {
            // Empty category message
            projectGrid.innerHTML = `
                <div class="empty-category">
                    <p>No projects yet</p>
                </div>
            `;
        } else {
            items.forEach(item => {
                const projectGroup = this.createProjectGroup(item);
                projectGrid.appendChild(projectGroup);
            });
        }
        
        // Extract emoji and text from title (handle multi-byte emojis properly)
        const emojiMatch = title.match(/^(\p{Emoji}\uFE0F?)/u);
        const emoji = emojiMatch ? emojiMatch[1] : '';
        const text = emojiMatch ? title.slice(emojiMatch[0].length).trim() : title;
        
        category.innerHTML = `
            <div class="category-header">
                <h2 class="category-title"><span class="emoji">${emoji}</span> ${text}</h2>
                <div class="category-toggle">
                    <span class="toggle-icon">+</span>
                </div>
            </div>
            <div class="category-content">
            </div>
        `;
        
        category.querySelector('.category-content').appendChild(projectGrid);
        return category;
    }
    
    createProjectGroup(item) {
        const projectGroup = document.createElement('div');
        projectGroup.className = 'project-group';
        
        // Handle both single path and versions array
        let versionsHtml = '';
        if (item.versions && Array.isArray(item.versions)) {
            versionsHtml = item.versions.map(version => 
                `<div class="version-card" data-path="${version.path}" data-sound="hover">
                    <span class="version-name">${version.name}</span>
                </div>`
            ).join('');
        } else if (item.path) {
            versionsHtml = `<div class="version-card" data-path="${item.path}" data-sound="hover">
                <span class="version-name">Play</span>
            </div>`;
        }
        
        projectGroup.innerHTML = `
            <div class="project-main-card" data-sound="hover">
                <div class="project-icon"><span class="emoji">${item.icon}</span></div>
                <h3 class="project-title">${item.title}</h3>
                <p class="project-description">${item.description}</p>
                <div class="project-status" data-status="${item.status}">${item.status}</div>
                <div class="version-indicator">${item.versions ? item.versions.length : 1} version${(item.versions ? item.versions.length : 1) !== 1 ? 's' : ''}</div>
            </div>
            <div class="project-versions">
                ${versionsHtml}
            </div>
        `;
        
        return projectGroup;
    }
    
    initializeInteractions() {
        // Category toggles
        document.querySelectorAll('.category-header').forEach(header => {
            header.addEventListener('click', () => {
                const category = header.closest('.category');
                this.toggleCategory(category);
            });
            
            header.setAttribute('tabindex', '0');
            header.setAttribute('role', 'button');
            header.setAttribute('aria-expanded', 'false');
        });
        
        // Project main cards (expand/collapse versions)
        document.querySelectorAll('.project-main-card').forEach(card => {
            card.addEventListener('mouseenter', () => playSound('hover'));
            
            card.addEventListener('click', (e) => {
                e.preventDefault();
                playSound('click');
                
                const projectGroup = card.closest('.project-group');
                this.toggleProjectGroup(projectGroup);
            });
        });
        
        // Version cards (open in iframe or new tab)
        document.querySelectorAll('.version-card').forEach(card => {
            card.addEventListener('mouseenter', () => playSound('hover'));
            
            card.addEventListener('click', (e) => {
                e.preventDefault();
                playSound('click');
                
                const path = card.getAttribute('data-path');
                const projectGroup = card.closest('.project-group');
                const category = projectGroup.closest('.category');
                const categoryId = category.getAttribute('data-category');
                
                // If it's a feedback link, open in new tab
                if (categoryId === 'feedback') {
                    if (path !== '#') {
                        window.open(path, '_blank');
                    }
                } else {
                    // For games and tools, open in iframe
                    this.openGame(path);
                }
            });
        });
    }
    
    toggleCategory(category) {
        const isExpanded = category.classList.contains('expanded');
        const header = category.querySelector('.category-header');
        const emoji = header.querySelector('.category-title .emoji');
        
        if (isExpanded) {
            // If already expanded, just collapse it
            category.classList.remove('expanded');
            header.setAttribute('aria-expanded', 'false');
            playSound('collapse');
            
            // Add collapse animation (counter-clockwise)
            if (emoji) {
                emoji.classList.add('collapsed');
                setTimeout(() => {
                    emoji.classList.remove('collapsed');
                }, 600);
            }
        } else {
            // Close all other expanded categories first
            document.querySelectorAll('.category.expanded').forEach(expandedCategory => {
                if (expandedCategory !== category) {
                    expandedCategory.classList.remove('expanded');
                    expandedCategory.querySelector('.category-header').setAttribute('aria-expanded', 'false');
                }
            });
            
            // Then expand the clicked category
            category.classList.add('expanded');
            header.setAttribute('aria-expanded', 'true');
            playSound('expand');
            
            // Add expand animation (clockwise)
            if (emoji) {
                emoji.classList.add('expanded');
                setTimeout(() => {
                    emoji.classList.remove('expanded');
                }, 600);
            }
        }
    }
    
    toggleProjectGroup(projectGroup) {
        const isExpanded = projectGroup.classList.contains('expanded');
        const emoji = projectGroup.querySelector('.project-icon .emoji');
        
        if (isExpanded) {
            // If already expanded, just collapse it
            projectGroup.classList.remove('expanded');
            playSound('collapse');
            
            // Add collapse animation (counter-clockwise)
            if (emoji) {
                emoji.classList.add('collapsed');
                setTimeout(() => {
                    emoji.classList.remove('collapsed');
                }, 600);
            }
        } else {
            // Close all other expanded project groups first
            document.querySelectorAll('.project-group.expanded').forEach(expandedGroup => {
                if (expandedGroup !== projectGroup) {
                    expandedGroup.classList.remove('expanded');
                }
            });
            
            // Then expand the clicked project group
            projectGroup.classList.add('expanded');
            playSound('expand');
            
            // Add expand animation (clockwise)
            if (emoji) {
                emoji.classList.add('expanded');
                setTimeout(() => {
                    emoji.classList.remove('expanded');
                }, 600);
            }
        }
    }
    
    openGame(path) {
        this.gameFrame.src = path;
        this.iframeOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeGame() {
        this.iframeOverlay.classList.remove('active');
        this.gameFrame.src = '';
        document.body.style.overflow = '';
        playSound('click');
    }
    
    setupIframeHandlers() {
        // Close button
        this.closeButton.addEventListener('click', () => {
            this.closeGame();
        });
        
        // Close on overlay click
        this.iframeOverlay.addEventListener('click', (e) => {
            if (e.target === this.iframeOverlay) {
                this.closeGame();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.iframeOverlay.classList.contains('active')) {
                this.closeGame();
            }
        });
    }
}

// Smooth scrolling and page animations
class AnimationManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add page load animation
        this.setupPageLoadAnimation();
        
        // Add background animation
        this.setupBackgroundAnimation();
    }
    
    setupPageLoadAnimation() {
        // Add loading state
        document.body.classList.add('loading');
        
        // Remove loading state after page is fully loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.classList.remove('loading');
            }, 500);
        });
    }
    
    setupBackgroundAnimation() {
        // Background animations are now handled in CSS for better performance
        // This method is kept for potential future enhancements
    }
}

// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('selectedTheme') || 'default';
        this.themeUrls = {
            'default': '',
            'minimalist': 'alternative home pages/minimalist-clean.html',
            'cyberpunk': 'alternative home pages/cyberpunk-neon.html',
            'nature': 'alternative home pages/nature-organic.html',
            'vintage': 'alternative home pages/vintage-retro.html'
        };
        this.init();
    }
    
    init() {
        this.setupThemeButtons();
        this.setActiveTheme();
    }
    
    setupThemeButtons() {
        const themeButtons = document.querySelectorAll('.theme-btn');
        const leftArrow = document.querySelector('.theme-nav-left');
        const rightArrow = document.querySelector('.theme-nav-right');
        const themeOptions = document.querySelector('.theme-options');
        
        themeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const theme = button.getAttribute('data-theme');
                this.switchTheme(theme);
                playSound('click');
            });
            
            button.addEventListener('mouseenter', () => playSound('hover'));
        });
        
        // Arrow navigation
        if (leftArrow && rightArrow && themeOptions) {
            leftArrow.addEventListener('click', () => {
                themeOptions.scrollBy({ left: -48, behavior: 'smooth' });
                playSound('click');
            });
            
            rightArrow.addEventListener('click', () => {
                themeOptions.scrollBy({ left: 48, behavior: 'smooth' });
                playSound('click');
            });
            
            leftArrow.addEventListener('mouseenter', () => playSound('hover'));
            rightArrow.addEventListener('mouseenter', () => playSound('hover'));
            
            // Update arrow states based on scroll position
            const updateArrows = () => {
                const scrollLeft = themeOptions.scrollLeft;
                const maxScroll = themeOptions.scrollWidth - themeOptions.clientWidth;
                
                leftArrow.disabled = scrollLeft <= 0;
                rightArrow.disabled = scrollLeft >= maxScroll;
            };
            
            themeOptions.addEventListener('scroll', updateArrows);
            updateArrows(); // Initial state
        }
    }
    
    setActiveTheme() {
        const themeButtons = document.querySelectorAll('.theme-btn');
        themeButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-theme') === this.currentTheme) {
                button.classList.add('active');
            }
        });
    }
    
    switchTheme(theme) {
        if (theme === 'default') {
            // Stay on current page (default theme)
            this.currentTheme = 'default';
            localStorage.setItem('selectedTheme', 'default');
            this.setActiveTheme();
        } else {
            // Navigate to alternative theme
            const themeUrl = this.themeUrls[theme];
            if (themeUrl) {
                localStorage.setItem('selectedTheme', theme);
                window.location.href = themeUrl;
            }
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio
    initAudio();
    
    // Initialize managers
    new GameManager();
    new AnimationManager();
    new ThemeManager();
    
    // Add click-to-activate audio context (required by browsers)
    document.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
});
