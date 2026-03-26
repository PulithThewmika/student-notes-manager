const fs = require('fs');

function fixColors(path) {
  let text = fs.readFileSync(path, 'utf8');
  
  text = text.replace(/#0f0f0d/ig, 'var(--bg2)');
  text = text.replace(/#0c0c0a/ig, 'var(--bg)');
  text = text.replace(/#111110/ig, 'var(--bg3)');
  text = text.replace(/#0d0d0b/ig, 'var(--bg3)');
  
  text = text.replace(/#1e1e1b/ig, 'var(--border)');
  text = text.replace(/#1a1a17/ig, 'var(--border)');
  text = text.replace(/#252521/ig, 'var(--border2)');
  text = text.replace(/#3a3835/ig, 'var(--border2)');
  
  text = text.replace(/#e8e5de/ig, 'var(--text)');
  text = text.replace(/#807d76/ig, 'var(--text2)');
  text = text.replace(/#c8c5be/ig, 'var(--text2)');
  text = text.replace(/#4a4844/ig, 'var(--text3)');
  text = text.replace(/#2a2a26/ig, 'var(--text4)');
  text = text.replace(/#333330/ig, 'var(--text4)');
  
  text = text.replace(/#1D9E75/gi, 'var(--accent)');
  text = text.replace(/#17876a/gi, 'var(--accent-hover)');
  text = text.replace(/#0d1f19/gi, 'var(--accent-bg)');
  text = text.replace(/#1D9E7518/gi, 'var(--accent-dim)');
  text = text.replace(/#1D9E7522/gi, 'var(--accent-dim)');
  text = text.replace(/#1D9E7544/gi, 'var(--accent-border)');
  
  text = text.replace(/background:\s*['"]white['"]/ig, 'background: \"var(--bg)\"');
  text = text.replace(/background:\s*['"]#fff['"]/ig, 'background: \"var(--bg)\"');
  text = text.replace(/background:\s*['"]#ffffff['"]/ig, 'background: \"var(--bg)\"');

  fs.writeFileSync(path, text, 'utf8');
}

fixColors('React.js front-end/src/LoginPage.jsx');
fixColors('React.js front-end/src/RegisterPage.jsx');
