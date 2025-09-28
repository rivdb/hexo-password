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