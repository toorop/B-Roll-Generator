# B-Roll Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful, client-side application for content creators to generate high-quality B-roll clips using Google's state-of-the-art AI models. Animate your ideas from text prompts, bring your own images to life, or create entire video sequences from scratch.

<!-- Add a link to the live demo once it's deployed -->
**[Live Demo Link - To be added]**

<!-- Add a screenshot of the application -->
<!-- ![App Screenshot - To be added] -->

## Features

- **Text-to-Image:** Describe a scene and generate multiple high-quality images using Imagen 4.
- **Image-to-Video:** Select a generated image or upload your own, and animate it into a video clip using Veo.
- **Text-to-Video:** Generate a complete video clip directly from a text description.
- **Customization:** Control aspect ratio, resolution, video duration, and model selection.
- **Privacy First:** Your API key is stored securely in your browser's local storage and is never sent to any third-party server.

## Getting Started

This application operates on a "Bring Your Own Key" (BYOK) model. You will need your own Google AI API key to use the generation features. This ensures that you are in full control of your usage and billing.

### 1. Obtain a Google AI API Key

If you don't already have one, getting a key is a simple process:

1.  Navigate to **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  Log in with your Google account.
3.  Click the **"Get API Key"** button.
4.  Select **"Create API key in new project"** (or use an existing one).
5.  A new key will be generated. **Copy this key immediately** and store it safely.

### 2. Launch the Application

When you first open the B-Roll Generator, you will be prompted to enter your API key.

- Paste the key you obtained from Google AI Studio into the input field.
- Click "Save and Start Generating".

That's it! Your key is now saved in your browser's local storage for future sessions, and you can start creating.

## How to Use

The application has two main workflows:

### Image to Video

1.  **Describe a scene** in the text prompt area.
2.  Select the number of images and the desired aspect ratio.
3.  Click **"Generate Images"**.
4.  Once the images appear, **click on one to select it** for animation.
5.  Optionally, add a prompt to describe the desired motion (e.g., "slow pan to the right").
6.  Adjust the video settings (model, resolution, duration).
7.  Click **"Animate"** to generate your video clip.

You can also skip image generation by clicking **"Upload Image"** and using your own file.

### Text to Video

1.  Switch to the **"Text to Video"** tab.
2.  **Describe the video clip** you want to create in the prompt area.
3.  Adjust the aspect ratio, model, resolution, and duration.
4.  Click **"Generate Video"**.

## Privacy and Security

Your security is paramount.

- Your Google AI API key is stored **exclusively** in your browser's `localStorage`.
- It is **never** transmitted to, or stored on, any server other than Google's own API endpoints during the generation process.
- The application is fully client-side. All logic runs directly in your browser.

For complete transparency, you are encouraged to review the [source code on GitHub](https://github.com/toorop/B-Roll-Generator).

## Tech Stack

- **Framework:** React
- **Styling:** Tailwind CSS
- **AI/ML:** Google Gemini API (`@google/genai` SDK)

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/toorop/B-Roll-Generator/issues).

## License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.
