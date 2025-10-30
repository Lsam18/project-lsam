// LinkedIn RSS Feed loader (configurable)
// NOTE: LinkedIn does not provide an official public RSS for user posts. If you have a LinkedIn RSS
// URL (from a third-party RSS generator or a company feed), set it in `linkedinRss` below.
// Otherwise this widget will show a link to the LinkedIn profile.

// If you have a LinkedIn RSS URL (from a third-party generator) set it here.
// Example: const linkedinRss = 'https://rss.app/feeds/your-generated-link.xml';
const linkedinRss = ''; // <-- set your LinkedIn RSS URL here if available
const linkedinProfileUrl = 'https://www.linkedin.com/in/lsam';

async function loadLinkedInFeed() {
    const container = document.getElementById('linkedin-feed');
    if (!container) return;

    if (!linkedinRss) {
        // Friendly instructions + quick action so user can configure an RSS source
        container.innerHTML = `
            <div class="feed-empty" style="padding:16px;text-align:center;"> 
                <p>No LinkedIn RSS configured.</p>
                <p style="font-size:0.9rem;color:#bbb;">LinkedIn doesn't provide a public RSS feed. You can generate one using a third-party RSS service (for example <a href="https://rss.app" target="_blank">rss.app</a>), then paste the generated RSS URL into <code>js/linkedin-feed.js</code> (set <strong>linkedinRss</strong>).</p>
                <div style="margin-top:10px; display:flex; gap:10px; justify-content:center;">
                    <a href="${linkedinProfileUrl}" target="_blank" class="btn btn-primary">Visit LinkedIn Profile</a>
                    <a href="https://rss.app" target="_blank" class="btn btn-secondary">Create LinkedIn RSS</a>
                </div>
            </div>`;
        return;
    }

    try {
        const proxy = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(linkedinRss);
        const resp = await fetch(proxy);
        const data = await resp.json();

        if (data && data.items && data.items.length > 0) {
            container.innerHTML = '';
            data.items.slice(0, 5).forEach(item => {
                const el = document.createElement('div');
                el.className = 'sidebar-news-item';
                const d = new Date(item.pubDate);
                const fd = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                el.innerHTML = `
                    <h4 class="sidebar-news-title"><a href="${item.link}" target="_blank">${item.title}</a></h4>
                    <div class="sidebar-news-meta"><span>LinkedIn</span><span>${fd}</span></div>
                `;
                container.appendChild(el);
            });
            return;
        }

        container.innerHTML = `
            <div class="feed-empty">
                <p>No recent posts available.</p>
                <a href="${linkedinProfileUrl}" target="_blank" class="btn btn-primary">Visit LinkedIn Profile</a>
            </div>`;
    } catch (err) {
        console.error('Error loading LinkedIn RSS:', err);
        container.innerHTML = `
            <div class="feed-error">
                <p>Unable to load LinkedIn posts.</p>
                <a href="${linkedinProfileUrl}" target="_blank" class="btn btn-primary">Visit LinkedIn Profile</a>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadLinkedInFeed();
    // refresh every 10 minutes
    setInterval(loadLinkedInFeed, 600000);
});
