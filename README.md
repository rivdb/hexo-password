# Hexo Password Protection Plugin

A secure Hexo plugin that provides password protection for posts using client-side AES-256-GCM encryption.

## Features

- **Secure Encryption**: Uses AES-256-GCM with PBKDF2 key derivation
- **Client-Side Decryption**: Content is encrypted server-side and decrypted in the browser
- **No Server Dependencies**: Works with static hosting (GitHub Pages, Netlify, etc.)
- **SEO Friendly**: Protected content is not exposed in HTML source
- **Modern Security**: Utilizes Web Crypto API for cryptographic operations

## Installation

1. Copy the plugin to your Hexo site's `node_modules` folder or install via npm:
   ```bash
   npm install hexo-password
   ```

2. The plugin will be automatically loaded by Hexo.

## Usage

Add a `password` field to any post's front matter:

```yaml
---
title: My Secret Post
date: 2023-12-01
password: mySecretPassword
tags:
  - private
---

This content will be password protected!
```

## How It Works

1. **Build Time**: The plugin encrypts the post content using AES-256-GCM with the provided password
2. **Runtime**: Visitors see a password prompt instead of the actual content
3. **Decryption**: When the correct password is entered, the content is decrypted client-side using the Web Crypto API

## Customization

The default password prompt is styled with inline CSS for simplicity. If you wish to change its appearance, you can override these styles in your theme.

1.  **Create a custom CSS file** in your Hexo site's `source` directory. For example, you can create `source/css/custom.css`.

2.  **Add your own styles.** You can use the following selectors to target the password prompt elements:
    *   `#password-protected-content`: The main container for the entire prompt.
    *   `#password-input`: The password text field.
    *   `#password-protected-content button`: The "Unlock" button.

3.  **Load your stylesheet.** You will need to edit your theme's layout files to include your new stylesheet.

### Example: Minimalistic Style

For a more modern and minimalistic look, you can use the following CSS.

```css
/* In your custom.css file */

#password-protected-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#password-protected-content div {
  max-width: 360px !important;
  margin: 60px auto !important;
  padding: 30px !important;
  background: #fff !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1) !important;
}

#password-input {
  box-sizing: border-box !important;
  padding: 12px !important;
  margin-bottom: 12px !important;
  border: 1px solid #ccc !important;
  border-radius: 4px !important;
  font-size: 16px !important;
  transition: border-color 0.2s !important;
}

#password-input:focus {
  border-color: #007cba !important;
  outline: none !important;
}

#password-protected-content button {
  padding: 12px !important;
  background: #333 !important;
  color: white !important;
  font-size: 16px !important;
  transition: background-color 0.2s !important;
}

#password-protected-content button:hover {
  background-color: #555 !important;
}

#error-message {
  color: #d93025 !important;
  text-align: center !important;
  font-size: 14px !important;
}
```
*(Note: `!important` is used here to ensure these styles override the default inline styles from the plugin.)*

## Security Features

- **PBKDF2 Key Derivation**: 10,000 iterations with SHA-256
- **Random Salt & IV**: Each post gets unique cryptographic parameters
- **Authentication Tag**: Prevents tampering with encrypted content
- **No Password Storage**: Passwords are never stored or transmitted
- **Client-Side Only**: Decryption happens entirely in the browser

## Browser Support

Requires browsers that support the Web Crypto API (all modern browsers):
- Chrome 37+
- Firefox 34+
- Safari 11+
- Edge 79+

## Example

See `example-protected-post.md` for a sample protected post. Use password: `secret123`

## License

ISC