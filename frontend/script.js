// zkBank Frontend JavaScript

class ZkBankApp {
  constructor() {
    this.apiBaseUrl = "http://localhost:3001/api";
    this.transactions = [];
    this.currentWallet = null;

    this.initializeEventListeners();
    this.loadTransactions();
    this.updateStats();
  }

  // Initialize all event listeners
  initializeEventListeners() {
    // Form submissions
    document
      .getElementById("transactionForm")
      .addEventListener("submit", (e) => this.handleCreateTransaction(e));
    document
      .getElementById("signatureForm")
      .addEventListener("submit", (e) => this.handleAddSignature(e));
    document
      .getElementById("notaryForm")
      .addEventListener("submit", (e) => this.handleAddNotarySignature(e));
    document
      .getElementById("completeForm")
      .addEventListener("submit", (e) => this.handleCompleteTransaction(e));

    // Button clicks
    document
      .getElementById("refreshTransactions")
      .addEventListener("click", () => this.loadTransactions());
    document
      .getElementById("connectWallet")
      .addEventListener("click", () => this.connectWallet());

    // Navigation buttons
    document
      .getElementById("createTransactionBtn")
      .addEventListener("click", () =>
        this.scrollToSection("createTransactionForm")
      );
    document
      .getElementById("viewTransactionsBtn")
      .addEventListener("click", () =>
        this.scrollToSection("transactionsList")
      );
  }

  // API Helper Methods
  async apiCall(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      this.showLoading(true);
      const response = await fetch(url, { ...defaultOptions, ...options });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      this.showNotification(error.message, "error");
      throw error;
    } finally {
      this.showLoading(false);
    }
  }

  // Transaction Management
  async handleCreateTransaction(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const transactionData = {
      initiator: formData.get("initiator"),
      counterparty: formData.get("counterparty"),
      amount: parseInt(formData.get("amount")),
      requiredSignatures: parseInt(formData.get("requiredSignatures")),
      notaryRequired: formData.get("notaryRequired") === "on",
      zkpProof:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      txData:
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    };

    try {
      const result = await this.apiCall("/transactions/create", {
        method: "POST",
        body: JSON.stringify(transactionData),
      });

      this.showNotification("Transaction created successfully!", "success");
      event.target.reset();
      this.loadTransactions();
      this.updateStats();

      // Auto-fill transaction ID fields for convenience
      document.getElementById("signatureTransactionId").value =
        result.transactionId;
      document.getElementById("notaryTransactionId").value =
        result.transactionId;
      document.getElementById("completeTransactionId").value =
        result.transactionId;
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  }

  async handleAddSignature(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const signatureData = {
      signer: formData.get("signer"),
      signature: this.generateSignature(),
      publicKey: this.generatePublicKey(),
    };

    try {
      const result = await this.apiCall(
        `/transactions/${formData.get("transactionId")}/sign`,
        {
          method: "POST",
          body: JSON.stringify(signatureData),
        }
      );

      this.showNotification("Signature added successfully!", "success");
      event.target.reset();
      this.loadTransactions();
      this.updateStats();
    } catch (error) {
      console.error("Error adding signature:", error);
    }
  }

  async handleAddNotarySignature(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const notaryData = {
      notary: formData.get("notary"),
      signature: this.generateSignature(),
      publicKey: this.generatePublicKey(),
    };

    try {
      const result = await this.apiCall(
        `/transactions/${formData.get("transactionId")}/notarize`,
        {
          method: "POST",
          body: JSON.stringify(notaryData),
        }
      );

      this.showNotification("Notary signature added successfully!", "success");
      event.target.reset();
      this.loadTransactions();
      this.updateStats();
    } catch (error) {
      console.error("Error adding notary signature:", error);
    }
  }

  async handleCompleteTransaction(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const transactionId = formData.get("transactionId");

    try {
      const result = await this.apiCall(
        `/transactions/${transactionId}/complete`,
        {
          method: "POST",
        }
      );

      this.showNotification("Transaction completed successfully!", "success");
      event.target.reset();
      this.loadTransactions();
      this.updateStats();
    } catch (error) {
      console.error("Error completing transaction:", error);
    }
  }

  // Data Loading
  async loadTransactions() {
    try {
      const result = await this.apiCall("/transactions");
      this.transactions = result.transactions || [];
      this.renderTransactions();
      this.updateStats();
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  }

  async updateStats() {
    const total = this.transactions.length;
    const pending = this.transactions.filter(
      (t) => t.status === "pending"
    ).length;
    const completed = this.transactions.filter((t) => t.completed).length;
    const notarized = this.transactions.filter((t) => t.notarySignature).length;

    document.getElementById("totalTransactions").textContent = total;
    document.getElementById("pendingTransactions").textContent = pending;
    document.getElementById("completedTransactions").textContent = completed;
    document.getElementById("notarizedTransactions").textContent = notarized;
  }

  // UI Rendering
  renderTransactions() {
    const container = document.getElementById("transactionsContainer");

    if (this.transactions.length === 0) {
      container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-300">No transactions found</p>
                    <button onclick="app.createSampleTransaction()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                        Create Sample Transaction
                    </button>
                </div>
            `;
      return;
    }

    container.innerHTML = this.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((transaction) => this.renderTransactionCard(transaction))
      .join("");
  }

  renderTransactionCard(transaction) {
    const statusClass = this.getStatusClass(transaction.status);
    const statusIcon = this.getStatusIcon(transaction.status);
    const progress = this.calculateProgress(transaction);

    return `
            <div class="transaction-card fade-in-up">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-lg font-semibold text-white mb-2">Transaction ${transaction.id.substring(
                          0,
                          8
                        )}...</h4>
                        <div class="flex items-center space-x-4 text-sm text-gray-300">
                            <span><i class="fas fa-calendar mr-1"></i>${new Date(
                              transaction.createdAt
                            ).toLocaleDateString()}</span>
                            <span><i class="fas fa-clock mr-1"></i>${new Date(
                              transaction.createdAt
                            ).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <span class="status-badge ${statusClass}">
                        <i class="${statusIcon} mr-1"></i>${transaction.status}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="text-gray-300 text-sm">Initiator:</label>
                        <div class="address">${transaction.initiator}</div>
                    </div>
                    <div>
                        <label class="text-gray-300 text-sm">Counterparty:</label>
                        <div class="address">${transaction.counterparty}</div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="text-gray-300 text-sm">Amount:</label>
                        <div class="text-white font-semibold">${transaction.amount.toLocaleString()} MIST</div>
                    </div>
                    <div>
                        <label class="text-gray-300 text-sm">Signatures:</label>
                        <div class="text-white font-semibold">${
                          transaction.signatures.length
                        }/${transaction.requiredSignatures}</div>
                    </div>
                    <div>
                        <label class="text-gray-300 text-sm">Notary Required:</label>
                        <div class="text-white font-semibold">${
                          transaction.notaryRequired ? "Yes" : "No"
                        }</div>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="text-gray-300 text-sm">Progress:</label>
                    <div class="progress-bar mt-2">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>

                ${this.renderSignatures(transaction)}

                ${
                  transaction.notarySignature
                    ? this.renderNotarySignature(transaction.notarySignature)
                    : ""
                }

                <div class="flex justify-end space-x-2 mt-4">
                    <button onclick="app.copyTransactionId('${
                      transaction.id
                    }')" class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-copy mr-1"></i>Copy ID
                    </button>
                    <button onclick="app.viewTransactionDetails('${
                      transaction.id
                    }')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        <i class="fas fa-eye mr-1"></i>Details
                    </button>
                </div>
            </div>
        `;
  }

  renderSignatures(transaction) {
    if (transaction.signatures.length === 0) {
      return '<div class="text-gray-400 text-sm">No signatures yet</div>';
    }

    return `
            <div class="mb-4">
                <label class="text-gray-300 text-sm">Signatures:</label>
                ${transaction.signatures
                  .map(
                    (sig) => `
                    <div class="signature-item verified">
                        <div class="flex justify-between items-center">
                            <span class="text-white text-sm">${sig.signer.substring(
                              0,
                              8
                            )}...</span>
                            <span class="text-green-400 text-xs">
                                <i class="fas fa-check-circle mr-1"></i>Verified
                            </span>
                        </div>
                        <div class="text-gray-400 text-xs mt-1">${new Date(
                          sig.timestamp
                        ).toLocaleString()}</div>
                    </div>
                `
                  )
                  .join("")}
            </div>
        `;
  }

  renderNotarySignature(notarySignature) {
    return `
            <div class="mb-4">
                <label class="text-gray-300 text-sm">Notary Signature:</label>
                <div class="signature-item verified">
                    <div class="flex justify-between items-center">
                        <span class="text-white text-sm">${notarySignature.notary.substring(
                          0,
                          8
                        )}...</span>
                        <span class="text-purple-400 text-xs">
                            <i class="fas fa-stamp mr-1"></i>Notarized
                        </span>
                    </div>
                    <div class="text-gray-400 text-xs mt-1">${new Date(
                      notarySignature.timestamp
                    ).toLocaleString()}</div>
                </div>
            </div>
        `;
  }

  // Utility Methods
  getStatusClass(status) {
    const statusMap = {
      pending: "status-pending",
      ready_for_notary: "status-ready",
      ready_for_completion: "status-ready",
      completed: "status-completed",
    };
    return statusMap[status] || "status-pending";
  }

  getStatusIcon(status) {
    const iconMap = {
      pending: "fas fa-clock",
      ready_for_notary: "fas fa-user-check",
      ready_for_completion: "fas fa-check-circle",
      completed: "fas fa-check-double",
    };
    return iconMap[status] || "fas fa-clock";
  }

  calculateProgress(transaction) {
    let progress = 0;

    // Add progress for signatures
    progress +=
      (transaction.signatures.length / transaction.requiredSignatures) * 50;

    // Add progress for notary if required
    if (transaction.notaryRequired && transaction.notarySignature) {
      progress += 25;
    } else if (!transaction.notaryRequired) {
      progress += 25;
    }

    // Add progress for completion
    if (transaction.completed) {
      progress += 25;
    }

    return Math.min(progress, 100);
  }

  generateSignature() {
    return (
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")
    );
  }

  generatePublicKey() {
    return (
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("")
    );
  }

  // UI Interaction Methods
  showLoading(show) {
    const overlay = document.getElementById("loadingOverlay");
    overlay.classList.toggle("hidden", !show);
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification");
    const icon = document.getElementById("notificationIcon");
    const messageEl = document.getElementById("notificationMessage");

    // Set icon based on type
    const iconMap = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    };
    icon.className = `${iconMap[type]} mr-3 text-white`;

    // Set message
    messageEl.textContent = message;

    // Add type class
    notification.className = `notification ${type} show`;

    // Auto hide after 5 seconds
    setTimeout(() => {
      notification.classList.remove("show");
    }, 5000);
  }

  scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  copyTransactionId(transactionId) {
    navigator.clipboard.writeText(transactionId).then(() => {
      this.showNotification("Transaction ID copied to clipboard!", "success");
    });
  }

  viewTransactionDetails(transactionId) {
    const transaction = this.transactions.find((t) => t.id === transactionId);
    if (transaction) {
      alert(JSON.stringify(transaction, null, 2));
    }
  }

  async createSampleTransaction() {
    try {
      await this.apiCall("/demo/create-sample", { method: "POST" });
      this.showNotification("Sample transaction created!", "success");
      this.loadTransactions();
    } catch (error) {
      console.error("Error creating sample transaction:", error);
    }
  }

  connectWallet() {
    // Simulate wallet connection
    this.currentWallet =
      "0x" +
      Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");
    this.showNotification("Wallet connected!", "success");

    const button = document.getElementById("connectWallet");
    button.innerHTML = '<i class="fas fa-wallet mr-2"></i>Connected';
    button.classList.remove("bg-blue-600", "hover:bg-blue-700");
    button.classList.add("bg-green-600", "hover:bg-green-700");
  }
}

// Initialize the application
const app = new ZkBankApp();

// Global utility functions
window.app = app;

// Auto-refresh transactions every 30 seconds
setInterval(() => {
  app.loadTransactions();
}, 30000);
