/**
 * Kick Chat Handler
 * Connects to Kick.com chat using Pusher WebSocket
 */

class KickChat {
    constructor(containerElement) {
        this.container = containerElement;
        this.pusher = null;
        this.channel = null;
        this.currentUsername = null;
        this.shouldAutoScroll = true;

        // Kick's public Pusher configuration
        this.PUSHER_KEY = '32cbd69e4b950bf97679';
        this.PUSHER_CLUSTER = 'us2';

        // Setup scroll listener to detect if user has scrolled up
        this.setupScrollListener();
    }

    /**
     * Setup scroll listener to track if user is at bottom
     */
    setupScrollListener() {
        this.container.addEventListener('scroll', () => {
            const threshold = 50; // pixels from bottom
            const position = this.container.scrollTop + this.container.clientHeight;
            const height = this.container.scrollHeight;

            // User is near bottom, enable auto-scroll
            this.shouldAutoScroll = (height - position) <= threshold;
        });
    }

    /**
     * Connect to a Kick channel's chat
     * @param {string} username - The Kick streamer's username
     */
    async connect(username) {
        // Clean username
        const cleanUsername = username.replace('@', '').trim();

        if (!cleanUsername) {
            this.showError('Invalid username');
            return;
        }

        // If already connected to this username, do nothing
        if (this.currentUsername === cleanUsername && this.pusher) {
            return;
        }

        // Show loading state
        this.showLoading(cleanUsername);

        try {
            // Fetch chatroom ID from Kick API
            const chatroomId = await this.fetchChatroomId(cleanUsername);

            // Connect to Pusher
            this.connectPusher(chatroomId, cleanUsername);

        } catch (error) {
            console.error('Kick chat error:', error);
            this.showError(error.message);
        }
    }

    /**
     * Fetch the chatroom ID for a given username
     * @param {string} username - The Kick streamer's username
     * @returns {Promise<number>} The chatroom ID
     */
    async fetchChatroomId(username) {
        const url = `https://kick.com/api/v1/channels/${username}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;

        try {
            const response = await fetch(proxyUrl);

            if (!response.ok) {
                throw new Error('Channel not found or API unavailable');
            }

            const data = await response.json();

            if (!data.chatroom || !data.chatroom.id) {
                throw new Error('No chatroom found for this channel');
            }

            return data.chatroom.id;

        } catch (error) {
            throw new Error(`Unable to connect to ${username}'s chat: ${error.message}`);
        }
    }

    /**
     * Connect to Pusher and subscribe to chat events
     * @param {number} chatroomId - The chatroom ID
     * @param {string} username - The username for display purposes
     */
    connectPusher(chatroomId, username) {
        // Disconnect previous connection if exists
        this.disconnect();

        // Initialize Pusher
        this.pusher = new Pusher(this.PUSHER_KEY, {
            cluster: this.PUSHER_CLUSTER,
            encrypted: true
        });

        // Subscribe to the chatroom channel
        const channelName = `chatrooms.${chatroomId}.v2`;
        this.channel = this.pusher.subscribe(channelName);

        // Clear container and show connected message
        this.container.innerHTML = '';
        this.addSystemMessage(`Connected to ${username}'s chat`);

        // Bind to chat message events
        this.channel.bind('App\\Events\\ChatMessageEvent', (data) => {
            this.handleChatMessage(data);
        });

        // Store current username
        this.currentUsername = username;
    }

    /**
     * Handle incoming chat message
     * @param {Object} data - The message data from Pusher
     */
    handleChatMessage(data) {
        if (!data.sender || !data.content) return;

        const username = data.sender.username || 'Unknown';
        const message = data.content;

        this.addMessage(username, message);
    }

    /**
     * Generate a consistent color from a username using a simple hash
     * @param {string} username - The username to hash
     * @returns {string} HSL color string
     */
    usernameToColor(username) {
        // Simple hash function - sum of char codes with position weighting
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convert to 32bit integer
        }

        // Use hash to generate hue (0-360)
        const hue = Math.abs(hash % 360);

        // Fixed saturation and lightness for readability on dark background
        return `hsl(${hue}, 70%, 65%)`;
    }

    /**
     * Parse emotes in message and convert to HTML
     * @param {string} message - The message content
     * @returns {string} HTML string with emotes converted to images
     */
    parseEmotes(message) {
        // Regex to match emote format: [emote:ID:NAME]
        const emoteRegex = /\[emote:(\d+):([^\]]+)\]/g;

        return message.replace(emoteRegex, (match, emoteId, emoteName) => {
            const emoteUrl = `https://files.kick.com/emotes/${emoteId}/fullsize`;
            return `<img src="${emoteUrl}" alt="${emoteName}" title="${emoteName}" class="kick-chat-emote">`;
        });
    }

    /**
     * Add a chat message to the feed
     * @param {string} username - The sender's username
     * @param {string} message - The message content
     */
    addMessage(username, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'kick-chat-message';

        const usernameSpan = document.createElement('span');
        usernameSpan.className = 'kick-chat-username';
        usernameSpan.textContent = `${username}:`;
        usernameSpan.style.color = this.usernameToColor(username);

        const contentSpan = document.createElement('span');
        contentSpan.className = 'kick-chat-content';
        // Parse emotes and set as innerHTML
        contentSpan.innerHTML = ` ${this.parseEmotes(this.escapeHtml(message))}`;

        messageDiv.appendChild(usernameSpan);
        messageDiv.appendChild(contentSpan);

        this.container.appendChild(messageDiv);

        // Auto-scroll to bottom only if user hasn't scrolled up
        if (this.shouldAutoScroll) {
            this.scrollToBottom();
        }
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        this.container.scrollTop = this.container.scrollHeight;
    }

    /**
     * Escape HTML to prevent XSS (but preserve emote tags for parsing)
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Add a system message to the feed
     * @param {string} message - The system message
     */
    addSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'kick-chat-message kick-chat-system';
        messageDiv.textContent = `[System] ${message}`;

        this.container.appendChild(messageDiv);
        this.scrollToBottom();
    }

    /**
     * Show loading state
     * @param {string} username - The username being connected to
     */
    showLoading(username) {
        this.container.innerHTML = `
            <div class="kick-chat-loading">
                Connecting to ${username}'s chat...
            </div>
        `;
    }

    /**
     * Show error message
     * @param {string} message - The error message
     */
    showError(message) {
        this.container.innerHTML = `
            <div class="kick-chat-error">
                ${message}
            </div>
        `;
    }

    /**
     * Disconnect from Pusher
     */
    disconnect() {
        if (this.pusher) {
            this.pusher.disconnect();
            this.pusher = null;
        }

        this.channel = null;
        this.currentUsername = null;
    }

    /**
     * Clear the chat feed
     */
    clear() {
        this.container.innerHTML = '';
        this.shouldAutoScroll = true;
    }

    /**
     * Update container and reinitialize scroll listener
     * Used when switching between chats
     */
    updateContainer(newContainer) {
        this.container = newContainer;
        this.shouldAutoScroll = true;
        this.setupScrollListener();
    }
}

// Export for use in multiview.html
window.KickChat = KickChat;
