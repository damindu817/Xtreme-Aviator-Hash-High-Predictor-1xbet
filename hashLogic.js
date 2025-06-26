const hashLogic = (function() {
    // Lite version optimized for 2x and 3x predictions
    
    const calculateEntropy = (hash) => {
        if (!hash || hash.length !== 128) return 0;
        
        const freq = {};
        for (const char of hash) {
            freq[char] = (freq[char] || 0) + 1;
        }
        
        let entropy = 0;
        const len = hash.length;
        for (const char in freq) {
            const p = freq[char] / len;
            entropy -= p * Math.log2(p);
        }
        
        return entropy;
    };
    
    const scoreFromHash = (hash) => {
        if (!hash || hash.length !== 128) return 0;
        
        // Lite scoring focuses on positions that matter for 2x/3x
        const scorePositions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110];
        let score = 0;
        
        for (const pos of scorePositions) {
            const char = hash.charAt(pos);
            const hexValue = parseInt(char, 16);
            
            // For 2x/3x, we want more balanced values (4-12 range)
            if (hexValue >= 4 && hexValue <= 12) {
                score += 3;
            } else if (hexValue === 0 || hexValue === 15) {
                score -= 2; // Penalize extremes less harshly
            }
        }
        
        // Bonus for repeating patterns (2-3 chars) which are common in 2x/3x
        const repeatingPatterns = hash.match(/([0-9a-f])\1{1,2}/g);
        if (repeatingPatterns) {
            score += Math.min(repeatingPatterns.length * 2, 10);
        }
        
        return Math.max(0, Math.min(score, 100)); // Keep score between 0-100
    };
    
    const calculateConfidence = (entropy, score, odd, hash) => {
        if (!hash || hash.length !== 128) return 0;
        
        // Base confidence from score (adjusted for 2x/3x)
        let confidence = score * 0.8;
        
        // Entropy adjustments (less aggressive than full version)
        if (entropy > 3.8 && entropy < 4.3) {
            confidence += 10; // Sweet spot for 2x/3x
        } else if (entropy <= 3.5) {
            confidence -= 5; // Slightly penalize low entropy
        }
        
        // Odd-specific adjustments
        if (odd === '2') {
            // 2x prefers more balanced hashes
            confidence += 5;
            
            // Bonus for alternating patterns common in 2x
            const altPatterns = hash.match(/([0-9a-f][0-9a-f])/g);
            if (altPatterns && altPatterns.length > 10) {
                confidence += 8;
            }
        } else if (odd === '3') {
            // 3x can handle slightly more variation
            confidence += 3;
            
            // Small repeating sequences (2-3 chars) help 3x
            const smallRepeats = hash.match(/([0-9a-f]{2,3})\1/g);
            if (smallRepeats) {
                confidence += smallRepeats.length * 2;
            }
        }
        
        // Final adjustments
        confidence = Math.max(10, Math.min(confidence, 95));
        
        return Math.round(confidence);
    };
    
    const calculateDelay = (score, entropy, odd, hash) => {
        if (!hash || hash.length !== 128) return 30;
        
        // Base delay (seconds)
        let delay = parseInt(odd) * 30; // 60s for 2x, 90s for 3x
        
        // Adjust based on score (higher score = slightly shorter delay)
        delay -= Math.floor(score / 20);
        
        // Small entropy adjustment
        if (entropy > 4.0) {
            delay += 5;
        } else if (entropy < 3.8) {
            delay -= 5;
        }
        
        // Ensure reasonable bounds
        return Math.max(20, Math.min(delay, 90));
    };
    
    // Public API
    return {
        calcEntropy: calculateEntropy,
        scoreFromHash: scoreFromHash,
        calculateConfidence: calculateConfidence,
        calculateDelay: calculateDelay
    };
})();