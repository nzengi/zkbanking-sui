# zkBank - Zero-Knowledge Banking on Sui

A decentralized banking system built on Sui blockchain that implements zero-knowledge proofs for secure, private financial transactions with multi-party signatures and notarization.

## Overview

zkBank is a Move smart contract that enables secure financial transactions with the following key features:

- **Multi-party Transaction Creation**: Create transactions that require multiple signatures
- **Zero-Knowledge Proofs**: Implement cryptographic proofs for transaction privacy
- **Notarization System**: Add notary signatures for additional security
- **Signature Verification**: Validate all signatures before transaction completion
- **Shared Object Architecture**: Use Sui's shared objects for collaborative transaction management

## Architecture

### Core Components

1. **NotarisedTx**: The main transaction object that holds all transaction data and signatures
2. **NotaryCap**: Capability object that grants notary privileges
3. **UpgradeCap**: Allows for future contract upgrades

### Key Functions

- `create_transaction_entry`: Initialize a new transaction with required signatures
- `add_signature_entry`: Add participant signatures to the transaction
- `add_notary_signature_entry`: Add notary signature for final validation
- `complete_transaction_entry`: Complete the transaction after all signatures are verified

## Prerequisites

- Sui CLI version 1.51.1 or higher
- Sui testnet account with sufficient gas tokens
- Basic understanding of Move language and Sui blockchain

## Installation & Setup

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd sui-zkbank
   ```

2. **Install Sui CLI** (if not already installed):

   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
   ```

3. **Switch to testnet**:

   ```bash
   sui client switch --env testnet
   ```

4. **Get testnet tokens** (if needed):
   ```bash
   sui client faucet
   ```

## Deployment

1. **Build the package**:

   ```bash
   sui move build
   ```

2. **Publish to testnet**:

   ```bash
   sui client publish --gas-budget 10000000
   ```

3. **Save the package ID** from the output for future use.

## Usage Examples

### 1. Create a Transaction

Create a new transaction with required signatures:

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module finality \
  --function create_transaction_entry \
  --args <INITIATOR_ADDRESS> \
         <COUNTERPARTY_ADDRESS> \
         <AMOUNT> \
         <TIMESTAMP> \
         <REQUIRED_SIGNATURES> \
         <NOTARY_REQUIRED> \
         <ZKP_PROOF> \
         <TRANSACTION_DATA> \
  --gas-budget 10000000
```

Example with actual values:

```bash
sui client call \
  --package 0xbb37eb9c6cb4940bbd035ebaa56e540f4c58e1196a05e8bd8409d01627fdc134 \
  --module finality \
  --function create_transaction_entry \
  --args 0x3f350562c0151db2394cb9813e987415bca1ef3826287502ce58382f6129f953 \
         0xf4304fc20db1db265d80c07c06ca955c9b22ec9dc305f34a65666d870cd1e615 \
         1000000000 \
         1751923282999 \
         2 \
         true \
         0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef \
         0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890 \
  --gas-budget 10000000
```

### 2. Add Participant Signature

Add a signature from a transaction participant:

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module finality \
  --function add_signature_entry \
  --args <TRANSACTION_ID> \
         <PARTICIPANT_ADDRESS> \
         <SIGNATURE> \
         <PUBLIC_KEY> \
  --gas-budget 10000000
```

Example:

```bash
sui client call \
  --package 0xbb37eb9c6cb4940bbd035ebaa56e540f4c58e1196a05e8bd8409d01627fdc134 \
  --module finality \
  --function add_signature_entry \
  --args 0xf8526baade0a550c9f9ea8da6bf3e1f7914430dc883d55a04e81b0024c9b5596 \
         0xf4304fc20db1db265d80c07c06ca955c9b22ec9dc305f34a65666d870cd1e615 \
         0x1111111111111111111111111111111111111111111111111111111111111111 \
         0x2222222222222222222222222222222222222222222222222222222222222222 \
  --gas-budget 10000000
```

### 3. Add Notary Signature

Add a notary signature using the NotaryCap:

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module finality \
  --function add_notary_signature_entry \
  --args <NOTARY_CAP_ID> \
         <TRANSACTION_ID> \
         <NOTARY_ADDRESS> \
         <NOTARY_SIGNATURE> \
         <NOTARY_PUBLIC_KEY> \
  --gas-budget 10000000
```

Example:

```bash
sui client call \
  --package 0xbb37eb9c6cb4940bbd035ebaa56e540f4c58e1196a05e8bd8409d01627fdc134 \
  --module finality \
  --function add_notary_signature_entry \
  --args 0xc418ef3135701de60bd5438b8ab524f3d5579ea3f86a9a131af4335115934b5f \
         0xf8526baade0a550c9f9ea8da6bf3e1f7914430dc883d55a04e81b0024c9b5596 \
         0x3f350562c0151db2394cb9813e987415bca1ef3826287502ce58382f6129f953 \
         0x3333333333333333333333333333333333333333333333333333333333333333 \
         0x4444444444444444444444444444444444444444444444444444444444444444 \
  --gas-budget 10000000
```

### 4. Complete Transaction

Complete the transaction after all signatures are added:

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module finality \
  --function complete_transaction_entry \
  --args <TRANSACTION_ID> \
  --gas-budget 10000000
```

Example:

```bash
sui client call \
  --package 0xbb37eb9c6cb4940bbd035ebaa56e540f4c58e1196a05e8bd8409d01627fdc134 \
  --module finality \
  --function complete_transaction_entry \
  --args 0xf8526baade0a550c9f9ea8da6bf3e1f7914430dc883d55a04e81b0024c9b5596 \
  --gas-budget 10000000
```

## Contract Structure

### Move.toml Configuration

```toml
[package]
name = "zkbank"
version = "1.0.0"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "framework/testnet" }

[addresses]
zkbank = "0x0"
```

### Key Data Structures

- **NotarisedTx**: Shared object containing transaction data and signatures
- **NotaryCap**: Capability for notary operations
- **TransactionCreated**: Event emitted when a transaction is created

## Security Features

1. **Multi-signature Requirements**: Transactions require multiple signatures before completion
2. **Notary Validation**: Optional notary signature for additional security
3. **Zero-Knowledge Proofs**: Cryptographic proofs for transaction privacy
4. **Shared Object Access Control**: Proper access control through Sui's shared object model
5. **Signature Verification**: All signatures are verified before transaction completion

## Gas Costs

Typical gas costs for operations:

- **Create Transaction**: ~4.8M MIST
- **Add Signature**: ~1.8M MIST
- **Add Notary Signature**: ~1.8M MIST
- **Complete Transaction**: ~1.1M MIST

## Development

### Building

```bash
sui move build
```

### Testing

```bash
sui move test
```

### Local Development

For local development, you can use Sui's local validator:

```bash
sui start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions and support, please open an issue on the repository.

## Acknowledgments

- Sui Foundation for the Move language and blockchain platform
- The Move community for documentation and examples
