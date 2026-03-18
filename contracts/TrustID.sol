// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustID {
    struct Credential {
        bytes32 credentialHash;
        address subject;
        address issuer;
        string credentialType;
        uint256 issuedAt;
        bool revoked;
    }

    mapping(address => bool) public registered;
    mapping(address => string) public didNames;

    mapping(bytes32 => Credential) public credentials;
    mapping(address => bytes32[]) public subjectCredentials;
    mapping(address => bytes32[]) public issuerCredentials;

    event DIDRegistered(address indexed owner, string did, string name);
    event CredentialIssued(bytes32 indexed hash, address indexed subject, address indexed issuer, string credentialType);
    event CredentialRevoked(bytes32 indexed hash, address indexed issuer);

    modifier onlyRegistered() {
        require(registered[msg.sender], "Not registered");
        _;
    }

    function registerDID(string calldata name) external {
        require(!registered[msg.sender], "Already registered");
        registered[msg.sender] = true;
        didNames[msg.sender] = name;
        emit DIDRegistered(msg.sender, string(abi.encodePacked("did:ethr:", toHexString(msg.sender))), name);
    }

    function isRegistered(address user) external view returns (bool) {
        return registered[user];
    }

    function getDIDName(address user) external view returns (string memory) {
        return didNames[user];
    }

    function issueCredential(
        address subject,
        string calldata credentialType,
        bytes32 credentialHash
    ) external onlyRegistered {
        require(credentials[credentialHash].issuedAt == 0, "Credential already exists");
        require(subject != address(0), "Invalid subject");

        credentials[credentialHash] = Credential({
            credentialHash: credentialHash,
            subject: subject,
            issuer: msg.sender,
            credentialType: credentialType,
            issuedAt: block.timestamp,
            revoked: false
        });

        subjectCredentials[subject].push(credentialHash);
        issuerCredentials[msg.sender].push(credentialHash);

        emit CredentialIssued(credentialHash, subject, msg.sender, credentialType);
    }

    function verifyCredential(bytes32 credentialHash) external view returns (
        bool valid,
        address subject,
        address issuer,
        string memory credentialType,
        uint256 issuedAt,
        bool revoked
    ) {
        Credential storage cred = credentials[credentialHash];
        if (cred.issuedAt == 0) {
            return (false, address(0), address(0), "", 0, false);
        }
        return (
            !cred.revoked,
            cred.subject,
            cred.issuer,
            cred.credentialType,
            cred.issuedAt,
            cred.revoked
        );
    }

    function revokeCredential(bytes32 credentialHash) external {
        Credential storage cred = credentials[credentialHash];
        require(cred.issuedAt > 0, "Credential does not exist");
        require(cred.issuer == msg.sender, "Only issuer can revoke");
        require(!cred.revoked, "Already revoked");
        cred.revoked = true;
        emit CredentialRevoked(credentialHash, msg.sender);
    }

    function getSubjectCredentials(address subject) external view returns (bytes32[] memory) {
        return subjectCredentials[subject];
    }

    function getIssuerCredentials(address issuer) external view returns (bytes32[] memory) {
        return issuerCredentials[issuer];
    }

    function getCredential(bytes32 credentialHash) external view returns (Credential memory) {
        return credentials[credentialHash];
    }

    // Helper to convert address to hex string
    function toHexString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory data = abi.encodePacked(addr);
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
