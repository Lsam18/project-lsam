// Medium RSS Feed Integration
async function loadMediumFeed() {
    try {
        // Using RSS2JSON service to convert Medium RSS feed
        const mediumUsername = '@lakshan.sam28';
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/${mediumUsername}`);
        const data = await response.json();
        
        const feedContainer = document.getElementById('medium-feed');
        
        if (data.items && data.items.length > 0) {
            feedContainer.innerHTML = '';
            
            // Display latest 8 articles
            data.items.slice(0, 8).forEach(article => {
                const articleElement = createArticleCard(article);
                feedContainer.appendChild(articleElement);
            });
            
            // Add "View All" button if there are more articles
            if (data.items.length > 8) {
                const viewAllButton = document.createElement('div');
                viewAllButton.className = 'view-all-container';
                viewAllButton.innerHTML = `
                    <a href="https://medium.com/${mediumUsername}" target="_blank" class="btn btn-secondary">
                        <i class="fab fa-medium"></i> View All Articles
                    </a>
                `;
                feedContainer.appendChild(viewAllButton);
            }
        } else {
            showMediumError('No articles found. Start writing on Medium!');
        }
    } catch (error) {
        console.error('Error loading Medium feed:', error);
        showMediumError('Error loading articles. Check your Medium username.');
    }
}

function createArticleCard(article) {
    const articleDiv = document.createElement('div');
    articleDiv.className = 'article-card';
    
    // Extract clean title (remove username suffix)
    const cleanTitle = article.title.replace(` - Lakshan Sameera - Medium`, '');
    
    // Extract first image from content for thumbnail
    let thumbnailUrl = '';
    const imageMatch = article.content.match(/<img[^>]+src="([^">]+)"/);
    if (imageMatch) {
        thumbnailUrl = imageMatch[1];
    }
    
    // Format date
    const articleDate = new Date(article.pubDate);
    const formattedDate = articleDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Clean description (remove HTML tags)
    const cleanDescription = article.description.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
    
    articleDiv.innerHTML = `
        <div class="article-thumbnail">
            ${thumbnailUrl ? 
                `<img src="${thumbnailUrl}" alt="${cleanTitle}" loading="lazy">` : 
                `<div class="thumbnail-placeholder">
                    <i class="fas fa-newspaper"></i>
                </div>`
            }
        </div>
        <div class="article-content">
            <h3 class="article-title">
                <a href="${article.link}" target="_blank">${cleanTitle}</a>
            </h3>
            <div class="article-meta">
                <span class="article-date"><i class="far fa-calendar"></i> ${formattedDate}</span>
                <span class="article-read-time"><i class="far fa-clock"></i> ${estimateReadTime(article.content)} min read</span>
            </div>
            <p class="article-excerpt">${cleanDescription}</p>
            <div class="article-actions">
                <a href="${article.link}" target="_blank" class="read-more">
                    Read Full Article <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
    
    return articleDiv;
}

function estimateReadTime(content) {
    // Average reading speed: 200-250 words per minute
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.round(wordCount / 200));
}

function showMediumError(message) {
    const feedContainer = document.getElementById('medium-feed');
    feedContainer.innerHTML = `
        <div class="feed-error">
            <i class="fas fa-exclamation-circle"></i>
            <h3>No Articles Found</h3>
            <p>${message}</p>
            <div class="error-actions">
                <a href="https://medium.com/new-story" target="_blank" class="btn btn-primary">
                    <i class="fab fa-medium"></i> Write Your First Article
                </a>
                <button onclick="loadMediumFeed()" class="btn btn-secondary">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        </div>
    `;
}

// Initialize Medium feed when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMediumFeed();
    
    // Refresh every 30 minutes
    setInterval(loadMediumFeed, 1800000);
});