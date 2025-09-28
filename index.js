const crypto = require('crypto');

function encryptContent(content, password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(content, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    encrypted: encrypted
  };
}

function generatePasswordProtectedHTML(encryptedData, title) {
  return `
<div id="password-protected-content">
  <div style="max-width: 400px; margin: 50px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; font-family: Arial, sans-serif;">
    <h3 style="text-align: center; margin-bottom: 20px;">Protected Content</h3>
    <p style="margin-bottom: 15px; color: #666;">This post is password protected. Please enter the password to view the content.</p>
    <input type="password" id="password-input" placeholder="Enter password"
           style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px;">
    <button onclick="decryptContent()"
            style="width: 100%; padding: 10px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Unlock Content
    </button>
    <div id="error-message" style="color: red; margin-top: 10px; display: none;">Incorrect password. Please try again.</div>
  </div>
</div>


<script>
const encryptedData = ${JSON.stringify(encryptedData)};

async function pbkdf2(password, salt, iterations, keyLength) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    keyLength * 8
  );

  return new Uint8Array(derivedBits);
}

function regenerateTableOfContents() {
  // Find TOC elements - check both main TOC and footer TOC for Cactus theme
  const tocSelectors = [
    '#toc ol.toc',           // Cactus main TOC
    '#toc-footer ol.toc',    // Cactus footer TOC
    '.toc',                  // Generic TOC
    '.post-toc',
    '.article-toc',
    '.table-of-contents',
    '#toc',
    '.toc-content'
  ];

  const tocElements = [];
  tocSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if (!tocElements.includes(el)) {
        tocElements.push(el);
      }
    });
  });

  if (tocElements.length === 0) return; // No TOC found

  // Get all headings from the content container (match live version structure)
  const articleContainer = document.querySelector('.content.e-content') ||
                          document.querySelector('.content') ||
                          document.querySelector('.article-entry') ||
                          document.querySelector('.post-content') ||
                          document.querySelector('article');
  const headings = articleContainer ? articleContainer.querySelectorAll('h1, h2, h3, h4, h5, h6') : [];

  if (headings.length === 0) {
    // No headings, hide TOC
    tocElements.forEach(toc => toc.style.display = 'none');
    return;
  }

  // Detect the theme style by checking existing structure
  const firstTocElement = tocElements[0];
  const isCactusTheme = firstTocElement.classList.contains('toc') &&
                        firstTocElement.tagName === 'OL';

  // Generate new TOC HTML based on theme
  let tocHTML = '';
  let tocNumbers = [];

  if (isCactusTheme) {
    // Use Cactus theme structure
    tocHTML = generateCactusTOC(headings);
  } else {
    // Use generic structure
    tocHTML = generateGenericTOC(headings);
  }

  // Update all TOC elements
  tocElements.forEach(tocElement => {
    tocElement.innerHTML = tocHTML;
    tocElement.style.display = '';
  });
}

function generateCactusTOC(headings) {
  let tocHTML = '';
  let numbers = [0, 0, 0, 0, 0, 0]; // Track numbering for each level
  let currentLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent;
    const id = heading.id || 'heading-' + index;

    // Ensure heading has an ID for linking
    if (!heading.id) {
      heading.id = id;
    }

    // Update numbering
    numbers[level - 1]++;
    // Reset deeper level numbers
    for (let i = level; i < 6; i++) {
      numbers[i] = 0;
    }

    // Generate number string (e.g., "2.1." or "3.")
    let numberStr = '';
    for (let i = 0; i < level; i++) {
      if (numbers[i] > 0) {
        numberStr += numbers[i] + '.';
      }
    }

    // Handle nesting
    if (level > currentLevel) {
      // Opening nested levels
      for (let i = currentLevel; i < level - 1; i++) {
        tocHTML += '<ol class="toc-child">';
      }
      if (level > 1 && currentLevel < level - 1) {
        tocHTML += '<ol class="toc-child">';
      }
    } else if (level < currentLevel) {
      // Closing nested levels
      for (let i = currentLevel; i > level; i--) {
        tocHTML += '</ol>';
      }
    }

    tocHTML += '<li class="toc-item toc-level-' + level + '">' +
               '<a class="toc-link" href="#' + id + '">' +
               '<span class="toc-number">' + numberStr + '</span> ' +
               '<span class="toc-text">' + text + '</span>' +
               '</a>';

    // Check if next heading is deeper (will need to open child)
    const nextHeading = headings[index + 1];
    if (nextHeading) {
      const nextLevel = parseInt(nextHeading.tagName.charAt(1));
      if (nextLevel > level) {
        // Don't close this li yet, child elements coming
      } else {
        tocHTML += '</li>';
      }
    } else {
      tocHTML += '</li>';
    }

    currentLevel = level;
  });

  // Close any remaining open levels
  for (let i = currentLevel; i > 1; i--) {
    tocHTML += '</ol>';
  }

  return tocHTML;
}

function generateGenericTOC(headings) {
  let tocHTML = '';
  let currentLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent;
    const id = heading.id || 'heading-' + index;

    // Ensure heading has an ID for linking
    if (!heading.id) {
      heading.id = id;
    }

    if (level > currentLevel) {
      tocHTML += '<ul>'.repeat(level - currentLevel);
    } else if (level < currentLevel) {
      tocHTML += '</ul>'.repeat(currentLevel - level);
    }

    tocHTML += '<li><a href="#' + id + '">' + text + '</a></li>';
    currentLevel = level;
  });

  tocHTML += '</ul>'.repeat(currentLevel);
  return tocHTML;
}

async function decryptContent() {
  const password = document.getElementById('password-input').value;
  const errorDiv = document.getElementById('error-message');

  if (!password) {
    errorDiv.textContent = 'Please enter a password.';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    errorDiv.style.display = 'none';

    const key = await pbkdf2(password, encryptedData.salt, 10000, 32);
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const authTag = Uint8Array.from(atob(encryptedData.authTag), c => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(encryptedData.encrypted), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const encryptedWithTag = new Uint8Array(encrypted.length + authTag.length);
    encryptedWithTag.set(encrypted);
    encryptedWithTag.set(authTag, encrypted.length);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      cryptoKey,
      encryptedWithTag
    );

    const content = new TextDecoder().decode(decrypted);

    // Find the content container and replace only the inner content (like hexo-blog-encrypt does)
    const contentContainer = document.querySelector('.content.e-content') ||
                            document.querySelector('.content') ||
                            document.querySelector('.article-entry') ||
                            document.querySelector('.post-content');

    if (contentContainer) {
      // Replace only the inner content, preserving the container and its classes
      contentContainer.innerHTML = content;
    } else {
      // Fallback: replace the password container directly
      const passwordContainer = document.getElementById('password-protected-content');
      passwordContainer.outerHTML = content;
    }

    // Regenerate table of contents if it exists
    regenerateTableOfContents();

  } catch (error) {
    errorDiv.textContent = 'Incorrect password. Please try again.';
    errorDiv.style.display = 'block';
  }
}

document.getElementById('password-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    decryptContent();
  }
});
</script>`;
}

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

    delete data._originalContent;
    delete data._password;
  }
  return data;
});
