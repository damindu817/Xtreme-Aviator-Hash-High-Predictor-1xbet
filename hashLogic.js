// Hash analysis functions
function calcEntropy(hash) {
  const freq = {};
  for (let c of hash) freq[c] = (freq[c] || 0) + 1;
  return Object.values(freq).reduce((acc, f) => {
    const p = f / hash.length;
    return acc - p * Math.log2(p);
  }, 0);
}

function scoreFromHash(hash) {
  const indexes = [5, 15, 25, 35, 50, 75, 100, 120];
  return indexes.reduce((sum, i) => sum + parseInt(hash[i], 16), 0);
}

function calculateConfidence(entropy, score, oddTarget, hash) {
  let confidence = 50;
  if (entropy > 4.2) confidence += 10;
  if (entropy > 4.5) confidence += 15;
  if (score % 7 === 0) confidence += 8;
  if (score % 5 === 0) confidence += 5;
  if (/(\w)\1{2,}/.test(hash)) confidence += 15;
  if (/(\w{2,4})\1{1,}/.test(hash)) confidence += 10;
  const tail = hash.slice(-4);
  if (/^(aaaa|ffff|0000|1111)$/.test(tail)) confidence += 20;

  // Odd-specific adjustments
  if (oddTarget === '3') confidence += 5;
  if (oddTarget === '2') {
    if (entropy > 4.0 && entropy < 4.3) confidence += 10;
    if (score >= 50 && score <= 85) confidence += 7;
  }

  return Math.min(98, Math.max(5, Math.round(confidence)));
}

function calculateDelay(score, entropy, oddTarget, hash) {
  let base = parseInt(oddTarget) * 45;
  if (entropy > 4.3) base += 20;
  if (score % 7 === 0) base += 30;
  if (score % 5 === 0) base += 15;
  if (/(\w)\1{2,}/.test(hash)) base += 20;
  if (/(\w{2,4})\1{1,}/.test(hash)) base += 15;
  return Math.max(45, base);
}

// Main prediction function
function runPredictionWithUI(oddTarget) {
  const hash = document.getElementById('hashInput').value.trim().toLowerCase();
  if (hash.length !== 128 || !/^[a-f0-9]+$/.test(hash)) {
    showAlert('Invalid SHA512 hash! Must be exactly 128 hexadecimal characters (0-9, a-f).');
    return;
  }

  // Show loading indicator
  const loadingIndicator = document.getElementById('loadingIndicator');
  loadingIndicator.classList.add('show');

  // Simulate processing delay for better UX
  setTimeout(() => {
    const entropy = calcEntropy(hash);
    const score = scoreFromHash(hash);
    const confidence = calculateConfidence(entropy, score, oddTarget, hash);
    const delay = calculateDelay(score, entropy, oddTarget, hash);

    const currentTime = new Date();
    const futureTime = new Date(currentTime.getTime() + delay * 1000);
    
    // Format time in 24-hour format
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const timeString = futureTime.toLocaleTimeString('en-US', timeOptions);

    // Update results
    document.getElementById('entropyValue').textContent = entropy.toFixed(3);
    document.getElementById('scoreValue').textContent = score;
    document.getElementById('confidenceValue').textContent = confidence + '%';
    
    // Add confidence class based on value
    const confidenceElement = document.getElementById('confidenceValue');
    confidenceElement.className = 'result-value ';
    if (confidence >= 70) confidenceElement.classList.add('confidence-high');
    else if (confidence >= 40) confidenceElement.classList.add('confidence-medium');
    else confidenceElement.classList.add('confidence-low');
    
    document.getElementById('delayValue').textContent = delay + 's';
    document.getElementById('timeValue').textContent = timeString;
    document.getElementById('selectedMultiplier').textContent = oddTarget === '2' ? '2× DOUBLE' : '3× TRIPLE';

    // Update progress bars
    document.getElementById('entropyProgress').style.width = `${Math.min(100, (entropy / 5) * 100)}%`;
    document.getElementById('scoreProgress').style.width = `${Math.min(100, (score / 128) * 100)}%`;
    document.getElementById('confidenceProgress').style.width = `${confidence}%`;
    document.getElementById('delayProgress').style.width = `${Math.min(100, (delay / 180) * 100)}%`;

    // Hide loading indicator
    setTimeout(() => {
      loadingIndicator.classList.remove('show');
      
      // Scroll to results
      document.getElementById('resultBox').scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      });
    }, 300);
  }, 1500);
}
