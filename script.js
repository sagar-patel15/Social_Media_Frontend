// ============================================
// CONFIGURATION
// ============================================
// CHANGE THIS TO YOUR PRODUCTION WEBHOOK URL WHEN READY
const WEBHOOK_URL = 'https://n8n.intelligens.app/webhook/content';

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

// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Convert a File object to base64 string
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data:mime/type;base64, prefix
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

// Initialize theme on page load
initTheme();

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contentForm');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    const resultContainer = document.getElementById('resultContainer');
    const generatedContent = document.getElementById('generatedContent');

    const placeholder = document.getElementById('placeholder');
    const uploadLoader = document.getElementById('uploadLoader');
    const loaderText = document.getElementById('loaderText');
    const platformsGrid = document.querySelector('.platforms-grid');
    const themeToggle = document.getElementById('themeToggle');

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
        
        // Validate - at least topic or video should be provided
        const topic = formData.get('topic');
        const keywords = formData.get('keywords');
        const videoFile = formData.get('video');
        
        if (!topic && (!videoFile || videoFile.size === 0)) {
            showStatus('Please enter a topic or upload a video.', 'error');
            submitBtn.classList.add('error-shaking');
            setTimeout(() => submitBtn.classList.remove('error-shaking'), 400);
            return;
        }

        // Check platform selection if no video is uploaded
        const selectedPlatforms = formData.getAll('platforms');
        if (selectedPlatforms.length === 0 && (!videoFile || videoFile.size === 0)) {
            platformsGrid.classList.add('invalid');
            const btnText = submitBtn.querySelector('.btn-text');
            const originalText = btnText.textContent;
            
            btnText.textContent = 'Please select a platform';
            submitBtn.classList.add('error-shaking');
            
            setTimeout(() => {
                platformsGrid.classList.remove('invalid');
                submitBtn.classList.remove('error-shaking');
                btnText.textContent = originalText;
            }, 3000);
            
            showStatus('Please select at least one target platform.', 'error');
            return;
        }

        // Check file size (limit to 100MB for practical reasons)
        if (videoFile && videoFile.size > 100 * 1024 * 1024) {
            showStatus('Video file is too large. Please use a file smaller than 100MB.', 'error');
            return;
        }

        // Disable button and show loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        const btnText = submitBtn.querySelector('.btn-text');
        const originalText = btnText.textContent;
        btnText.textContent = 'Creating Magic...';

        // Show loader for all requests
        uploadLoader.style.display = 'flex';
        if (videoFile && videoFile.size > 0) {
            loaderText.textContent = 'Uploading & Processing Video...';
        } else {
            loaderText.textContent = 'Generating Your Content...';
        }

        try {
            // Get selected platforms from FormData
            const selectedPlatforms = Array.from(formData.getAll('platforms'));

            // Log what we're sending to the webhook for debugging
            console.log('=== Sending to Webhook (FormData) ===');
            console.log('Topic:', topic || '(not provided)');
            console.log('Platforms:', selectedPlatforms.length > 0 ? selectedPlatforms : '(none selected)');
            console.log('Keywords:', keywords || '(not provided)');
            if (videoFile && videoFile.size > 0) {
                console.log('Video File Details:');
                console.log('  - Name:', videoFile.name);
                console.log('  - Size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');
                console.log('  - Type:', videoFile.type);
            } else {
                console.log('Video: (not provided)');
            }
            console.log('========================');

            btnText.textContent = 'Sending to Server...';

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                // Note: We don't set Content-Type header when sending FormData.
                // The browser will automatically set it to multipart/form-data with the correct boundary.
                body: formData
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
                    // 0. YouTube URL check (Primary)
                    if (item.youtube_url) {
                        const youtubeBox = document.createElement('div');
                        youtubeBox.className = 'youtube-success-ultra';
                        youtubeBox.style.cssText = `
                            background: linear-gradient(135deg, rgba(255, 90, 95, 0.06) 0%, rgba(217, 119, 6, 0.06) 100%);
                            border: 1px solid rgba(255, 90, 95, 0.2);
                            border-radius: 12px;
                            padding: 12px 20px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 6px;
                            width: 100%;
                            box-shadow: 0 2px 10px rgba(255, 90, 95, 0.05);
                            margin-bottom: 10px;
                        `;
                        
                        youtubeBox.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 8px; color: #D97706; font-weight: 700; font-size: 0.95em; letter-spacing: -0.2px;">
                                <span style="font-size: 1.3em;">✨</span>
                                <span>Uploaded Successfully</span>
                            </div>
                            <div style="width: 100%; text-align: center;">
                                <a href="${item.youtube_url}" target="_blank" style="color: #FF5A5F; text-decoration: none; word-break: break-all; font-family: 'Inter', system-ui, sans-serif; font-size: 1.2em; font-weight: 600; transition: all 0.2s;">
                                    ${item.youtube_url}
                                </a>
                            </div>
                        `;
                        grid.appendChild(youtubeBox);
                        hasResults = true;
                    }

                    // 1. NEW UNIFIED FORMAT (item.posts, item.image)
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
                             let html = `<p>${twitterData.text}</p>`;
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
                                let html = `<p><strong>Status:</strong> ${fbData.status || 'posted'}</p>`;
                                if (id) {
                                    html += `<p><strong>Post ID:</strong> ${id}</p>`;
                                }
                                if (fbData.url) {
                                    html += `<p style="margin-top: 5px;"><a href="${fbData.url}" target="_blank" style="color: #1877F2; text-decoration: none; font-weight: 600;">View on Facebook <span style="font-size: 0.8em;">↗</span></a></p>`;
                                }
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
                                    let html = `<p>${result.text || ""}</p>`;
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
                let errorMsg = 'Failed to generate content.';
                if (response.status === 413) {
                    errorMsg = 'Video file is too large for the server to process even after encoding.';
                } else if (response.status === 404) {
                    errorMsg = 'Webhook URL not found. Please check if your n8n workflow is active.';
                } else {
                    errorMsg += ` (Status: ${response.status})`;
                }
                showStatus(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            let userMsg = 'An error occurred. Please check your connection.';
            
            // Provide more specific feedback for common errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                userMsg = 'Network error: Could not reach the server. Please check your internet or VPN.';
            } else if (error.message) {
                userMsg = `Error: ${error.message}`;
            }
            
            showStatus(userMsg, 'error');
        } finally {
            // Hide loader
            uploadLoader.style.display = 'none';

            // Reset button state
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            btnText.textContent = originalText;
        }
    });



    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
    }
});
