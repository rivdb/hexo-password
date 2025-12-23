const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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
  <div id="password-form-container">
    <h3>${title}</h3>
    <p>This content is password protected.</p>
    <input type="password" id="password-input" placeholder="Enter password">
    <button onclick="decryptContent()">Unlock</button>
    <div id="error-message" style="display: none;">Incorrect password. Please try again.</div>
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

function hideTableOfContents() {
  // Hide all TOC containers on page load
  const tocContainers = document.querySelectorAll('#toc, #toc-footer, .toc-container');
  tocContainers.forEach(toc => {
    toc.style.display = 'none';
  });
}

function regenerateTableOfContents() {
  // Find TOC elements - look for the ol.toc elements specifically
  const tocSelectors = [
    '#toc ol',           // Cactus main TOC
    '#toc-footer ol',    // Cactus footer TOC
    '.toc',              // Generic TOC
    '.post-toc',
    '.article-toc',
    '.table-of-contents',
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

  // Use the SAME selector order as decryption to ensure we find the same container
  const articleContainer = document.querySelector('.content.e-content') ||
                          document.querySelector('.content') ||
                          document.querySelector('.article-entry') ||
                          document.querySelector('.post-content');

  if (!articleContainer) return;

  // Get only H2-H6 headings (exclude H1 which is typically the article title)
  const headings = Array.from(articleContainer.querySelectorAll('h2, h3, h4, h5, h6'));

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

  // Update all TOC elements and show their containers
  tocElements.forEach(tocElement => {
    tocElement.innerHTML = tocHTML;
    tocElement.style.display = '';
  });

  // Show TOC containers
  const tocContainers = document.querySelectorAll('#toc, #toc-footer, .toc-container');
  tocContainers.forEach(toc => {
    toc.style.display = '';
  });
}

function generateCactusTOC(headings) {
  let tocHTML = '';
  let numbers = [0, 0, 0, 0, 0, 0]; // Track numbering for each level
  let currentLevel = 0;
  let minLevel = Math.min(...headings.map(h => parseInt(h.tagName.charAt(1))));

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

    // Generate number string starting from minLevel
    let numberStr = '';
    for (let i = minLevel - 1; i < level; i++) {
      if (numbers[i] > 0) {
        numberStr += (numberStr ? '.' : '') + numbers[i];
      }
    }
    numberStr += '.';

    // Handle nesting - only nest if deeper than minLevel
    const relativeLevel = level - minLevel + 1;
    const relativeCurrentLevel = currentLevel - minLevel + 1;

    if (relativeLevel > relativeCurrentLevel && relativeCurrentLevel > 0) {
      tocHTML += '<ol>';
    } else if (relativeLevel < relativeCurrentLevel) {
      for (let i = relativeCurrentLevel; i > relativeLevel; i--) {
        tocHTML += '</ol></li>';
      }
    }

    if (relativeCurrentLevel > 0 && relativeLevel === relativeCurrentLevel) {
      tocHTML += '</li>';
    }

    tocHTML += '<li><a href="#' + id + '">' + numberStr + ' ' + text + '</a>';

    currentLevel = level;
  });

  // Close any remaining open tags
  const relativeCurrentLevel = currentLevel - minLevel + 1;
  tocHTML += '</li>';
  for (let i = 1; i < relativeCurrentLevel; i++) {
    tocHTML += '</ol></li>';
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

    const contentContainer = document.querySelector('.content.e-content') ||
                            document.querySelector('.content') ||
                            document.querySelector('.article-entry') ||
                            document.querySelector('.post-content');

    if (contentContainer) {
      contentContainer.innerHTML = content;
    } else {
      const passwordContainer = document.getElementById('password-protected-content');
      passwordContainer.outerHTML = content;
    }

    // Wait for DOM to update before regenerating TOC
    setTimeout(() => regenerateTableOfContents(), 0);

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

// Hide ToC on page load when password form is present
hideTableOfContents();
</script>
`;
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
    const config = hexo.config.password_protection || {};
    let themeName = config.theme || 'minimal';

    // Auto-detect theme if enabled
    if (config.auto_detect_theme) {
      const detectedTheme = hexo.config.theme_config?.colorscheme;
      if (detectedTheme) {
        // Check if the detected theme CSS file exists
        const detectedCssPath = path.join(__dirname, 'styles', `${detectedTheme}.css`);
        if (fs.existsSync(detectedCssPath)) {
          themeName = detectedTheme;
          hexo.log.debug(`[hexo-password] Auto-detected theme: ${themeName}`);
        } else {
          hexo.log.debug(`[hexo-password] Auto-detected theme '${detectedTheme}' not found, using fallback: ${themeName}`);
        }
      }
    }

    let themeCss = '';

    try {
      let cssPath;
      if (themeName.includes('/') || themeName.includes('.')) {
        cssPath = path.join(hexo.base_dir, themeName);
      } else {
        cssPath = path.join(__dirname, 'styles', `${themeName}.css`);
      }

      if (fs.existsSync(cssPath)) {
        themeCss = fs.readFileSync(cssPath, 'utf8');
      } else {
        hexo.log.warn(`[hexo-password] Theme CSS not found: ${cssPath}.`);
      }
    } catch (error) {
      hexo.log.error(`[hexo-password] Error loading theme CSS: ${error.message}`);
    }

    const encryptedData = encryptContent(data.content, data._password);
    const passwordForm = generatePasswordProtectedHTML(encryptedData, data.title);

    data.content = `<style>${themeCss}</style>${passwordForm}`;

    delete data._originalContent;
    delete data._password;
  }
  return data;
});