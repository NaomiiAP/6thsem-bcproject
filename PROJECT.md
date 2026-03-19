# TrustID — Decentralized Identity System

A full-stack blockchain identity platform built with Next.js and Solidity on Ethereum Sepolia testnet. Users create self-sovereign digital identities (DIDs), upload documents to IPFS, and issue/verify credentials on-chain.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Framer Motion, Lucide Icons |
| Blockchain | Solidity 0.8.20, Ethers.js v6, Sepolia Testnet |
| Storage | Pinata (IPFS) |
| QR | react-qr-code, html5-qrcode (camera scanner) |

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Browser /   │────▶│  Next.js App │────▶│  Sepolia Chain  │
│  MetaMask    │◀────│  (Frontend)  │◀────│  TrustID.sol    │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Pinata IPFS │
                    │  (Documents) │
                    └──────────────┘
```

---

## Smart Contract — TrustID.sol

**Address:** `0x348a8F43B3222162d45298a80FfF894E14c73bbF` (Sepolia)

### Data Structures

- `Credential` struct — credentialHash, subject, issuer, credentialType, issuedAt, revoked
- `mapping(address => bool) registered` — tracks registered DIDs
- `mapping(address => string) didNames` — display names
- `mapping(bytes32 => Credential) credentials` — all credentials by hash
- `mapping(address => bytes32[]) subjectCredentials` — credentials held by a user
- `mapping(address => bytes32[]) issuerCredentials` — credentials issued by a user

### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `registerDID(name)` | Public | Creates a DID for the caller |
| `issueCredential(subject, type, hash)` | Registered only | Issues a credential to a subject |
| `revokeCredential(hash)` | Original issuer | Revokes a previously issued credential |
| `verifyCredential(hash)` | Public (read-only) | Returns credential validity and details |
| `getSubjectCredentials(addr)` | Public (read-only) | Returns all credentials held by an address |
| `getIssuerCredentials(addr)` | Public (read-only) | Returns all credentials issued by an address |
| `isRegistered(addr)` | Public (read-only) | Checks if address has a registered DID |
| `getDIDName(addr)` | Public (read-only) | Returns display name for an address |

### Events

- `DIDRegistered(owner, did, name)`
- `CredentialIssued(hash, subject, issuer, credentialType)`
- `CredentialRevoked(hash, issuer)`

### Modifier

- `onlyRegistered` — gates `issueCredential` so only users who have called `registerDID` can issue credentials or record document uploads on-chain.

---

## Pages & Roles

### `/` — Landing Page
Marketing hero with feature cards, animated gradient background, and CTA buttons linking to Dashboard and Login.

### `/login` — Wallet Connection & Registration
- Connects MetaMask wallet
- Auto-checks registration status on-chain once wallet is connected (with 8-second timeout)
- If already registered, auto-redirects to `/dashboard`
- If not registered, shows DID registration form
- Falls back to a "Continue to Dashboard" button if the RPC check times out

### `/dashboard` — User Dashboard
The main hub for credential holders. Four tabs:

- **Identity Profile** — Shows DID, display name, registration status, trust score, and a QR code for sharing your DID. Includes an **inline DID registration form** if the user hasn't registered yet, so they don't need to go back to `/login`. Handles "Already registered" errors gracefully by updating the UI to show verified status.
- **Document Vault** — Upload documents (Aadhaar, College ID, Passport, etc.) to IPFS via Pinata, then sign a contract transaction to record the upload on-chain. Features:
  - **Document title input** — user can name their document before uploading (pre-filled with filename)
  - **3-step upload flow**: Upload to IPFS → Sign with MetaMask → Confirm on-chain
  - Each document card shows: custom title, filename, IPFS CID, upload date, transaction hash with Etherscan link
  - If the user isn't registered, the contract rejects the transaction and an inline registration form appears right in the docs tab
- **Verifiable Credentials** — Lists all credentials issued to you, with on-chain verify and QR share actions
- **Activity Log** — Timeline of all credential and document events

### `/issuer` — Issuer Portal
For authorities (universities, government, organizations) to issue credentials. Two tabs:

- **Issue New** — Fill in a subject's DID/address, select credential type (University Degree, Identity Card, Aadhaar, Driver License, Health Certificate), provide metadata JSON, and sign the transaction via MetaMask
- **Issued** — View all credentials you've issued, with the ability to revoke any of them on-chain

### `/verifier` — Verification Engine
Anyone can verify a credential's authenticity — **no wallet connection required**. Three input methods:

- **Scan QR** — Use device camera to scan a credential QR code. Handles both raw hashes and full URLs (extracts the hash from query params)
- **Enter Hash** — Paste a 0x-prefixed credential hash
- **Upload JSON** — Upload a file containing a `credentialHash` field
- **Auto-verify from URL** — Opening `/verifier?hash=0x...` automatically starts verification (used by QR codes)

Queries the smart contract via read-only RPC call and displays: credential type, subject, issuer, issued date, and valid/revoked status. Keeps a session-based verification history.

---

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `Navbar` | `app/components/Navbar.tsx` | Fixed nav with wallet status, network detection, connect/disconnect |
| `Hero` | `app/components/Hero.tsx` | Animated landing hero with feature cards |
| `QRScanner` | `app/components/QRScanner.tsx` | Camera-based QR scanner using html5-qrcode |
| `WalletProvider` | `app/context/WalletContext.tsx` | React context for MetaMask connection, chain switching, account state |
| `useTrustID` | `app/hooks/useTrustID.ts` | Hook wrapping all smart contract interactions |

---

## Shared Utilities — `app/lib/contract.ts`

- `getContract(signer)` — Returns ethers Contract instance for write operations
- `getReadOnlyContract()` — Returns ethers Contract instance for read-only queries (public RPC fallback)
- `computeCredentialHash(subject, type, metadata)` — Keccak256 hash matching the on-chain computation
- `formatDID(address)` — Formats as `did:ethr:0x...`
- `shortenAddress(address)` — Formats as `0x1234...abcd`

---

## Type Definitions — `app/lib/types.ts`

```typescript
CredentialData {
  hash, subject, issuer, credentialType, issuedAt, revoked
}

DIDProfile {
  address, did, name, isRegistered
}

UploadedDocument {
  title?, fileName, ipfsHash, gateway, uploadedAt, txHash?, credentialHash?
}
```

---

## Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Client + Server | TrustID contract address on Sepolia |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Client + Server | Sepolia RPC endpoint (fallback for read-only) |
| `PINATA_API_KEY` | Server only | Pinata API key for IPFS uploads |
| `PINATA_SECRET_KEY` | Server only | Pinata secret key for IPFS uploads |

---

## Data Flow

### Document Upload
1. User selects file and enters a document title
2. File uploaded to Pinata IPFS via `/api/upload` server route
3. IPFS hash returned → metadata JSON constructed (title, fileName, ipfsHash, fileSize)
4. MetaMask transaction → `issueCredential(self, "Document Upload", hash)` on TrustID contract
5. Transaction confirmed → document saved to localStorage with txHash, credentialHash, and title
6. If user is not registered, the contract rejects → inline registration form shown → user registers → retries upload

### Credential Issuance
1. Issuer fills form (subject address, credential type, metadata JSON)
2. `computeCredentialHash()` generates a Keccak256 hash from the data
3. MetaMask transaction → `issueCredential(subject, type, hash)` on TrustID contract
4. Credential stored on-chain, queryable by both subject and issuer

### Credential Verification
1. Verifier provides credential hash (QR scan, URL query param, paste, or JSON upload)
2. Read-only RPC call → `verifyCredential(hash)` on TrustID contract
3. Returns: validity, subject, issuer, type, timestamp, revoked status
4. Resolves subject/issuer display names via `getDIDName()`

### QR Code Flow
1. Dashboard generates QR codes as full URLs: `http://<host>/verifier?hash=0x...`
2. Scanning on any device opens the verifier page and auto-starts verification
3. QR scanner in the verifier page extracts hashes from both raw strings and URLs

---

## RPC Strategy

- **When wallet is connected**: All contract reads (profile, credentials, verification) go through **MetaMask's RPC provider** for reliability
- **When no wallet connected** (e.g. verifier page): Falls back to the public Sepolia RPC (`NEXT_PUBLIC_SEPOLIA_RPC_URL`)
- **Profile load retries once** after 2 seconds on failure to handle flaky RPC responses
- **"Already registered" errors** from the contract are caught and treated as success, updating the UI accordingly

---

## Clipboard Handling

Copy buttons across all pages use a two-tier approach:
1. `navigator.clipboard.writeText()` — works on HTTPS and localhost (secure contexts)
2. `window.prompt('Copy this value:', text)` — fallback for HTTP on non-localhost (e.g. network IP access), shows a dialog with the text pre-selected for manual copy

---

## Styling

Glassmorphism dark theme with custom CSS classes:

- `.glass-card` — Frosted glass panels with blur and border
- `.glow-button` — Gradient buttons with glow shadow
- `.gradient-text` — Text with indigo→purple→cyan gradient fill
- `.float-anim` — Floating animation keyframes

CSS variables defined in `app/globals.css` control the color palette (indigo primary, purple secondary, cyan accent) on a near-black (#050508) background.

---

## File Structure

```
app/
├── api/upload/route.ts      — Pinata IPFS upload endpoint
├── components/
│   ├── Hero.tsx             — Landing page hero
│   ├── Navbar.tsx           — Navigation bar
│   └── QRScanner.tsx        — Camera QR scanner
├── context/
│   └── WalletContext.tsx     — MetaMask wallet state
├── hooks/
│   └── useTrustID.ts        — Smart contract interactions
├── lib/
│   ├── contract.ts          — Contract ABI, address, utilities
│   └── types.ts             — TypeScript interfaces
├── dashboard/page.tsx       — User dashboard (profile, docs, credentials, activity)
├── issuer/page.tsx          — Credential issuance portal
├── login/page.tsx           — Wallet connection & DID registration
├── verifier/page.tsx        — Credential verification engine
├── layout.tsx               — Root layout with providers
├── page.tsx                 — Landing page
├── providers.tsx            — WalletProvider wrapper
└── globals.css              — Tailwind + custom styles
contracts/
└── TrustID.sol              — Solidity smart contract
```
