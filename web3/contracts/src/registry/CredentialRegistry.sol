// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CredentialRegistry
 * @dev Central registry for all verified developer credentials
 * Provides efficient storage, retrieval, and management of credentials
 */
contract CredentialRegistry is Ownable, Pausable, ReentrancyGuard {
    
    // Credential structure
    struct Credential {
        address owner;
        uint256 credentialType;
        bytes32 credentialHash;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        string ipfsHash;
        uint256 score;
    }

    // Registry storage
    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public userCredentials;
    mapping(uint256 => bytes32[]) public credentialsByType;
    mapping(address => mapping(uint256 => bytes32[])) public userCredentialsByType;
    
    // Statistics
    mapping(address => uint256) public userCredentialCount;
    mapping(uint256 => uint256) public credentialTypeCount;
    uint256 public totalCredentials;
    
    // Authorized verifiers
    mapping(address => bool) public authorizedVerifiers;
    
    // Events
    event CredentialRegistered(
        bytes32 indexed credentialHash,
        address indexed owner,
        uint256 indexed credentialType,
        uint256 timestamp
    );
    
    event CredentialRevoked(
        bytes32 indexed credentialHash,
        address indexed owner,
        uint256 timestamp
    );
    
    event CredentialUpdated(
        bytes32 indexed credentialHash,
        string ipfsHash
    );
    
    event VerifierAuthorized(address indexed verifier, bool authorized);

    // Errors
    error UnauthorizedVerifier();
    error CredentialNotFound();
    error CredentialExpired();
    error CredentialAlreadyRevoked();
    error InvalidCredentialData();

    // Modifiers
    modifier onlyAuthorizedVerifier() {
        if (!authorizedVerifiers[msg.sender]) revert UnauthorizedVerifier();
        _;
    }

    constructor() {
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Register a new credential
     * @param credentialHash Unique credential identifier
     * @param owner Credential owner
     * @param credentialType Type of credential
     * @param expiresAt Expiration timestamp
     * @param ipfsHash IPFS hash for additional data
     * @param score Credential score
     */
    function registerCredential(
        bytes32 credentialHash,
        address owner,
        uint256 credentialType,
        uint256 expiresAt,
        string calldata ipfsHash,
        uint256 score
    ) external onlyAuthorizedVerifier whenNotPaused nonReentrant {
        
        // Validate inputs
        if (owner == address(0) || expiresAt <= block.timestamp) {
            revert InvalidCredentialData();
        }
        
        // Check if credential already exists
        if (credentials[credentialHash].owner != address(0)) {
            revert InvalidCredentialData();
        }

        // Create credential
        Credential storage credential = credentials[credentialHash];
        credential.owner = owner;
        credential.credentialType = credentialType;
        credential.credentialHash = credentialHash;
        credential.issuedAt = block.timestamp;
        credential.expiresAt = expiresAt;
        credential.isRevoked = false;
        credential.ipfsHash = ipfsHash;
        credential.score = score;

        // Update indexes
        userCredentials[owner].push(credentialHash);
        credentialsByType[credentialType].push(credentialHash);
        userCredentialsByType[owner][credentialType].push(credentialHash);

        // Update statistics
        userCredentialCount[owner]++;
        credentialTypeCount[credentialType]++;
        totalCredentials++;

        emit CredentialRegistered(credentialHash, owner, credentialType, block.timestamp);
    }

    /**
     * @dev Revoke a credential
     * @param credentialHash Credential to revoke
     */
    function revokeCredential(bytes32 credentialHash) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        Credential storage credential = credentials[credentialHash];
        
        if (credential.owner == address(0)) {
            revert CredentialNotFound();
        }
        
        // Only owner or authorized verifier can revoke
        if (msg.sender != credential.owner && !authorizedVerifiers[msg.sender]) {
            revert UnauthorizedVerifier();
        }
        
        if (credential.isRevoked) {
            revert CredentialAlreadyRevoked();
        }

        credential.isRevoked = true;

        emit CredentialRevoked(credentialHash, credential.owner, block.timestamp);
    }

    /**
     * @dev Update credential IPFS hash
     * @param credentialHash Credential to update
     * @param ipfsHash New IPFS hash
     */
    function updateCredentialIPFS(bytes32 credentialHash, string calldata ipfsHash) 
        external 
        whenNotPaused 
    {
        Credential storage credential = credentials[credentialHash];
        
        if (credential.owner == address(0)) {
            revert CredentialNotFound();
        }
        
        // Only owner can update IPFS hash
        require(msg.sender == credential.owner, "Only owner can update");

        credential.ipfsHash = ipfsHash;

        emit CredentialUpdated(credentialHash, ipfsHash);
    }

    /**
     * @dev Get credential details
     * @param credentialHash Credential identifier
     * @return Credential data
     */
    function getCredential(bytes32 credentialHash) 
        external 
        view 
        returns (Credential memory) 
    {
        Credential memory credential = credentials[credentialHash];
        if (credential.owner == address(0)) {
            revert CredentialNotFound();
        }
        return credential;
    }

    /**
     * @dev Check if credential is valid (not revoked and not expired)
     * @param credentialHash Credential to check
     * @return True if valid
     */
    function isCredentialValid(bytes32 credentialHash) external view returns (bool) {
        Credential memory credential = credentials[credentialHash];
        
        return credential.owner != address(0) && 
               !credential.isRevoked && 
               block.timestamp <= credential.expiresAt;
    }

    /**
     * @dev Get user's credentials
     * @param user User address
     * @return Array of credential hashes
     */
    function getUserCredentials(address user) external view returns (bytes32[] memory) {
        return userCredentials[user];
    }

    /**
     * @dev Get user's credentials by type
     * @param user User address
     * @param credentialType Type of credentials
     * @return Array of credential hashes
     */
    function getUserCredentialsByType(address user, uint256 credentialType) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return userCredentialsByType[user][credentialType];
    }

    /**
     * @dev Get credentials by type
     * @param credentialType Type of credentials
     * @return Array of credential hashes
     */
    function getCredentialsByType(uint256 credentialType) 
        external 
        view 
        returns (bytes32[] memory) 
    {
        return credentialsByType[credentialType];
    }

    /**
     * @dev Get user statistics
     * @param user User address
     * @return Total credentials, valid credentials, average score
     */
    function getUserStats(address user) 
        external 
        view 
        returns (uint256 total, uint256 valid, uint256 averageScore) 
    {
        bytes32[] memory userCreds = userCredentials[user];
        total = userCreds.length;
        
        uint256 validCount = 0;
        uint256 totalScore = 0;
        
        for (uint256 i = 0; i < userCreds.length; i++) {
            Credential memory cred = credentials[userCreds[i]];
            if (!cred.isRevoked && block.timestamp <= cred.expiresAt) {
                validCount++;
                totalScore += cred.score;
            }
        }
        
        valid = validCount;
        averageScore = validCount > 0 ? totalScore / validCount : 0;
    }

    /**
     * @dev Authorize/deauthorize verifier
     * @param verifier Verifier address
     * @param authorized True to authorize, false to deauthorize
     */
    function setVerifierAuthorization(address verifier, bool authorized) 
        external 
        onlyOwner 
    {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 