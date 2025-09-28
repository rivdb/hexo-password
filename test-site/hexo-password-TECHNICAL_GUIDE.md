# Hexo Password Protection Plugin - Technical Guide

## Overview

This plugin provides secure password protection for Hexo blog posts using client-side AES-256-GCM encryption. Content is encrypted during the build process and decrypted in the browser when the correct password is entered.

## How It Works

### 1. Build-Time Encryption (Server-Side)

When Hexo processes a markdown file with a `password` field in the front matter:

```javascript
// Plugin registers two filters
hexo.extend.filter.register('before_post_render', function(data) {
  if (data.password) {
    data._isPasswordProtected = true;
    data._originalContent = data.content;
    data._password = data.password;
  }
  return data;
});

hexo.extend.filter.register('after_post_render', function(data) {
  if (data._isPasswordProtected) {
    const encryptedData = encryptContent(data.content, data._password);
    data.content = generatePasswordProtectedHTML(encryptedData, data.title);
  }
  return data;
});
```

### 2. Encryption Process

```javascript
function encryptContent(content, password) {
  // 1. Generate random salt (16 bytes)
  const salt = crypto.randomBytes(16);

  // 2. Derive encryption key using PBKDF2
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');

  // 3. Generate random IV (12 bytes for GCM)
  const iv = crypto.randomBytes(12);

  // 4. Create AES-256-GCM cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // 5. Encrypt content
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // 6. Get authentication tag
  const authTag = cipher.getAuthTag();

  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    encrypted: encrypted
  };
}
```

### 3. Client-Side Decryption

The encrypted content is embedded in JavaScript and decrypted using the Web Crypto API:

```javascript
async function decryptContent() {
  const password = document.getElementById('password-input').value;

  // 1. Derive same key using PBKDF2
  const key = await pbkdf2(password, encryptedData.salt, 10000, 32);

  // 2. Import key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'AES-GCM' }, false, ['decrypt']
  );

  // 3. Decrypt content
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv, tagLength: 128 },
    cryptoKey,
    encryptedWithTag
  );

  // 4. Display decrypted HTML
  const content = new TextDecoder().decode(decrypted);
  document.getElementById('decrypted-content').innerHTML = content;
}
```

## Security Features

### Encryption Specifications
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with SHA-256, 10,000 iterations
- **Salt**: 16 random bytes per post
- **IV**: 12 random bytes per post
- **Authentication**: Built-in GCM authentication tag

### Security Properties
- **Confidentiality**: Content encrypted with strong AES-256
- **Integrity**: GCM mode provides built-in authentication
- **Unique Encryption**: Each post uses unique salt and IV
- **Password Security**: PBKDF2 makes brute force attacks impractical
- **No Server Dependencies**: Works with static hosting

## File Structure

```
hexo-password/
├── index.js              # Main plugin file
├── package.json           # Plugin metadata
├── README.md             # User documentation
├── TECHNICAL_GUIDE.md    # This file
├── example-protected-post.md  # Example usage
└── test-site/            # Test environment
    ├── source/_posts/
    │   ├── protected-post.md
    │   └── public-post.md
    └── public/           # Generated site
```

## Debugging Guide

### Common Issues

1. **Plugin Not Loading**
   ```bash
   # Check if plugin is in package.json dependencies
   cat package.json | grep hexo-password

   # Verify plugin files exist
   ls node_modules/hexo-password/
   ```

2. **Encryption Errors**
   ```bash
   # Check Node.js version (requires 14+)
   node --version

   # Test crypto functions
   node -e "console.log(require('crypto').getCiphers().includes('aes-256-gcm'))"
   ```

3. **Browser Compatibility**
   - Requires Web Crypto API support
   - Check browser console for errors
   - Verify HTTPS (required for crypto.subtle)

### Debug Mode

Add debug logging to the plugin:

```javascript
function encryptContent(content, password) {
  console.log('Encrypting content length:', content.length);
  console.log('Password provided:', !!password);

  // ... encryption code ...

  console.log('Encryption successful, data size:', encrypted.length);
  return result;
}
```

### Testing Encryption/Decryption

```javascript
// Test in Node.js console
const crypto = require('crypto');

// Test encryption
const testContent = "Hello World";
const testPassword = "test123";
const result = encryptContent(testContent, testPassword);
console.log('Encrypted:', result);

// Verify data integrity
console.log('Salt length:', Buffer.from(result.salt, 'base64').length);
console.log('IV length:', Buffer.from(result.iv, 'base64').length);
console.log('AuthTag length:', Buffer.from(result.authTag, 'base64').length);
```

## Publishing & Installation

### Method 1: NPM Publication

1. **Prepare for NPM**:
   ```bash
   # Update package.json
   {
     "name": "hexo-password-protect",
     "version": "1.0.0",
     "description": "Secure password protection for Hexo posts",
     "main": "index.js",
     "keywords": ["hexo", "plugin", "password", "encryption"],
     "repository": "your-repo-url",
     "bugs": "your-issues-url",
     "license": "MIT"
   }
   ```

2. **Publish to NPM**:
   ```bash
   npm login
   npm publish
   ```

3. **Install in Your Hexo Project**:
   ```bash
   cd your-hexo-site
   npm install hexo-password-protect
   ```

### Method 2: Direct Installation

1. **Copy Plugin to Your Project**:
   ```bash
   # In your Hexo site directory
   mkdir -p node_modules/hexo-password
   cp /path/to/plugin/* node_modules/hexo-password/
   ```

2. **Add to package.json**:
   ```json
   {
     "dependencies": {
       "hexo-password": "file:./node_modules/hexo-password"
     }
   }
   ```

### Method 3: Git Submodule

1. **Add as Submodule**:
   ```bash
   git submodule add https://github.com/yourusername/hexo-password.git plugins/hexo-password
   ```

2. **Symlink to node_modules**:
   ```bash
   ln -s ../../plugins/hexo-password node_modules/hexo-password
   ```

## Usage in Your Hexo Site

1. **Create Protected Post**:
   ```yaml
   ---
   title: My Secret Post
   date: 2023-12-01
   password: mySecretPassword
   ---

   This content will be password protected!
   ```

2. **Build and Deploy**:
   ```bash
   hexo clean
   hexo generate
   hexo deploy  # or copy public/ to your hosting
   ```

3. **Test Locally**:
   ```bash
   hexo server
   # Visit http://localhost:4000/your-post-url/
   ```

## Customization

### Custom Password Prompt Styling

Modify the `generatePasswordProtectedHTML` function to customize the UI:

```javascript
function generatePasswordProtectedHTML(encryptedData, title) {
  return `
    <div class="custom-password-protection">
      <div class="password-form">
        <h3>🔐 ${title} is Protected</h3>
        <input type="password" id="password-input" placeholder="Enter password">
        <button onclick="decryptContent()">Unlock</button>
      </div>
    </div>
    <!-- Include your custom CSS -->
    <style>
      .custom-password-protection { /* your styles */ }
    </style>
    <!-- Decryption script remains the same -->
  `;
}
```

### Multiple Password Levels

Extend the plugin to support different access levels:

```yaml
---
title: Multi-Level Secret
passwords:
  basic: "level1pass"
  admin: "level2pass"
access_level: basic
---
```

### Integration with Themes

Add theme-specific classes and styling to match your Hexo theme's design system.

## Performance Considerations

- **Build Time**: Encryption adds minimal overhead (~1ms per post)
- **Page Load**: Client-side decryption is fast (<100ms)
- **Bundle Size**: Adds ~2KB of JavaScript per protected post
- **SEO Impact**: Protected content not indexed (by design)

## Security Considerations

### Limitations
- **Client-Side Security**: Encryption key derived from password in browser
- **Static Hosting**: No server-side validation possible
- **Password Strength**: Security depends on user choosing strong passwords
- **Brute Force**: Determined attackers can attempt offline brute force

### Best Practices
- Use strong, unique passwords for each protected post
- Consider password expiration for highly sensitive content
- Monitor for unauthorized access attempts (if using analytics)
- Keep plugin updated for security patches

### Threat Model
This plugin protects against:
- ✅ Casual browsing of protected content
- ✅ Search engine indexing
- ✅ Content scraping bots
- ✅ Accidental disclosure

This plugin does NOT protect against:
- ❌ Determined attackers with significant resources
- ❌ Password shoulder surfing
- ❌ Compromised user devices
- ❌ Social engineering attacks

## Contributing

To contribute to the plugin:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure backward compatibility
5. Submit a pull request

## License

ISC License - see LICENSE file for details.