pragma circom 2.0.0;

include "../core/primitives/merkle_tree.circom";
include "../core/primitives/range_proof.circom";
include "../core/primitives/set_membership.circom";

/*
    LeadershipCredential: Proves technical leadership and influence capabilities
    
    This circuit proves:
    1. Technical mentoring and knowledge sharing
    2. Architectural decision making and influence
    3. Code review leadership and quality guidance
    4. Project ownership and delivery responsibility
    5. Team coordination and cross-functional collaboration
    6. Innovation and technical vision contribution
    7. Community contribution and open source leadership
*/

template LeadershipCredential(
    maxMentoringActivities,    // Maximum mentoring activities tracked
    maxArchDecisions,          // Maximum architectural decisions tracked
    maxCodeReviews,            // Maximum code reviews conducted
    maxProjectsLed,            // Maximum projects led
    maxTeamInteractions,       // Maximum team interactions tracked
    maxInnovations,            // Maximum innovations/patents tracked
    maxCommunityContributions  // Maximum community contributions tracked
) {
    // Input signals
    signal input userHash;                              // Hash of user identity
    signal input mentoringHashes[maxMentoringActivities]; // Hashes of mentoring activities
    signal input mentoringImpact[maxMentoringActivities]; // Impact scores (1-10)
    signal input archDecisionHashes[maxArchDecisions];  // Hashes of architectural decisions
    signal input archDecisionImpact[maxArchDecisions];  // Decision impact scores (1-10)
    signal input codeReviewHashes[maxCodeReviews];      // Hashes of code reviews
    signal input codeReviewQuality[maxCodeReviews];     // Review quality scores (1-10)
    signal input projectHashes[maxProjectsLed];         // Hashes of projects led
    signal input projectSuccess[maxProjectsLed];        // Project success metrics (1-10)
    signal input teamInteractionHashes[maxTeamInteractions]; // Team interaction hashes
    signal input teamInfluence[maxTeamInteractions];    // Team influence scores (1-10)
    signal input innovationHashes[maxInnovations];      // Innovation/patent hashes
    signal input innovationSignificance[maxInnovations]; // Innovation significance (1-10)
    signal input communityHashes[maxCommunityContributions]; // Community contribution hashes
    signal input communityImpact[maxCommunityContributions]; // Community impact (1-10)
    
    // Leadership metrics
    signal input totalMentoringActivities;     // Actual number of mentoring activities
    signal input totalArchDecisions;           // Actual number of architectural decisions
    signal input totalCodeReviews;             // Actual number of code reviews
    signal input totalProjectsLed;             // Actual number of projects led
    signal input totalTeamInteractions;        // Actual number of team interactions
    signal input totalInnovations;             // Actual number of innovations
    signal input totalCommunityContributions;  // Actual number of community contributions
    
    // Leadership experience metrics
    signal input yearsOfLeadership;            // Years of leadership experience
    signal input teamSizesLed[maxProjectsLed]; // Sizes of teams led
    signal input crossFunctionalExperience;    // Cross-functional collaboration score (1-10)
    signal input stakeholderManagement;        // Stakeholder management score (1-10)
    signal input technicalVisionContribution;  // Technical vision contribution (1-10)
    signal input conflictResolutionSkills;     // Conflict resolution skills (1-10)
    
    // Thresholds
    signal input leadershipThreshold;          // Minimum leadership score required
    signal input impactThreshold;              // Minimum impact score required
    signal input experienceThreshold;          // Minimum experience threshold

    // Output signals
    signal output credentialHash;              // Hash of the credential
    signal output leadershipIndex;             // Overall leadership score (0-100)
    signal output mentoringScore;              // Mentoring capability score (0-100)
    signal output architecturalLeadership;     // Architectural leadership score (0-100)
    signal output codeReviewLeadership;        // Code review leadership score (0-100)
    signal output projectLeadership;           // Project leadership score (0-100)
    signal output teamLeadership;              // Team leadership score (0-100)
    signal output innovationLeadership;        // Innovation leadership score (0-100)
    signal output communityLeadership;         // Community leadership score (0-100)
    signal output overallImpact;               // Overall impact score (0-100)
    signal output leadershipMaturity;          // Leadership maturity level (1-5)
    signal output isValid;                     // 1 if credential is valid, 0 otherwise

    // Intermediate signals
    signal leadershipComponents[7];            // Individual leadership components
    signal impactComponents[7];                // Impact components for each area
    signal weightedMentoring[maxMentoringActivities]; // Weighted mentoring scores
    signal weightedArchDecisions[maxArchDecisions]; // Weighted architectural scores
    signal weightedCodeReviews[maxCodeReviews]; // Weighted code review scores
    signal weightedProjects[maxProjectsLed];   // Weighted project scores
    signal weightedTeamWork[maxTeamInteractions]; // Weighted team interaction scores
    signal weightedInnovations[maxInnovations]; // Weighted innovation scores
    signal weightedCommunity[maxCommunityContributions]; // Weighted community scores
    
    // Experience and maturity calculations
    signal experienceMultipliers[7];           // Experience multipliers for each area
    signal maturityIndicators[5];              // Maturity indicators across different aspects

    // Components for verification
    component userHashVerifier = MerkleTreeVerifier(8);
    component rangeProofs[maxMentoringActivities + maxArchDecisions + maxCodeReviews + maxProjectsLed + maxTeamInteractions + maxInnovations + maxCommunityContributions + 4];

    // Initialize range proof components for all impact/quality scores
    var rangeProofIndex = 0;
    
    // Mentoring impact range proofs (1-10)
    for (var i = 0; i < maxMentoringActivities; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== mentoringImpact[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Architectural decision impact range proofs (1-10)
    for (var i = 0; i < maxArchDecisions; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== archDecisionImpact[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Code review quality range proofs (1-10)
    for (var i = 0; i < maxCodeReviews; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== codeReviewQuality[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Project success range proofs (1-10)
    for (var i = 0; i < maxProjectsLed; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== projectSuccess[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Team influence range proofs (1-10)
    for (var i = 0; i < maxTeamInteractions; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== teamInfluence[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Innovation significance range proofs (1-10)
    for (var i = 0; i < maxInnovations; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== innovationSignificance[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Community impact range proofs (1-10)
    for (var i = 0; i < maxCommunityContributions; i++) {
        rangeProofs[rangeProofIndex] = RangeProof(11);
        rangeProofs[rangeProofIndex].value <== communityImpact[i];
        rangeProofs[rangeProofIndex].minValue <== 0;
        rangeProofs[rangeProofIndex].maxValue <== 10;
        rangeProofIndex++;
    }
    
    // Additional leadership skill range proofs (1-10)
    rangeProofs[rangeProofIndex] = RangeProof(11);
    rangeProofs[rangeProofIndex].value <== crossFunctionalExperience;
    rangeProofs[rangeProofIndex].minValue <== 0;
    rangeProofs[rangeProofIndex].maxValue <== 10;
    rangeProofIndex++;
    
    rangeProofs[rangeProofIndex] = RangeProof(11);
    rangeProofs[rangeProofIndex].value <== stakeholderManagement;
    rangeProofs[rangeProofIndex].minValue <== 0;
    rangeProofs[rangeProofIndex].maxValue <== 10;
    rangeProofIndex++;
    
    rangeProofs[rangeProofIndex] = RangeProof(11);
    rangeProofs[rangeProofIndex].value <== technicalVisionContribution;
    rangeProofs[rangeProofIndex].minValue <== 0;
    rangeProofs[rangeProofIndex].maxValue <== 10;
    rangeProofIndex++;
    
    rangeProofs[rangeProofIndex] = RangeProof(11);
    rangeProofs[rangeProofIndex].value <== conflictResolutionSkills;
    rangeProofs[rangeProofIndex].minValue <== 0;
    rangeProofs[rangeProofIndex].maxValue <== 10;

    // Calculate experience multipliers based on years of leadership (using integers)
    var experienceBonus = 100; // Base 100%
    if (yearsOfLeadership >= 5) {
        experienceBonus += 30; // 30% bonus for 5+ years
    }
    if (yearsOfLeadership >= 10) {
        experienceBonus += 20; // Additional 20% bonus for 10+ years
    }
    if (yearsOfLeadership >= 15) {
        experienceBonus += 10; // Additional 10% bonus for 15+ years
    }

    // Calculate weighted scores for each leadership area
    var mentoringSum = 0;
    for (var i = 0; i < maxMentoringActivities; i++) {
        weightedMentoring[i] <== mentoringImpact[i] * (mentoringHashes[i] != 0 ? 1 : 0);
        mentoringSum += weightedMentoring[i];
    }

    var archDecisionSum = 0;
    for (var i = 0; i < maxArchDecisions; i++) {
        weightedArchDecisions[i] <== archDecisionImpact[i] * (archDecisionHashes[i] != 0 ? 1 : 0);
        archDecisionSum += weightedArchDecisions[i];
    }

    var codeReviewSum = 0;
    for (var i = 0; i < maxCodeReviews; i++) {
        weightedCodeReviews[i] <== codeReviewQuality[i] * (codeReviewHashes[i] != 0 ? 1 : 0);
        codeReviewSum += weightedCodeReviews[i];
    }

    var projectSum = 0;
    var totalTeamSize = 0;
    for (var i = 0; i < maxProjectsLed; i++) {
        weightedProjects[i] <== projectSuccess[i] * (projectHashes[i] != 0 ? 1 : 0);
        projectSum += weightedProjects[i];
        totalTeamSize += teamSizesLed[i];
    }

    var teamInteractionSum = 0;
    for (var i = 0; i < maxTeamInteractions; i++) {
        weightedTeamWork[i] <== teamInfluence[i] * (teamInteractionHashes[i] != 0 ? 1 : 0);
        teamInteractionSum += weightedTeamWork[i];
    }

    var innovationSum = 0;
    for (var i = 0; i < maxInnovations; i++) {
        weightedInnovations[i] <== innovationSignificance[i] * (innovationHashes[i] != 0 ? 1 : 0);
        innovationSum += weightedInnovations[i];
    }

    var communitySum = 0;
    for (var i = 0; i < maxCommunityContributions; i++) {
        weightedCommunity[i] <== communityImpact[i] * (communityHashes[i] != 0 ? 1 : 0);
        communitySum += weightedCommunity[i];
    }

    // Calculate leadership components (0-100 scale) with experience multipliers
    leadershipComponents[0] <== (totalMentoringActivities > 0) ? 
        ((mentoringSum * experienceBonus) / (totalMentoringActivities * 10)) : 0;
    leadershipComponents[1] <== (totalArchDecisions > 0) ? 
        ((archDecisionSum * experienceBonus) / (totalArchDecisions * 10)) : 0;
    leadershipComponents[2] <== (totalCodeReviews > 0) ? 
        ((codeReviewSum * experienceBonus) / (totalCodeReviews * 10)) : 0;
    leadershipComponents[3] <== (totalProjectsLed > 0) ? 
        ((projectSum * experienceBonus) / (totalProjectsLed * 10)) : 0;
    leadershipComponents[4] <== (totalTeamInteractions > 0) ? 
        ((teamInteractionSum * experienceBonus) / (totalTeamInteractions * 10)) : 0;
    leadershipComponents[5] <== (totalInnovations > 0) ? 
        ((innovationSum * experienceBonus) / (totalInnovations * 10)) : 0;
    leadershipComponents[6] <== (totalCommunityContributions > 0) ? 
        ((communitySum * experienceBonus) / (totalCommunityContributions * 10)) : 0;

    // Set individual leadership scores
    mentoringScore <== leadershipComponents[0];
    architecturalLeadership <== leadershipComponents[1];
    codeReviewLeadership <== leadershipComponents[2];
    projectLeadership <== leadershipComponents[3];
    teamLeadership <== leadershipComponents[4];
    innovationLeadership <== leadershipComponents[5];
    communityLeadership <== leadershipComponents[6];

    // Calculate impact components
    impactComponents[0] <== (totalMentoringActivities * mentoringScore) / 100;
    impactComponents[1] <== (totalArchDecisions * architecturalLeadership) / 100;
    impactComponents[2] <== (totalCodeReviews * codeReviewLeadership) / 100;
    impactComponents[3] <== (totalProjectsLed * projectLeadership) / 100;
    impactComponents[4] <== (totalTeamInteractions * teamLeadership) / 100;
    impactComponents[5] <== (totalInnovations * innovationLeadership) / 100;
    impactComponents[6] <== (totalCommunityContributions * communityLeadership) / 100;

    // Calculate overall leadership index (weighted average)
    var leadershipSum = 
        leadershipComponents[0] * 20 +  // Mentoring: 20%
        leadershipComponents[1] * 20 +  // Architecture: 20%
        leadershipComponents[2] * 15 +  // Code Review: 15%
        leadershipComponents[3] * 25 +  // Project Leadership: 25%
        leadershipComponents[4] * 10 +  // Team Leadership: 10%
        leadershipComponents[5] * 5 +   // Innovation: 5%
        leadershipComponents[6] * 5;    // Community: 5%

    leadershipIndex <== leadershipSum / 100;

    // Calculate overall impact score
    var impactSum = 
        impactComponents[0] * 20 +       // Mentoring impact: 20%
        impactComponents[1] * 20 +       // Architecture impact: 20%
        impactComponents[2] * 15 +       // Code review impact: 15%
        impactComponents[3] * 25 +       // Project impact: 25%
        impactComponents[4] * 10 +       // Team impact: 10%
        impactComponents[5] * 5 +        // Innovation impact: 5%
        impactComponents[6] * 5;         // Community impact: 5%

    overallImpact <== impactSum / 100;

    // Calculate leadership maturity level (1-5)
    var maturityScore = 0;
    
    // Maturity indicators
    maturityIndicators[0] <== (yearsOfLeadership >= 3) ? 1 : 0;  // Basic experience
    maturityIndicators[1] <== (totalProjectsLed >= 2) ? 1 : 0;  // Project leadership
    maturityIndicators[2] <== (totalMentoringActivities >= 5) ? 1 : 0; // Mentoring others
    maturityIndicators[3] <== (crossFunctionalExperience >= 7) ? 1 : 0; // Cross-functional skills
    maturityIndicators[4] <== (technicalVisionContribution >= 8) ? 1 : 0; // Technical vision

    for (var i = 0; i < 5; i++) {
        maturityScore += maturityIndicators[i];
    }
    leadershipMaturity <== maturityScore + 1; // 1-5 scale

    // Validate credential (must meet minimum thresholds)
    var leadershipValid = (leadershipIndex >= leadershipThreshold) ? 1 : 0;
    var impactValid = (overallImpact >= impactThreshold) ? 1 : 0;
    var experienceValid = (yearsOfLeadership >= experienceThreshold) ? 1 : 0;
    var minimumActivitiesValid = (totalProjectsLed >= 1 && totalMentoringActivities >= 1) ? 1 : 0;

    isValid <== leadershipValid * impactValid * experienceValid * minimumActivitiesValid;

    // Generate credential hash
    component credentialHasher = Poseidon(12);
    credentialHasher.inputs[0] <== userHash;
    credentialHasher.inputs[1] <== leadershipIndex;
    credentialHasher.inputs[2] <== overallImpact;
    credentialHasher.inputs[3] <== leadershipMaturity;
    credentialHasher.inputs[4] <== mentoringScore;
    credentialHasher.inputs[5] <== architecturalLeadership;
    credentialHasher.inputs[6] <== projectLeadership;
    credentialHasher.inputs[7] <== teamLeadership;
    credentialHasher.inputs[8] <== yearsOfLeadership;
    credentialHasher.inputs[9] <== crossFunctionalExperience;
    credentialHasher.inputs[10] <== technicalVisionContribution;
    credentialHasher.inputs[11] <== isValid;

    credentialHash <== credentialHasher.out;

    // Constraint: Credential must be valid
    isValid === 1;

    // Constraint: Years of leadership must be reasonable
    component yearsRange = RangeProof(31);
    yearsRange.value <== yearsOfLeadership;
    yearsRange.minValue <== 0;
    yearsRange.maxValue <== 30;

    // Constraint: Total counts must be reasonable
    component totalProjectsRange = RangeProof(maxProjectsLed + 1);
    totalProjectsRange.value <== totalProjectsLed;
    totalProjectsRange.minValue <== 1;
    totalProjectsRange.maxValue <== maxProjectsLed;

    component totalMentoringRange = RangeProof(maxMentoringActivities + 1);
    totalMentoringRange.value <== totalMentoringActivities;
    totalMentoringRange.minValue <== 1;
    totalMentoringRange.maxValue <== maxMentoringActivities;

    // Constraint: Thresholds must be reasonable
    component leadershipThresholdRange = RangeProof(101);
    leadershipThresholdRange.value <== leadershipThreshold;
    leadershipThresholdRange.minValue <== 0;
    leadershipThresholdRange.maxValue <== 100;

    component impactThresholdRange = RangeProof(101);
    impactThresholdRange.value <== impactThreshold;
    impactThresholdRange.minValue <== 0;
    impactThresholdRange.maxValue <== 100;

    component experienceThresholdRange = RangeProof(31);
    experienceThresholdRange.value <== experienceThreshold;
    experienceThresholdRange.minValue <== 0;
    experienceThresholdRange.maxValue <== 30;
} component main = LeadershipCredential(10, 5, 5, 5, 5, 5, 5);
