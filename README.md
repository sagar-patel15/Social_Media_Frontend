# ContentGen - Social Media Wizard

ContentGen is a frontend application designed to streamline the creation of social media content. It allows users to generate engaging posts and images for various platforms (Facebook, Instagram, Twitter/X) based on topics, keywords, or uploaded videos.

## Features

- **Multi-Platform Generation**: Generate tailored content for Facebook, Instagram, and Twitter (X) simultaneously.
- **Video Analysis**: Upload videos (up to 100MB) to generate content based on video context or for YouTube processing.
- **AI-Powered**: Integrates with backend workflows (via n8n webhook) to leverage AI for content generation.
- **Dark/Light Mode**: Fully responsive UI with a built-in theme toggle.
- **Real-time Feedback**: Interactive loading states, validations, and success notifications.

## Usage

1. **Open the Application**: Simply open `index.html` in any modern web browser.
2. **Fill in Details**:
   - Enter a **Topic** (e.g., "The Future of AI").
   - Select **Target Platforms**.
   - (Optional) Add **Keywords** to refine the style.
   - (Optional) **Upload a Video** for content repurposing or YouTube.
3. **Generate**: Click "Generate Magic" to send the request.
4. **View Results**: Generated posts and images will appear in the results panel.

## Configuration

The application communicates with a backend webhook specified in `script.js`:
```javascript
const WEBHOOK_URL = 'https://n8n.intelligens.app/webhook/content';
```
You can update this URL to point to your own n8n workflow or backend service.

## Project Structure

- `index.html`: Main application structure.
- `style.css`: Styles for the application (including dark/light mode).
- `script.js`: Core logic for form handling, file conversion, API communication, and UI updates.
