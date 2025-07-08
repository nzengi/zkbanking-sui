const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const { SuiClient, getFullnodeUrl } = require("@mysten/sui.js/client");
const { TransactionBlock } = require("@mysten/sui.js/transactions");
const { Ed25519Keypair } = require("@mysten/sui.js/keypairs/ed25519");
const { fromB64 } = require("@mysten/sui.js/utils");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Sui client configuration
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

// Package and object IDs from your deployment
const PACKAGE_ID =
  "0xbb37eb9c6cb4940bbd035ebaa56e540f4c58e1196a05e8bd8409d01627fdc134";
const NOTARY_CAP_ID =
  "0xc418ef3135701de60bd5438b8ab524f3d5579ea3f86a9a131af4335115934b5f";

// Security middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// In-memory storage for demo purposes (in production, use a database)
const transactions = new Map();
const signatures = new Map();

// Utility functions
function generateTransactionId() {
  return (
    "0x" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function generateSignature() {
  return (
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")
  );
}

function generatePublicKey() {
  return (
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")
  );
}

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    packageId: PACKAGE_ID,
    network: "testnet",
  });
});

// Create transaction
app.post("/api/transactions/create", async (req, res) => {
  try {
    const {
      initiator,
      counterparty,
      amount,
      requiredSignatures = 2,
      notaryRequired = true,
      zkpProof = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      txData = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    } = req.body;

    // Validate required fields
    if (!initiator || !counterparty || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transactionId = generateTransactionId();
    const timestamp = Date.now();

    // Create transaction object
    const transaction = {
      id: transactionId,
      initiator,
      counterparty,
      amount: parseInt(amount),
      timestamp,
      requiredSignatures: parseInt(requiredSignatures),
      notaryRequired: Boolean(notaryRequired),
      zkpProof,
      txData,
      signatures: [],
      notarySignature: null,
      completed: false,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    // Store transaction
    transactions.set(transactionId, transaction);

    // In a real implementation, you would call the Sui blockchain here
    // For demo purposes, we'll simulate the blockchain call
    console.log("Creating transaction on Sui blockchain:", transactionId);

    res.status(201).json({
      success: true,
      transactionId,
      transaction,
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add signature
app.post("/api/transactions/:id/sign", async (req, res) => {
  try {
    const { id } = req.params;
    const { signer, signature, publicKey } = req.body;

    // Validate required fields
    if (!signer || !signature || !publicKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transaction = transactions.get(id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.completed) {
      return res.status(400).json({ error: "Transaction already completed" });
    }

    // Check if signer already signed
    const existingSignature = transaction.signatures.find(
      (sig) => sig.signer === signer
    );
    if (existingSignature) {
      return res
        .status(400)
        .json({ error: "Signer already signed this transaction" });
    }

    // Add signature
    const newSignature = {
      signer,
      signature,
      publicKey,
      timestamp: Date.now(),
    };

    transaction.signatures.push(newSignature);
    transaction.status =
      transaction.signatures.length >= transaction.requiredSignatures
        ? "ready_for_notary"
        : "pending";

    // Store updated transaction
    transactions.set(id, transaction);

    // In a real implementation, you would call the Sui blockchain here
    console.log("Adding signature to transaction:", id);

    res.json({
      success: true,
      transaction,
      message: "Signature added successfully",
    });
  } catch (error) {
    console.error("Error adding signature:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add notary signature
app.post("/api/transactions/:id/notarize", async (req, res) => {
  try {
    const { id } = req.params;
    const { notary, signature, publicKey } = req.body;

    // Validate required fields
    if (!notary || !signature || !publicKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const transaction = transactions.get(id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.completed) {
      return res.status(400).json({ error: "Transaction already completed" });
    }

    if (!transaction.notaryRequired) {
      return res
        .status(400)
        .json({ error: "Notary signature not required for this transaction" });
    }

    if (transaction.signatures.length < transaction.requiredSignatures) {
      return res
        .status(400)
        .json({ error: "Not enough signatures to add notary signature" });
    }

    // Add notary signature
    transaction.notarySignature = {
      notary,
      signature,
      publicKey,
      timestamp: Date.now(),
    };

    transaction.status = "ready_for_completion";

    // Store updated transaction
    transactions.set(id, transaction);

    // In a real implementation, you would call the Sui blockchain here
    console.log("Adding notary signature to transaction:", id);

    res.json({
      success: true,
      transaction,
      message: "Notary signature added successfully",
    });
  } catch (error) {
    console.error("Error adding notary signature:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Complete transaction
app.post("/api/transactions/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = transactions.get(id);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.completed) {
      return res.status(400).json({ error: "Transaction already completed" });
    }

    // Validate completion requirements
    if (transaction.signatures.length < transaction.requiredSignatures) {
      return res
        .status(400)
        .json({ error: "Not enough signatures to complete transaction" });
    }

    if (transaction.notaryRequired && !transaction.notarySignature) {
      return res
        .status(400)
        .json({ error: "Notary signature required but not provided" });
    }

    // Complete transaction
    transaction.completed = true;
    transaction.status = "completed";
    transaction.completedAt = new Date().toISOString();

    // Store updated transaction
    transactions.set(id, transaction);

    // In a real implementation, you would call the Sui blockchain here
    console.log("Completing transaction:", id);

    res.json({
      success: true,
      transaction,
      message: "Transaction completed successfully",
    });
  } catch (error) {
    console.error("Error completing transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get transaction
app.get("/api/transactions/:id", (req, res) => {
  try {
    const { id } = req.params;
    const transaction = transactions.get(id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("Error getting transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all transactions
app.get("/api/transactions", (req, res) => {
  try {
    const allTransactions = Array.from(transactions.values());

    res.json({
      success: true,
      transactions: allTransactions,
      count: allTransactions.length,
    });
  } catch (error) {
    console.error("Error getting transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get transaction status
app.get("/api/transactions/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const transaction = transactions.get(id);

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      success: true,
      status: transaction.status,
      completed: transaction.completed,
      signaturesCount: transaction.signatures.length,
      requiredSignatures: transaction.requiredSignatures,
      hasNotarySignature: !!transaction.notarySignature,
    });
  } catch (error) {
    console.error("Error getting transaction status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Demo endpoints for testing
app.post("/api/demo/create-sample", (req, res) => {
  try {
    const transactionId = generateTransactionId();
    const sampleTransaction = {
      id: transactionId,
      initiator:
        "0x3f350562c0151db2394cb9813e987415bca1ef3826287502ce58382f6129f953",
      counterparty:
        "0xf4304fc20db1db265d80c07c06ca955c9b22ec9dc305f34a65666d870cd1e615",
      amount: 1000000000,
      timestamp: Date.now(),
      requiredSignatures: 2,
      notaryRequired: true,
      zkpProof:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      txData:
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      signatures: [],
      notarySignature: null,
      completed: false,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    transactions.set(transactionId, sampleTransaction);

    res.json({
      success: true,
      transactionId,
      transaction: sampleTransaction,
      message: "Sample transaction created for demo",
    });
  } catch (error) {
    console.error("Error creating sample transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 zkBank API server running on port ${PORT}`);
  console.log(`📦 Package ID: ${PACKAGE_ID}`);
  console.log(`🔐 Notary Cap ID: ${NOTARY_CAP_ID}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
