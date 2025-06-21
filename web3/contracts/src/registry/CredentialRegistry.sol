// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CredentialRegistry {
    
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

    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public userCredentials;
    mapping(uint256 => bytes32[]) public credentialsByType;
    mapping(address => mapping(uint256 => bytes32[])) public userCredentialsByType;
    
    mapping(address => uint256) public userCredentialCount;
    mapping(uint256 => uint256) public credentialTypeCount;
    uint256 public totalCredentials;
    
    mapping(address => bool) public authorizedVerifiers;
    address public owner;
    bool public paused = false;
    
    event CredentialRegistered(bytes32 indexed credentialHash, address indexed owner, uint256 indexed credentialType, uint256 timestamp);
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed owner, uint256 timestamp);
    event CredentialUpdated(bytes32 indexed credentialHash, string ipfsHash);
    event VerifierAuthorized(address indexed verifier, bool authorized);

    error UnauthorizedVerifier();
    error CredentialNotFound();
    error CredentialExpired();
    error CredentialAlreadyRevoked();
    error InvalidCredentialData();
    error ContractPaused();
    error UnauthorizedAccess();

    modifier onlyAuthorizedVerifier() {
        if (!authorizedVerifiers[msg.sender]) revert UnauthorizedVerifier();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedAccess();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerCredential(
        bytes32 credentialHash,
        address credentialOwner,
        uint256 credentialType,
        uint256 expiresAt,
        string calldata ipfsHash,
        uint256 score
    ) external onlyAuthorizedVerifier whenNotPaused {
        
        if (credentialOwner == address(0) || expiresAt <= block.timestamp) {
            revert InvalidCredentialData();
        }
        
        if (credentials[credentialHash].owner != address(0)) {
            revert InvalidCredentialData();
        }

        Credential storage credential = credentials[credentialHash];
        credential.owner = credentialOwner;
        credential.credentialType = credentialType;
        credential.credentialHash = credentialHash;
        credential.issuedAt = block.timestamp;
        credential.expiresAt = expiresAt;
        credential.isRevoked = false;
        credential.ipfsHash = ipfsHash;
        credential.score = score;

        userCredentials[credentialOwner].push(credentialHash);
        credentialsByType[credentialType].push(credentialHash);
        userCredentialsByType[credentialOwner][credentialType].push(credentialHash);

        userCredentialCount[credentialOwner]++;
        credentialTypeCount[credentialType]++;
        totalCredentials++;

        emit CredentialRegistered(credentialHash, credentialOwner, credentialType, block.timestamp);
    }

    function revokeCredential(bytes32 credentialHash) external whenNotPaused {
        Credential storage credential = credentials[credentialHash];
        
        if (credential.owner == address(0)) {
            revert CredentialNotFound();
        }
        
        if (msg.sender != credential.owner && !authorizedVerifiers[msg.sender]) {
            revert UnauthorizedVerifier();
        }
        
        if (credential.isRevoked) {
            revert CredentialAlreadyRevoked();
        }

        credential.isRevoked = true;

        emit CredentialRevoked(credentialHash, credential.owner, block.timestamp);
    }

    function updateCredentialIPFS(bytes32 credentialHash, string calldata ipfsHash) external whenNotPaused {
        Credential storage credential = credentials[credentialHash];
        
        if (credential.owner == address(0)) {
            revert CredentialNotFound();
        }
        
        require(msg.sender == credential.owner, "Only owner can update");

        credential.ipfsHash = ipfsHash;

        emit CredentialUpdated(credentialHash, ipfsHash);
    }

    function getCredential(bytes32 credentialHash) external view returns (Credential memory) {
        Credential memory credential = credentials[credentialHash];
        if (credential.owner == address(0)) {
            revert CredentialNotFound();
        }
        return credential;
    }

    function authorizeVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function getUserCredentials(address user) external view returns (bytes32[] memory) {
        return userCredentials[user];
    }

    function getCredentialsByType(uint256 credentialType) external view returns (bytes32[] memory) {
        return credentialsByType[credentialType];
    }

    function isCredentialValid(bytes32 credentialHash) external view returns (bool) {
        Credential memory credential = credentials[credentialHash];
        return credential.owner != address(0) && 
               !credential.isRevoked && 
               block.timestamp <= credential.expiresAt;
    }
}
