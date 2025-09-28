---
title: Password Protected Example
date: 2023-12-01 10:00:00
password: demo123
tags:
  - example
  - protected
---

# 🔒 This is a Protected Post!

Congratulations! You've successfully unlocked this password-protected content.

## How it works:

1. The content was encrypted during the Hexo build process
2. Only users with the correct password can decrypt and view it
3. The password for this example post is: **demo123**

## Features:

- ✅ Strong AES-256-GCM encryption
- ✅ PBKDF2 key derivation (10,000 iterations)
- ✅ Client-side decryption using Web Crypto API
- ✅ Works with static hosting (GitHub Pages, Netlify, etc.)
- ✅ No server dependencies required

## Usage:

To create your own protected posts, simply add a `password` field to the front matter:

```yaml
---
title: My Secret Post
password: your-secure-password
---

Your protected content here...
```

## Security Notes:

- Choose strong, unique passwords
- Content is encrypted and not visible in HTML source
- Decryption happens entirely in the browser
- No passwords are stored or transmitted

Happy blogging with secure content! 🎉
