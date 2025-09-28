#!/bin/bash

# Hexo Password Protection Plugin Installer
# Usage: ./install.sh /path/to/your/hexo/site

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <hexo-site-directory>"
    echo "Example: $0 /home/user/my-hexo-blog"
    exit 1
fi

HEXO_SITE="$1"
PLUGIN_DIR="$(dirname "$0")"

if [ ! -d "$HEXO_SITE" ]; then
    echo "Error: Directory $HEXO_SITE does not exist"
    exit 1
fi

if [ ! -f "$HEXO_SITE/package.json" ]; then
    echo "Error: $HEXO_SITE does not appear to be a Hexo site (no package.json found)"
    exit 1
fi

echo "Installing hexo-password plugin to $HEXO_SITE..."

# Create plugin directory
mkdir -p "$HEXO_SITE/node_modules/hexo-password"

# Copy plugin files
cp "$PLUGIN_DIR/index.js" "$HEXO_SITE/node_modules/hexo-password/"
cp "$PLUGIN_DIR/package.json" "$HEXO_SITE/node_modules/hexo-password/"

# Add to package.json if not already present
if ! grep -q "hexo-password" "$HEXO_SITE/package.json"; then
    echo "Adding hexo-password to package.json..."

    # Backup original package.json
    cp "$HEXO_SITE/package.json" "$HEXO_SITE/package.json.backup"

    # Add dependency using Node.js
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$HEXO_SITE/package.json', 'utf8'));
        if (!pkg.dependencies) pkg.dependencies = {};
        pkg.dependencies['hexo-password'] = 'file:./node_modules/hexo-password';
        fs.writeFileSync('$HEXO_SITE/package.json', JSON.stringify(pkg, null, 2));
    "

    echo "✅ Added hexo-password dependency to package.json"
else
    echo "✅ hexo-password already in package.json"
fi

# Create example protected post
EXAMPLE_POST="$HEXO_SITE/source/_posts/example-protected-post.md"
if [ ! -f "$EXAMPLE_POST" ]; then
    cat > "$EXAMPLE_POST" << 'EOF'
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
EOF
    echo "✅ Created example protected post: $EXAMPLE_POST"
else
    echo "✅ Example post already exists"
fi

# Copy documentation
cp "$PLUGIN_DIR/README.md" "$HEXO_SITE/hexo-password-README.md" 2>/dev/null || true
cp "$PLUGIN_DIR/TECHNICAL_GUIDE.md" "$HEXO_SITE/hexo-password-TECHNICAL_GUIDE.md" 2>/dev/null || true

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. cd $HEXO_SITE"
echo "2. hexo clean && hexo generate"
echo "3. hexo server"
echo "4. Visit your protected post and test with password: demo123"
echo ""
echo "Documentation copied to:"
echo "- hexo-password-README.md"
echo "- hexo-password-TECHNICAL_GUIDE.md"
echo ""
echo "To create protected posts, add 'password: your-password' to the front matter."