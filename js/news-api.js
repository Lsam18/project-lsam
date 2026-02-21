// Enhanced Security News Functions
// Load news from TheHackerNews feed only
async function loadSecurityNews() {
    const hackerNewsFeed = 'https://feeds.feedburner.com/TheHackersNews';

    try {
        const data = await loadNewsFromRss(hackerNewsFeed);
        const newsGrid = document.getElementById('news');

        if (data && data.items && data.items.length > 0) {
            const feedTitle = (data.feed && data.feed.title) ? data.feed.title : 'TheHackerNews';
            if (newsGrid) {
                newsGrid.innerHTML = '';
                data.items.slice(0, 8).forEach(item => newsGrid.appendChild(createNewsCard(item, feedTitle)));
            }
            return;
        }

        showNewsError('No news articles found.');
    } catch (error) {
        console.error('Error loading security news:', error);
        showNewsError('Failed to load news. Please try again later.');
    }
}

// Generic loader using rss2json proxy
async function loadNewsFromRss(rssUrl) {
    try {
        const proxy = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
        const response = await fetch(proxy);
        const data = await response.json();
        console.log('Loaded feed:', rssUrl, data && data.status);
        return data;
    } catch (err) {
        console.error('Failed to load RSS:', rssUrl, err);
        return null;
    }
}

function createNewsCard(newsItem, sourceName = 'The Hacker News') {
    const card = document.createElement('div');
    card.className = 'news-card';
    
        // Get image from the feed item (common properties) or default to none
        let imageUrl = '';
        // 1) thumbnail provided by rss2json
        if (newsItem.thumbnail) {
            imageUrl = newsItem.thumbnail;
        }
        // 2) enclosure (can be object or string)
        if (!imageUrl && newsItem.enclosure) {
            try {
                if (typeof newsItem.enclosure === 'string') {
                    // sometimes enclosure is a URL string
                    imageUrl = newsItem.enclosure;
                } else {
                    const enclosureObj = newsItem.enclosure;
                    if (enclosureObj.link) imageUrl = enclosureObj.link;
                    else if (enclosureObj.url) imageUrl = enclosureObj.url;
                    else if (enclosureObj['@url']) imageUrl = enclosureObj['@url'];
                }
            } catch (error) {
                console.error('Error parsing enclosure:', error);
            }
        }
        // 3) media or image fields
        if (!imageUrl && newsItem.media && newsItem.media.content && newsItem.media.content.url) {
            imageUrl = newsItem.media.content.url;
        }
        if (!imageUrl && newsItem.image) {
            imageUrl = newsItem.image;
        }
        // If no image found in feed, we'll try to fetch the article page later to look for og:image
        // Build the card with a placeholder first, then replace image asynchronously if we find one
    
    // Format date
    const newsDate = new Date(newsItem.pubDate);
    const formattedDate = newsDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Use a sensible default image so cards don't look empty while we try to find a real article image.
    // If one is later discovered (via fetchArticleImage) we'll replace this default.
    const defaultImage = 'assets/images/banner.jpg';
    card.innerHTML = `
        <div class="news-image" data-has-image="${imageUrl ? '1' : '0'}">
            <img src="${imageUrl || defaultImage}" alt="${newsItem.title}" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div class="news-content">
            <h3 class="news-title">
                <a href="${newsItem.link}" target="_blank">${newsItem.title}</a>
            </h3>
            <div class="news-meta">
                <span class="news-source">${sourceName}</span>
                <span class="news-date">${formattedDate}</span>
            </div>
            <div class="news-excerpt">
                ${newsItem.description ? (newsItem.description.substring(0, 150) + '...') : ''}
            </div>
        </div>
    `;

    // If we already have an image URL from the feed, we're done.
    // Otherwise attempt to fetch og:image from the article page. Note: fetching third-party article HTML
    // from the browser can fail due to cross-origin restrictions (CORS). If you see CORS errors in the
    // console, consider using a small server-side proxy or serverless function that fetches the page
    // and returns the og:image URL (or the image itself) to the client.
    if (!imageUrl && newsItem.link) {
        // asynchronous attempt to get article image
        fetchArticleImage(newsItem.link).then(found => {
            if (found) {
                const imgContainer = card.querySelector('.news-image');
                imgContainer.innerHTML = `<img src="${found}" alt="${newsItem.title}" style="width:100%;height:100%;object-fit:cover;">`;
                imgContainer.setAttribute('data-has-image', '1');
            }
        }).catch(err => {
            // ignore errors silently, keep placeholder
            console.debug('No article image found or failed to fetch:', err);
        });
    }
    
    return card;
}

// Try fetching the article page and extracting a representative image (og:image, twitter:image, or first article img)
async function fetchArticleImage(articleUrl) {
    try {
        const resp = await fetch(articleUrl, { method: 'GET' });
        if (!resp || resp.status !== 200) return null;
        const text = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        // og:image
        const og = doc.querySelector('meta[property="og:image"]') || doc.querySelector('meta[name="og:image"]');
        if (og && og.content) return absoluteUrl(articleUrl, og.content.trim());

        // twitter image
        const tw = doc.querySelector('meta[name="twitter:image"]');
        if (tw && tw.content) return absoluteUrl(articleUrl, tw.content.trim());

        // link rel image_src
        const linkImg = doc.querySelector('link[rel="image_src"]');
        if (linkImg && linkImg.href) return absoluteUrl(articleUrl, linkImg.href.trim());

        // first image inside article/content
        const articleImg = doc.querySelector('article img') || doc.querySelector('.post img') || doc.querySelector('img');
        if (articleImg && articleImg.src) return absoluteUrl(articleUrl, articleImg.src.trim());

        return null;
    } catch (error) {
        console.error('fetchArticleImage error:', error);
        return null;
    }
}

function absoluteUrl(base, relative) {
    try {
        return new URL(relative, base).href;
    } catch (e) {
        return relative;
    }
}

function showNewsError(message) {
    const newsGrid = document.getElementById('news');
    if (!newsGrid) return;
    newsGrid.innerHTML = `
        <div class="loading-news">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button id="reload-news-btn" class="btn btn-primary" style="margin-top:15px;">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    // attach click handler safely
    setTimeout(() => {
        const btn = document.getElementById('reload-news-btn');
        if (btn) btn.addEventListener('click', loadSecurityNews);
    }, 50);
}

// Initialize news when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadSecurityNews();
    
    // Refresh news every 10 minutes
    setInterval(loadSecurityNews, 600000);
});

// ... existing code ...

// Note: sidebar news loader removed (replaced by TryHackMe card in HTML).