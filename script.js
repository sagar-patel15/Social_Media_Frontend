// ============================================
// THEME MANAGEMENT
// ============================================
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
};

// Initialize theme on page load
initTheme();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contentForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const resultContainer = document.getElementById('resultContainer');
    const generatedContent = document.getElementById('generatedContent');
    const copyBtn = document.getElementById('copyBtn');
    const themeToggle = document.getElementById('themeToggle');
    const placeholder = document.getElementById('placeholder');

    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous status and result
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
        resultContainer.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        generatedContent.textContent = '';
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            topic: formData.get('topic'),
            keywords: formData.get('keywords'),
            link: formData.get('link')
        };

        // Validate
        if (!data.topic) {
            showStatus('Please enter a topic.', 'error');
            return;
        }

        // Disable button and show loading state
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        btnText.textContent = 'Creating Magic...';

        try {
            const response = await fetch('https://n8n.intelligens.app/webhook/content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const responseData = await response.json();
                
                // Check if response is an array and has text
                // Clear previous content
                generatedContent.innerHTML = '';
                
                // Create grid container
                const grid = document.createElement('div');
                grid.className = 'social-results-grid';

                let hasResults = false;

                // Helper to create card HTML
                const createCard = (platform, icon, title, contentHtml) => {
                    const card = document.createElement('div');
                    card.className = `social-card card-${platform}`;
                    card.innerHTML = `
                        <div class="card-header">
                            <span class="platform-icon">${icon}</span>
                            <span class="platform-name">${title}</span>
                        </div>
                        <div class="card-content">
                            ${contentHtml}
                        </div>
                    `;
                    return card;
                };

                // Normalize responseData to array
                const items = Array.isArray(responseData) ? responseData : [responseData];

                items.forEach(item => {
                    // NEW UNIFIED FORMAT (item.posts, item.image)
                    if (item.posts || (item.image && typeof item.image === 'object' && !item.mimeType)) { // Check for new format structure
                        // 1. Instagram
                        const instaData = item.posts.instagram || item.posts.Instagram;
                        if (instaData && (instaData.id || instaData.status)) {
                             const html = `<p><strong>Post ID:</strong> ${instaData.id || 'Pending'}</p>
                                           <p><strong>Status:</strong> ${instaData.status || 'posted'}</p>`;
                             grid.appendChild(createCard('instagram', '📸', 'Instagram', html));
                             hasResults = true;
                        }

                        // 2. X (Twitter)
                        const twitterData = item.posts.twitter || item.posts.Twitter || item.posts.x || item.posts.X;
                        if (twitterData && (twitterData.text || twitterData.id || twitterData.status)) {
                             let html = `<p>${twitterData.text || 'Tweet posted'}</p>`;
                             if (twitterData.id) {
                                 html += `<p style="margin-top: 10px; font-size: 0.85em; color: var(--light-text);"><strong>ID:</strong> ${twitterData.id}</p>`;
                             }
                             if (twitterData.status) {
                                 html += `<p style="margin-top: 10px; font-size: 0.85em; color: var(--light-text);"><strong>Status:</strong> ${twitterData.status}</p>`;
                             }
                             grid.appendChild(createCard('x', '🐦', 'X (Twitter)', html));
                             hasResults = true;
                        }

                        // 3. Facebook
                        const fbData = item.posts.facebook || item.posts.Facebook;
                        if (fbData) {
                             const id = fbData.post_id || fbData.id;
                             if (id || fbData.status) {
                                const html = `<p><strong>Post ID:</strong> ${id || 'Pending'}</p>
                                              <p><strong>Status:</strong> ${fbData.status || 'posted'}</p>`;
                                grid.appendChild(createCard('facebook', '📘', 'Facebook', html));
                                hasResults = true;
                             }
                        }
                    } else {
                        // LEGACY FORMATS (keeping for backward compatibility or individual node outputs)
                        
                        // 1. Instagram
                        if (item['Instagram Post Result']) {
                            try {
                                const result = JSON.parse(item['Instagram Post Result']);
                                if (result.id) {
                                    const html = `<p><strong>Post ID:</strong> ${result.id}</p>`;
                                    grid.appendChild(createCard('instagram', '📸', 'Instagram', html));
                                    hasResults = true;
                                }
                            } catch (e) { console.error('Error parsing Instagram result', e); }
                        }

                        // 2. X (Twitter)
                        if (item['X Post Result']) {
                            try {
                                const result = JSON.parse(item['X Post Result']);
                                if (result.text) {
                                    let html = `<p>${result.text}</p>`;
                                    if (result.id) {
                                        html += `<p style="margin-top: 10px; font-size: 0.85em; color: var(--light-text);"><strong>ID:</strong> ${result.id}</p>`;
                                    }
                                    grid.appendChild(createCard('x', '🐦', 'X (Twitter)', html));
                                    hasResults = true;
                                }
                            } catch (e) { console.error('Error parsing X result', e); }
                        }

                        // 3. Facebook
                        if (item['Facebook Post Result']) {
                            try {
                                const result = JSON.parse(item['Facebook Post Result']);
                                const id = result.post_id || result.id;
                                if (id) {
                                    const html = `<p><strong>Post ID:</strong> ${id}</p>`;
                                    grid.appendChild(createCard('facebook', '📘', 'Facebook', html));
                                    hasResults = true;
                                }
                            } catch (e) { console.error('Error parsing Facebook result', e); }
                        }
                    }

                    // 4. Image Handling (Unified for both formats)
                    // Check for various image formats: 
                    // 1. item.image.url (New unified format)
                    // 2. item.data.url (ImgBB style)
                    // 3. item.image (Base64/URL legacy)
                    
                    let imageData = null;
                    let fileName = 'Generated Image';
                    let fileType = 'png';
                    let fileSize = 'Unknown';

                    // Strategy 1: New Unified Format (item.image object with url)
                    if (item.image && typeof item.image === 'object' && item.image.url) {
                        imageData = item.image.url;
                        fileName = item.image.filename || 'data.png';
                        if (item.image.dimensions) fileSize = `${item.image.dimensions.width}x${item.image.dimensions.height}`; // temporary placeholder or use metadata
                        if (item.metadata && item.metadata.fileSize) fileSize = (item.metadata.fileSize / 1024 / 1024).toFixed(2) + ' MB';
                    }
                    // Strategy 2: ImgBB Data Object
                    else if (item.data && typeof item.data === 'object') {
                        if (item.data.url) imageData = item.data.url;
                        else if (item.data.image && item.data.image.url) imageData = item.data.image.url;
                        
                        if (item.data.image) {
                            fileName = item.data.image.filename || item.data.image.name || fileName;
                            fileType = item.data.image.extension || fileType;
                        }
                        if (item.data.size) fileSize = (item.data.size / 1024 / 1024).toFixed(2) + ' MB';
                    }
                    // Strategy 3: Legacy flat structure
                    else {
                        imageData = item.image || item.url || (item.mimeType && item.data ? item.data : null);
                        // Handle case where item.image is an object (not null) with a url property in legacy path
                        if (imageData && typeof imageData === 'object' && imageData.url) {
                            imageData = imageData.url;
                        }
                        fileName = item.fileName || fileName;
                        fileType = item.fileExtension || item.mimeType || fileType;
                        fileSize = item.fileSize || fileSize;
                    }

                    console.log('Processing item:', item);
                    console.log('Detected imageData:', imageData ? (typeof imageData === 'object' ? JSON.stringify(imageData) : (imageData.length > 50 ? imageData.substring(0, 50) + '...' : imageData)) : 'None');

                    // Validation & Rendering
                    const isImageItem = imageData || (item.mimeType && item.mimeType.startsWith('image/'));

                    if (isImageItem) {
                        let html = '';
                        
                        // VALIDATION: Ensure it's not a filesystem ID or internal path or n8n expression
                        const isValidImage = imageData && 
                                           typeof imageData === 'string' &&
                                           !imageData.startsWith('filesystem-') && 
                                           !imageData.includes('{{') && // Check for un-evaluated n8n expressions
                                           (imageData.startsWith('http') || imageData.startsWith('data:') || imageData.length > 100);

                        if (isValidImage) {
                            let src = imageData;
                            if (!src.startsWith('http') && !src.startsWith('data:')) {
                                src = `data:${item.mimeType || 'image/png'};base64,${imageData}`;
                            }
                            html += `<img src="${src}" alt="Generated Image" class="generated-image">`;
                        } else if (imageData) {
                            console.warn('Image data detected but appears to be invalid/internal ID:', imageData);
                            
                            // Prepare display value for error message
                            let displayValue = '';
                            if (typeof imageData === 'object') {
                                displayValue = JSON.stringify(imageData, null, 2);
                            } else {
                                displayValue = imageData.length > 50 ? imageData.substring(0, 50) + '...' : imageData;
                            }
                            
                            let extraHint = '';
                            if (typeof displayValue === 'string' && (displayValue.includes('{{') || displayValue.includes('$node'))) {
                                extraHint = `<div style="margin-top:5px; font-weight:bold; color: #a00;">
                                    Hint: It looks like your n8n output is returning raw expressions (like <code>{{...}}</code>).<br>
                                    Please ensure your n8n "Respond to Webhook" node is evaluating these expressions to actual values.
                                </div>`;
                            }

                            html += `<div style="padding: 10px; background: #fee; color: #c00; border-radius: 4px; font-size: 0.9em; margin-top: 10px;">
                                ⚠️ Image preview unavailable. Invalid data detected:<br>
                                <pre style="background: #fff; padding: 5px; border-radius: 3px; overflow-x: auto; margin-top:5px;">${displayValue}</pre>
                                ${extraHint}
                            </div>`;
                        }

                        // Add metadata info
                        html += `
                            <div class="image-preview-area" style="margin-top: 10px;">
                                <div class="file-info-row">
                                    <span class="file-label">Name:</span>
                                    <span class="file-value">${fileName}</span>
                                </div>
                                <div class="file-info-row">
                                    <span class="file-label">Type:</span>
                                    <span class="file-value">${fileType}</span>
                                </div>
                                <div class="file-info-row">
                                    <span class="file-label">Size:</span>
                                    <span class="file-value">${fileSize}</span>
                                </div>
                            </div>
                        `;
                        grid.appendChild(createCard('image', '🖼️', 'Generated Image', html));
                        hasResults = true;
                    }



                });

                // Fallback for old single text response or empty structure
                if (!hasResults && items.length > 0 && items[0].text) {
                     generatedContent.textContent = items[0].text;
                } else if (!hasResults) {
                     // If structure didn't match known types, just dump JSON
                     generatedContent.textContent = JSON.stringify(responseData, null, 2);
                } else {
                    generatedContent.appendChild(grid);
                }

                // DEBUG: Always show raw response for user to inspect
                // Set 'open' attribute to FORCE the user to see the data


                resultContainer.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
                showStatus('Content generated successfully!', 'success');
                // form.reset(); // Optional: might want to keep inputs for tweaking

            } else {
                showStatus('Failed to generate content. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('An error occurred. Please check your connection.', 'error');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText.textContent = originalText;
        }
    });

    copyBtn.addEventListener('click', () => {
        const text = generatedContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
    }
});
