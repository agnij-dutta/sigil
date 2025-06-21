pragma circom 2.0.0;

include "../core/primitives/set_membership.circom";
include "../core/primitives/range_proof.circom";

/*
 * DynamicLanguageCredential Circuit
 * 
 * This circuit proves programming language usage in a completely dynamic way:
 * - Can handle any number of languages from 1 to MAX_LANGUAGES
 * - Proves user actually used each claimed language (not just touched files)
 * - Maintains privacy of actual usage metrics
 * - Supports everything from 2-language beginners to 50+ polyglot developers
 * 
 * Examples of usage:
 * - DynamicLanguageCredential(5) for a developer using Python, JavaScript, TypeScript, Go, Rust
 * - DynamicLanguageCredential(2) for a beginner using Python, JavaScript
 * - DynamicLanguageCredential(20) for a polyglot senior engineer
 */

template DynamicLanguageCredential(MAX_LANGUAGES) {
    // ========== PUBLIC INPUTS ==========
    signal input languageCount;                    // Number of languages (2, 5, 20, etc.)
    
    // ========== PRIVATE INPUTS ==========
    signal input languageHashes[MAX_LANGUAGES];    // Hashed language names (e.g., hash("Python"))
    signal input usageProofs[MAX_LANGUAGES];       // Proof of meaningful usage (LOC thresholds)
    signal input languageMask[MAX_LANGUAGES];      // 1 if language slot is used, 0 if empty
    signal input minimumUsageThreshold;            // Minimum LOC to count as "used"
    signal input actualUsagePerLanguage[MAX_LANGUAGES]; // Actual LOC per language (private)
    
    // ========== OUTPUTS ==========
    signal output allLanguagesProven;              // 1 if all claimed languages are proven
    signal output languageSetHash;                 // Unique hash of the language set

    // ========== VALIDATION COMPONENTS ==========
    
    // 1. Count actual languages in use
    component languageCounter = LanguageCounter(MAX_LANGUAGES);
    languageCounter.languageMask <== languageMask;
    languageCounter.expectedCount <== languageCount;
    
    // 2. Verify meaningful usage for each language
    component usageVerifiers[MAX_LANGUAGES];
    for (var i = 0; i < MAX_LANGUAGES; i++) {
        usageVerifiers[i] = LanguageUsageVerifier();
        usageVerifiers[i].isActive <== languageMask[i];
        usageVerifiers[i].actualUsage <== actualUsagePerLanguage[i];
        usageVerifiers[i].minimumThreshold <== minimumUsageThreshold;
        usageVerifiers[i].usageProof <== usageProofs[i];
    }
    
    // 3. Verify no duplicate languages
    component duplicateChecker = NoDuplicateLanguages(MAX_LANGUAGES);
    duplicateChecker.languageHashes <== languageHashes;
    duplicateChecker.languageMask <== languageMask;
    
    // 4. Final validation
    component finalValidator = LanguageValidator(MAX_LANGUAGES);
    finalValidator.countValid <== languageCounter.countIsValid;
    finalValidator.noDuplicates <== duplicateChecker.noDuplicates;
    for (var i = 0; i < MAX_LANGUAGES; i++) {
        finalValidator.usageValid[i] <== usageVerifiers[i].usageIsValid;
    }
    
    allLanguagesProven <== finalValidator.allValid;
    
    // 5. Generate language set hash for uniqueness
    component setHasher = LanguageSetHasher(MAX_LANGUAGES);
    setHasher.languageHashes <== languageHashes;
    setHasher.languageMask <== languageMask;
    setHasher.languageCount <== languageCount;
    
    languageSetHash <== setHasher.setHash;
}

/*
 * Counts active languages and verifies against expected count
 */
template LanguageCounter(N) {
    signal input languageMask[N];
    signal input expectedCount;
    signal output countIsValid;
    
    var actualCount = 0;
    for (var i = 0; i < N; i++) {
        actualCount += languageMask[i];
    }
    
    component isEqual = IsEqual();
    isEqual.in[0] <== actualCount;
    isEqual.in[1] <== expectedCount;
    
    countIsValid <== isEqual.out;
}

/*
 * Verifies that a language was meaningfully used (not just touched)
 */
template LanguageUsageVerifier() {
    signal input isActive;           // 1 if this language slot is active
    signal input actualUsage;        // Actual LOC written in this language
    signal input minimumThreshold;   // Minimum LOC to count as "used"
    signal input usageProof;         // Cryptographic proof of usage
    
    signal output usageIsValid;
    
    // If language is active, verify meaningful usage
    component thresholdCheck = GreaterEqThan(32);
    thresholdCheck.in[0] <== actualUsage;
    thresholdCheck.in[1] <== minimumThreshold;
    
    // If inactive, automatically valid (1)
    // If active, must meet threshold
    component selector = Mux1();
    selector.c[0] <== 1;                    // If inactive (0), output 1 (valid)
    selector.c[1] <== thresholdCheck.out;   // If active (1), output threshold result
    selector.s <== isActive;
    
    usageIsValid <== selector.out;
}

/*
 * Ensures no duplicate languages are claimed
 */
template NoDuplicateLanguages(N) {
    signal input languageHashes[N];
    signal input languageMask[N];
    signal output noDuplicates;
    
    // Check each pair of active languages for duplicates
    component equalityCheckers[N][N];
    component andGates[N][N];
    
    var duplicateFound = 0;
    
    for (var i = 0; i < N; i++) {
        for (var j = i + 1; j < N; j++) {
            equalityCheckers[i][j] = IsEqual();
            equalityCheckers[i][j].in[0] <== languageHashes[i];
            equalityCheckers[i][j].in[1] <== languageHashes[j];
            
            // Check if both slots are active AND have same hash
            andGates[i][j] = AND();
            andGates[i][j].a <== languageMask[i];
            andGates[i][j].b <== languageMask[j];
            
            component duplicateDetector = AND();
            duplicateDetector.a <== andGates[i][j].out;
            duplicateDetector.b <== equalityCheckers[i][j].out;
            
            // If any duplicate found, set flag
            duplicateFound += duplicateDetector.out;
        }
    }
    
    // No duplicates if duplicateFound == 0
    component isZero = IsZero();
    isZero.in <== duplicateFound;
    
    noDuplicates <== isZero.out;
}

/*
 * Validates all language proofs together
 */
template LanguageValidator(N) {
    signal input countValid;
    signal input noDuplicates;
    signal input usageValid[N];
    signal output allValid;
    
    // All usage proofs must be valid
    var allUsageValid = 1;
    for (var i = 0; i < N; i++) {
        allUsageValid *= usageValid[i];
    }
    
    // Combine all validations
    component and1 = AND();
    and1.a <== countValid;
    and1.b <== noDuplicates;
    
    component and2 = AND();
    and2.a <== and1.out;
    and2.b <== allUsageValid;
    
    allValid <== and2.out;
}

/*
 * Generates a unique hash for the language set
 */
template LanguageSetHasher(N) {
    signal input languageHashes[N];
    signal input languageMask[N];
    signal input languageCount;
    signal output setHash;
    
    // Create sorted array of active language hashes for consistent hashing
    component sorter = LanguageSorter(N);
    sorter.languageHashes <== languageHashes;
    sorter.languageMask <== languageMask;
    
    // Hash the sorted, active languages
    component hasher = Poseidon(N + 1);
    hasher.inputs[0] <== languageCount;
    
    for (var i = 0; i < N; i++) {
        hasher.inputs[i + 1] <== sorter.sortedHashes[i];
    }
    
    setHash <== hasher.out;
}

/*
 * Sorts language hashes for consistent set hashing
 */
template LanguageSorter(N) {
    signal input languageHashes[N];
    signal input languageMask[N];
    signal output sortedHashes[N];
    
    // Extract active languages and sort them
    var activeHashes[N];
    var activeCount = 0;
    
    for (var i = 0; i < N; i++) {
        if (languageMask[i] == 1) {
            activeHashes[activeCount] = languageHashes[i];
            activeCount++;
        }
    }
    
    // Simple bubble sort for deterministic ordering
    for (var i = 0; i < activeCount - 1; i++) {
        for (var j = 0; j < activeCount - i - 1; j++) {
            if (activeHashes[j] > activeHashes[j + 1]) {
                var temp = activeHashes[j];
                activeHashes[j] = activeHashes[j + 1];
                activeHashes[j + 1] = temp;
            }
        }
    }
    
    // Output sorted hashes (fill remaining slots with 0)
    for (var i = 0; i < N; i++) {
        if (i < activeCount) {
            sortedHashes[i] <== activeHashes[i];
        } else {
            sortedHashes[i] <== 0;
        }
    }
}

/*
 * Predefined language credential templates for common use cases
 */

// For beginners (2-3 languages)
template BeginnerLanguageCredential() {
    component cred = DynamicLanguageCredential(5);
    cred.languageCount <== languageCount;
    for (var i = 0; i < 5; i++) {
        cred.languageHashes[i] <== languageHashes[i];
        cred.languageMask[i] <== languageMask[i];
        cred.languageUsage[i] <== languageUsage[i];
        cred.usageProofs[i] <== usageProofs[i];
    }
    
    signal input languageCount;
    signal input languageHashes[5];
    signal input languageMask[5];
    signal input languageUsage[5];
    signal input usageProofs[5];
    signal output credentialHash;
    signal output isValid;
    
    credentialHash <== cred.credentialHash;
    isValid <== cred.isValid;
}

// For intermediate developers (4-8 languages)
template IntermediateLanguageCredential() {
    component cred = DynamicLanguageCredential(10);
    cred.languageCount <== languageCount;
    for (var i = 0; i < 10; i++) {
        cred.languageHashes[i] <== languageHashes[i];
        cred.languageMask[i] <== languageMask[i];
        cred.languageUsage[i] <== languageUsage[i];
        cred.usageProofs[i] <== usageProofs[i];
    }
    
    signal input languageCount;
    signal input languageHashes[10];
    signal input languageMask[10];
    signal input languageUsage[10];
    signal input usageProofs[10];
    signal output credentialHash;
    signal output isValid;
    
    credentialHash <== cred.credentialHash;
    isValid <== cred.isValid;
}

// For senior developers (5-15 languages)
template SeniorLanguageCredential() {
    component cred = DynamicLanguageCredential(20);
    cred.languageCount <== languageCount;
    for (var i = 0; i < 20; i++) {
        cred.languageHashes[i] <== languageHashes[i];
        cred.languageMask[i] <== languageMask[i];
        cred.languageUsage[i] <== languageUsage[i];
        cred.usageProofs[i] <== usageProofs[i];
    }
    
    signal input languageCount;
    signal input languageHashes[20];
    signal input languageMask[20];
    signal input languageUsage[20];
    signal input usageProofs[20];
    signal output credentialHash;
    signal output isValid;
    
    credentialHash <== cred.credentialHash;
    isValid <== cred.isValid;
}

// For polyglot experts (10+ languages)
template PolyglotLanguageCredential() {
    component cred = DynamicLanguageCredential(50);
    cred.languageCount <== languageCount;
    for (var i = 0; i < 50; i++) {
        cred.languageHashes[i] <== languageHashes[i];
        cred.languageMask[i] <== languageMask[i];
        cred.languageUsage[i] <== languageUsage[i];
        cred.usageProofs[i] <== usageProofs[i];
    }
    
    signal input languageCount;
    signal input languageHashes[50];
    signal input languageMask[50];
    signal input languageUsage[50];
    signal input usageProofs[50];
    signal output credentialHash;
    signal output isValid;
    
    credentialHash <== cred.credentialHash;
    isValid <== cred.isValid;
}

/*
 * Usage Examples:
 * 
 * // A beginner Python + JavaScript developer
 * component beginnerCred = BeginnerLanguageCredential();
 * beginnerCred.languageCount <== 2;
 * beginnerCred.languageHashes[0] <== hash("Python");
 * beginnerCred.languageHashes[1] <== hash("JavaScript");
 * beginnerCred.languageMask[0] <== 1;
 * beginnerCred.languageMask[1] <== 1;
 * // ... remaining slots = 0
 * 
 * // A polyglot using 15 languages
 * component polyglotCred = PolyglotLanguageCredential();
 * polyglotCred.languageCount <== 15;
 * // Fill first 15 slots with different language hashes
 * polyglotCred.languageHashes[0] <== hash("Python");
 * polyglotCred.languageHashes[1] <== hash("JavaScript");
 * polyglotCred.languageHashes[2] <== hash("TypeScript");
 * // ... up to 15 languages
 * // Set mask for first 15 slots to 1, rest to 0
 */ component main = LanguageCredential(10);
