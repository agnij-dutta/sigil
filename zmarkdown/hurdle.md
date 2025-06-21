# Bugs & Hurdles Encountered During Sigil Development

Building Sigil—an end-to-end, privacy-preserving, verifiable credential platform—presented several unique technical and product challenges. Here are some of the most significant hurdles we faced, and how we overcame them:

---

## 1. **Private Repository Access & Proof Generation**

**Problem:**  
GitHub’s API restricts access to private repositories, and we needed to generate proofs of contribution without exposing any code or sensitive metadata.

**Solution:**  
- Required users to authenticate via GitHub OAuth and verify they are collaborators on the target repositories.
- Designed the ZK circuits to only use commit metadata (hash, author, timestamp, LOC) and never the code itself.
- Implemented strict permission checks and never stored or transmitted raw code.

---

## 2. **Zero-Knowledge Circuit Complexity**

**Problem:**  
Designing Circom circuits that could efficiently prove authorship and metadata range checks (e.g., LOC between 100-1000) without leaking sensitive information was non-trivial.

**Solution:**  
- Started with minimal, auditable circuits for basic authorship and LOC range proofs.
- Iteratively tested and benchmarked circuits for performance and privacy.
- Used public test vectors and collaborated with ZK experts to validate circuit soundness.

---

## 3. **Wallet & GitHub Account Linking**

**Problem:**  
Ensuring a seamless, secure link between a user’s GitHub account and their Ethereum wallet (for SIWE) was challenging, especially for users new to Web3.

**Solution:**  
- Implemented a clear, step-by-step onboarding flow: GitHub OAuth → Wallet Connect → Sign-In With Ethereum (SIWE).
- Provided user education and fallback options for common wallet connection issues.
- Used session tokens and secure backend validation to prevent account hijacking.

---

## 4. **Proof Storage & Retrieval (IPFS Integration)**

**Problem:**  
Storing and retrieving proofs in a decentralized, tamper-proof way (using IPFS) introduced issues with pinning, retrieval speed, and browser compatibility.

**Solution:**  
- Used reliable IPFS pinning services to ensure proofs remained available.
- Added fallback mechanisms for proof retrieval (e.g., multiple gateways).
- Optimized proof data size for faster uploads and downloads.

---

## 5. **Recruiter-Facing Certificate UX**

**Problem:**  
Recruiters are often unfamiliar with cryptography and ZK proofs, so presenting proofs in a human-readable, actionable way was a UX challenge.

**Solution:**  
- Designed certificate viewers that summarize key information (skills, stack, contribution highlights) in plain language.
- Included clear “Proof Verified” indicators and simple explanations of what was cryptographically proven.
- Provided a one-click proof verifier UI for technical users.

---

## 6. **Cross-Platform & Privacy Compliance**

**Problem:**  
Ensuring that Sigil’s approach complied with privacy best practices and worked across different browsers, wallets, and devices.

**Solution:**  
- Audited all data flows to ensure no sensitive information was ever exposed or stored.
- Used only open, standards-based authentication and storage protocols.
- Tested extensively across browsers and wallet providers.

---

## 7. **User Education & Onboarding**

**Problem:**  
Many users were unfamiliar with ZK proofs, wallet connections, or the value of verifiable credentials.

**Solution:**  
- Added onboarding tooltips, FAQs, and in-app guides.
- Provided demo profiles and sample certificates to illustrate the value proposition.
- Collected user feedback and iterated on onboarding flows.

---

## Summary

While building Sigil, we encountered a range of technical, UX, and privacy challenges. By focusing on minimal, auditable ZK circuits, robust authentication flows, and user-friendly design, we were able to overcome these hurdles and deliver a secure, privacy-preserving credential platform for developers and recruiters.