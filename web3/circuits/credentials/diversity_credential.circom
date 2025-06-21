pragma circom 2.0.0;

include "../core/primitives/merkle_tree.circom";
include "../core/primitives/range_proof.circom";
include "../core/primitives/set_membership.circom";

/*
    DiversityCredential: Proves skill diversity across technologies and domains
    
    This circuit proves:
    1. Programming language diversity (breadth and depth)
    2. Technology stack diversity (frameworks, tools, platforms)
    3. Project type diversity (web, mobile, AI/ML, blockchain, etc.)
    4. Domain expertise diversity (fintech, healthcare, gaming, etc.)
    5. Contribution type diversity (features, bugs, docs, tests)
    6. Architectural pattern diversity (microservices, monolith, serverless)
    7. Collaboration diversity (team sizes, role types)
*/

template DiversityCredential(
    maxLanguages,        // Maximum number of programming languages
    maxTechnologies,     // Maximum number of technologies/frameworks
    maxProjectTypes,     // Maximum number of project types
    maxDomains,          // Maximum number of business domains
    maxContributionTypes, // Maximum number of contribution types
    maxArchPatterns,     // Maximum number of architectural patterns
    maxTeamSizes         // Maximum number of different team sizes
) {
    // Input signals
    signal input userHash;                           // Hash of user identity
    signal input languageHashes[maxLanguages];       // Hashes of programming languages
    signal input languageProficiency[maxLanguages];  // Proficiency levels (1-10)
    signal input technologyHashes[maxTechnologies];  // Hashes of technologies/frameworks
    signal input technologyExperience[maxTechnologies]; // Experience levels (1-10)
    signal input projectTypeHashes[maxProjectTypes]; // Hashes of project types
    signal input projectTypeExposure[maxProjectTypes]; // Exposure levels (1-10)
    signal input domainHashes[maxDomains];           // Hashes of business domains
    signal input domainExpertise[maxDomains];        // Expertise levels (1-10)
    signal input contributionTypeHashes[maxContributionTypes]; // Contribution types
    signal input contributionFrequency[maxContributionTypes]; // Frequency (1-10)
    signal input archPatternHashes[maxArchPatterns]; // Architectural patterns
    signal input archPatternUsage[maxArchPatterns]; // Usage frequency (1-10)
    signal input teamSizes[maxTeamSizes];            // Different team sizes worked with
    signal input teamSizeExperience[maxTeamSizes];   // Experience with each size (1-10)
    
    // Diversity metrics
    signal input totalLanguages;        // Actual number of languages used
    signal input totalTechnologies;     // Actual number of technologies used
    signal input totalProjectTypes;     // Actual number of project types
    signal input totalDomains;          // Actual number of domains
    signal input totalContributionTypes; // Actual number of contribution types
    signal input totalArchPatterns;     // Actual number of architectural patterns
    signal input totalTeamSizes;        // Actual number of team sizes
    
    // Thresholds
    signal input diversityThreshold;     // Minimum diversity score required
    signal input breadthThreshold;       // Minimum breadth score required
    signal input depthThreshold;         // Minimum depth score required

    // Output signals
    signal output credentialHash;        // Hash of the credential
    signal output diversityIndex;        // Overall diversity score (0-100)
    signal output breadthScore;          // Breadth of skills score (0-100)
    signal output depthScore;            // Depth of skills score (0-100)
    signal output languageDiversity;     // Programming language diversity (0-100)
    signal output technologyDiversity;   // Technology diversity (0-100)
    signal output projectDiversity;      // Project type diversity (0-100)
    signal output domainDiversity;       // Domain expertise diversity (0-100)
    signal output contributionDiversity; // Contribution type diversity (0-100)
    signal output architecturalDiversity; // Architectural pattern diversity (0-100)
    signal output collaborationDiversity; // Team collaboration diversity (0-100)
    signal output isValid;               // 1 if credential is valid, 0 otherwise

    // Intermediate signals
    signal diversityComponents[7];       // Individual diversity components
    signal languageWeights[maxLanguages]; // Weighted language scores
    signal technologyWeights[maxTechnologies]; // Weighted technology scores
    signal projectWeights[maxProjectTypes]; // Weighted project scores
    signal domainWeights[maxDomains];    // Weighted domain scores
    signal contributionWeights[maxContributionTypes]; // Weighted contribution scores
    signal archWeights[maxArchPatterns]; // Weighted architectural scores
    signal teamWeights[maxTeamSizes];    // Weighted team collaboration scores
    
    // Breadth and depth calculations
    signal breadthComponents[7];         // Breadth measures for each category
    signal depthComponents[7];           // Depth measures for each category
    signal diversityEntropy[7];          // Entropy measures for true diversity

    // Components for verification
    component userHashVerifier = MerkleTreeVerifier(8);
    component languageSetVerifier = SetMembershipVerifier(maxLanguages);
    component technologySetVerifier = SetMembershipVerifier(maxTechnologies);
    component rangeProofs[maxLanguages + maxTechnologies + maxProjectTypes + maxDomains + maxContributionTypes + maxArchPatterns + maxTeamSizes];

    // Initialize range proof components for all proficiency/experience levels
    var rangeProofIndex = 0;
    
    // Language proficiency range proofs (1-10)
    for (var i = 0; i < maxLanguages; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== languageProficiency[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Technology experience range proofs (1-10)
    for (var i = 0; i < maxTechnologies; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== technologyExperience[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Project type exposure range proofs (1-10)
    for (var i = 0; i < maxProjectTypes; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== projectTypeExposure[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Domain expertise range proofs (1-10)
    for (var i = 0; i < maxDomains; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== domainExpertise[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Contribution frequency range proofs (1-10)
    for (var i = 0; i < maxContributionTypes; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== contributionFrequency[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Architectural pattern usage range proofs (1-10)
    for (var i = 0; i < maxArchPatterns; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== archPatternUsage[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Team size experience range proofs (1-10)
    for (var i = 0; i < maxTeamSizes; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== teamSizeExperience[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }

    // Calculate weighted scores for each category
    var languageSum = 0;
    var languageCount = 0;
    var languageDepthSum = 0;
    for (var i = 0; i < maxLanguages; i++) {
        languageWeights[i] <== languageProficiency[i] * (languageHashes[i] != 0 ? 1 : 0);
        languageSum += languageWeights[i];
        if (languageHashes[i] != 0) {
            languageCount++;
            languageDepthSum += languageProficiency[i] * languageProficiency[i]; // Squared for depth
        }
    }

    var technologySum = 0;
    var technologyCount = 0;
    var technologyDepthSum = 0;
    for (var i = 0; i < maxTechnologies; i++) {
        technologyWeights[i] <== technologyExperience[i] * (technologyHashes[i] != 0 ? 1 : 0);
        technologySum += technologyWeights[i];
        if (technologyHashes[i] != 0) {
            technologyCount++;
            technologyDepthSum += technologyExperience[i] * technologyExperience[i];
        }
    }

    var projectSum = 0;
    var projectCount = 0;
    var projectDepthSum = 0;
    for (var i = 0; i < maxProjectTypes; i++) {
        projectWeights[i] <== projectTypeExposure[i] * (projectTypeHashes[i] != 0 ? 1 : 0);
        projectSum += projectWeights[i];
        if (projectTypeHashes[i] != 0) {
            projectCount++;
            projectDepthSum += projectTypeExposure[i] * projectTypeExposure[i];
        }
    }

    var domainSum = 0;
    var domainCount = 0;
    var domainDepthSum = 0;
    for (var i = 0; i < maxDomains; i++) {
        domainWeights[i] <== domainExpertise[i] * (domainHashes[i] != 0 ? 1 : 0);
        domainSum += domainWeights[i];
        if (domainHashes[i] != 0) {
            domainCount++;
            domainDepthSum += domainExpertise[i] * domainExpertise[i];
        }
    }

    var contributionSum = 0;
    var contributionCount = 0;
    var contributionDepthSum = 0;
    for (var i = 0; i < maxContributionTypes; i++) {
        contributionWeights[i] <== contributionFrequency[i] * (contributionTypeHashes[i] != 0 ? 1 : 0);
        contributionSum += contributionWeights[i];
        if (contributionTypeHashes[i] != 0) {
            contributionCount++;
            contributionDepthSum += contributionFrequency[i] * contributionFrequency[i];
        }
    }

    var archSum = 0;
    var archCount = 0;
    var archDepthSum = 0;
    for (var i = 0; i < maxArchPatterns; i++) {
        archWeights[i] <== archPatternUsage[i] * (archPatternHashes[i] != 0 ? 1 : 0);
        archSum += archWeights[i];
        if (archPatternHashes[i] != 0) {
            archCount++;
            archDepthSum += archPatternUsage[i] * archPatternUsage[i];
        }
    }

    var teamSum = 0;
    var teamCount = 0;
    var teamDepthSum = 0;
    for (var i = 0; i < maxTeamSizes; i++) {
        teamWeights[i] <== teamSizeExperience[i] * (teamSizes[i] > 0 ? 1 : 0);
        teamSum += teamWeights[i];
        if (teamSizes[i] > 0) {
            teamCount++;
            teamDepthSum += teamSizeExperience[i] * teamSizeExperience[i];
        }
    }

    // Calculate diversity components (0-100 scale)
    diversityComponents[0] <== (languageSum * 100) / (totalLanguages * 10);    // Language diversity
    diversityComponents[1] <== (technologySum * 100) / (totalTechnologies * 10); // Technology diversity
    diversityComponents[2] <== (projectSum * 100) / (totalProjectTypes * 10);  // Project diversity
    diversityComponents[3] <== (domainSum * 100) / (totalDomains * 10);        // Domain diversity
    diversityComponents[4] <== (contributionSum * 100) / (totalContributionTypes * 10); // Contribution diversity
    diversityComponents[5] <== (archSum * 100) / (totalArchPatterns * 10);     // Architectural diversity
    diversityComponents[6] <== (teamSum * 100) / (totalTeamSizes * 10);        // Collaboration diversity

    // Calculate breadth components (number of categories)
    breadthComponents[0] <== (totalLanguages * 100) / maxLanguages;
    breadthComponents[1] <== (totalTechnologies * 100) / maxTechnologies;
    breadthComponents[2] <== (totalProjectTypes * 100) / maxProjectTypes;
    breadthComponents[3] <== (totalDomains * 100) / maxDomains;
    breadthComponents[4] <== (totalContributionTypes * 100) / maxContributionTypes;
    breadthComponents[5] <== (totalArchPatterns * 100) / maxArchPatterns;
    breadthComponents[6] <== (totalTeamSizes * 100) / maxTeamSizes;

    // Calculate depth components (average proficiency in used categories)
    depthComponents[0] <== (totalLanguages > 0) ? (languageSum * 100) / (totalLanguages * 10) : 0;
    depthComponents[1] <== (totalTechnologies > 0) ? (technologySum * 100) / (totalTechnologies * 10) : 0;
    depthComponents[2] <== (totalProjectTypes > 0) ? (projectSum * 100) / (totalProjectTypes * 10) : 0;
    depthComponents[3] <== (totalDomains > 0) ? (domainSum * 100) / (totalDomains * 10) : 0;
    depthComponents[4] <== (totalContributionTypes > 0) ? (contributionSum * 100) / (totalContributionTypes * 10) : 0;
    depthComponents[5] <== (totalArchPatterns > 0) ? (archSum * 100) / (totalArchPatterns * 10) : 0;
    depthComponents[6] <== (totalTeamSizes > 0) ? (teamSum * 100) / (totalTeamSizes * 10) : 0;

    // Set individual diversity scores
    languageDiversity <== diversityComponents[0];
    technologyDiversity <== diversityComponents[1];
    projectDiversity <== diversityComponents[2];
    domainDiversity <== diversityComponents[3];
    contributionDiversity <== diversityComponents[4];
    architecturalDiversity <== diversityComponents[5];
    collaborationDiversity <== diversityComponents[6];

    // Calculate overall diversity index (weighted average)
    var diversitySum = 
        diversityComponents[0] * 25 +  // Languages: 25%
        diversityComponents[1] * 20 +  // Technologies: 20%
        diversityComponents[2] * 15 +  // Project types: 15%
        diversityComponents[3] * 15 +  // Domains: 15%
        diversityComponents[4] * 10 +  // Contributions: 10%
        diversityComponents[5] * 10 +  // Architecture: 10%
        diversityComponents[6] * 5;    // Collaboration: 5%

    diversityIndex <== diversitySum / 100;

    // Calculate overall breadth score
    var breadthSum = 
        breadthComponents[0] * 25 +    // Languages: 25%
        breadthComponents[1] * 20 +    // Technologies: 20%
        breadthComponents[2] * 15 +    // Project types: 15%
        breadthComponents[3] * 15 +    // Domains: 15%
        breadthComponents[4] * 10 +    // Contributions: 10%
        breadthComponents[5] * 10 +    // Architecture: 10%
        breadthComponents[6] * 5;      // Collaboration: 5%

    breadthScore <== breadthSum / 100;

    // Calculate overall depth score
    var depthSum = 
        depthComponents[0] * 25 +      // Languages: 25%
        depthComponents[1] * 20 +      // Technologies: 20%
        depthComponents[2] * 15 +      // Project types: 15%
        depthComponents[3] * 15 +      // Domains: 15%
        depthComponents[4] * 10 +      // Contributions: 10%
        depthComponents[5] * 10 +      // Architecture: 10%
        depthComponents[6] * 5;        // Collaboration: 5%

    depthScore <== depthSum / 100;

    // Validate credential (must meet minimum thresholds)
    var diversityValid = (diversityIndex >= diversityThreshold) ? 1 : 0;
    var breadthValid = (breadthScore >= breadthThreshold) ? 1 : 0;
    var depthValid = (depthScore >= depthThreshold) ? 1 : 0;
    var minimumCategoriesValid = (totalLanguages >= 2 && totalTechnologies >= 2) ? 1 : 0;

    isValid <== diversityValid * breadthValid * depthValid * minimumCategoriesValid;

    // Generate credential hash
    component credentialHasher = Poseidon(12);
    credentialHasher.inputs[0] <== userHash;
    credentialHasher.inputs[1] <== diversityIndex;
    credentialHasher.inputs[2] <== breadthScore;
    credentialHasher.inputs[3] <== depthScore;
    credentialHasher.inputs[4] <== languageDiversity;
    credentialHasher.inputs[5] <== technologyDiversity;
    credentialHasher.inputs[6] <== projectDiversity;
    credentialHasher.inputs[7] <== domainDiversity;
    credentialHasher.inputs[8] <== contributionDiversity;
    credentialHasher.inputs[9] <== architecturalDiversity;
    credentialHasher.inputs[10] <== collaborationDiversity;
    credentialHasher.inputs[11] <== isValid;

    credentialHash <== credentialHasher.out;

    // Constraint: Credential must be valid
    isValid === 1;

    // Constraint: Total counts must be reasonable
    component totalLanguagesRange = RangeProof(maxLanguages + 1);
    totalLanguagesRange.value <== totalLanguages;
    totalLanguagesRange.minValue <== 1;
    totalLanguagesRange.maxValue <== maxLanguages;

    component totalTechnologiesRange = RangeProof(maxTechnologies + 1);
    totalTechnologiesRange.value <== totalTechnologies;
    totalTechnologiesRange.minValue <== 1;
    totalTechnologiesRange.maxValue <== maxTechnologies;

    // Constraint: Thresholds must be reasonable
    component diversityThresholdRange = RangeProof(101);
    diversityThresholdRange.value <== diversityThreshold;
    diversityThresholdRange.minValue <== 0;
    diversityThresholdRange.maxValue <== 100;

    component breadthThresholdRange = RangeProof(101);
    breadthThresholdRange.value <== breadthThreshold;
    breadthThresholdRange.minValue <== 0;
    breadthThresholdRange.maxValue <== 100;

    component depthThresholdRange = RangeProof(101);
    depthThresholdRange.value <== depthThreshold;
    depthThresholdRange.minValue <== 0;
    depthThresholdRange.maxValue <== 100;
}