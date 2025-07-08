module SuiBankZK::finality {
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::event;
    use std::vector;
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use std::bcs;

    // ===== ERROR CODES =====
    const EInvalidSignature: u64 = 0;
    const EInvalidProof: u64 = 1;
    const EInvalidNotary: u64 = 2;
    const EInvalidInitiator: u64 = 3;
    const EInvalidCounterparty: u64 = 4;
    const ETransactionAlreadyExists: u64 = 5;
    const EInvalidMetadata: u64 = 6;

    // ===== STRUCTS =====
    
    /// Public transaction struct - on-chain'de görünen veriler
    public struct PublicTx has copy, drop, store {
        initiator: address,
        counterparties: vector<address>,
        merkle_root: vector<u8>, // Merkle root hash
        metadata: vector<u8>,
        timestamp: u64,
        nonce: u64,
    }

    /// ZK Proof struct - private verilerin proof'u
    public struct ZKProof has copy, drop, store {
        proof_data: vector<u8>,
        public_inputs: vector<vector<u8>>,
        circuit_id: String,
    }

    /// ZK Proof Transaction - private filtered transaction
    public struct ZKProofTx has copy, drop, store {
        merkle_root: vector<u8>,
        component_hashes: vector<vector<u8>>,
        proof: ZKProof,
        transaction_id: vector<u8>,
    }

    /// Signature wrapper
    public struct TransactionSignature has copy, drop, store {
        signer: address,
        signature: vector<u8>,
        public_key: vector<u8>,
    }

    /// Notarised transaction kayıt nesnesi - on-chain'de saklanan
    public struct NotarisedTx has key {
        id: UID,
        public_tx: PublicTx,
        signatures: vector<TransactionSignature>,
        notary_signature: Option<TransactionSignature>,
        zk_proof: ZKProofTx,
        status: u8, // 0: pending, 1: notarised, 2: completed, 3: failed
        created_at: u64,
        updated_at: u64,
    }

    /// Transaction Registry - tüm transaction'ları takip eder
    public struct TransactionRegistry has key {
        id: UID,
        transactions: vector<vector<u8>>, // transaction ID'leri
        total_count: u64,
    }

    /// Notary Capability - notary yetkisi
    public struct NotaryCap has key {
        id: UID,
        notary: address,
    }

    // ===== EVENTS =====
    
    public struct TransactionCreated has copy, drop {   
        transaction_id: vector<u8>,
        initiator: address,
        counterparties: vector<address>,
        timestamp: u64,
    }

    public struct TransactionNotarised has copy, drop {
        transaction_id: vector<u8>,
        notary: address,
        timestamp: u64,
    }

    public struct TransactionCompleted has copy, drop {
        transaction_id: vector<u8>,
        timestamp: u64,
    }

    // ===== FUNCTIONS =====

    /// Transaction oluşturma fonksiyonu
    public fun create_transaction(
        ctx: &mut TxContext,
        initiator: address,
        counterparties: vector<address>,
        merkle_root: vector<u8>,
        metadata: vector<u8>,
        component_hashes: vector<vector<u8>>,
        proof_data: vector<u8>,
        public_inputs: vector<vector<u8>>,
        circuit_id: String,
    ): NotarisedTx {
        // Validasyonlar
        assert!(initiator != @0x0, EInvalidInitiator);
        assert!(vector::length(&counterparties) > 0, EInvalidCounterparty);
        assert!(vector::length(&merkle_root) == 32, EInvalidMetadata);
        
        let transaction_id = create_transaction_id(&initiator, &merkle_root, tx_context::epoch(ctx));
        
        let public_tx = PublicTx {
            initiator,
            counterparties,
            merkle_root,
            metadata,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
            nonce: tx_context::epoch(ctx),
        };

        let proof = ZKProof {
            proof_data,
            public_inputs,
            circuit_id,
        };

        let zk_proof_tx = ZKProofTx {
            merkle_root,
            component_hashes,
            proof,
            transaction_id: transaction_id,
        };

        let notarised_tx = NotarisedTx {
            id: object::new(ctx),
            public_tx: public_tx,
            signatures: vector::empty(),
            notary_signature: option::none(),
            zk_proof: zk_proof_tx,
            status: 0, // pending
            created_at: tx_context::epoch_timestamp_ms(ctx),
            updated_at: tx_context::epoch_timestamp_ms(ctx),
        };

        // Event yayınla
        event::emit(TransactionCreated {
            transaction_id,
            initiator,
            counterparties,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        notarised_tx
    }

    /// Transaction'a imza ekleme
    public fun add_signature(
        transaction: &mut NotarisedTx,
        signer: address,
        signature: vector<u8>,
        public_key: vector<u8>,
    ) {
        // Sadece counterparty'ler imza ekleyebilir
        assert!(vector::contains(&transaction.public_tx.counterparties, &signer), EInvalidSignature);
        
        let tx_sig = TransactionSignature {
            signer,
            signature,
            public_key,
        };

        vector::push_back(&mut transaction.signatures, tx_sig);
        transaction.updated_at = 0; // Gerçek uygulamada timestamp alınır
    }

    /// Notary imzası ekleme
    public fun add_notary_signature(
        _notary_cap: &NotaryCap,
        transaction: &mut NotarisedTx,
        notary: address,
        signature: vector<u8>,
        public_key: vector<u8>,
    ) {
        // Notary capability kontrolü
        assert!(_notary_cap.notary == notary, EInvalidNotary);
        
        let notary_sig = TransactionSignature {
            signer: notary,
            signature,
            public_key,
        };

        transaction.notary_signature = option::some(notary_sig);
        transaction.status = 1; // notarised
        transaction.updated_at = 0; // Gerçek uygulamada timestamp alınır
    }

    /// Transaction'ı tamamla
    public fun complete_transaction(
        transaction: &mut NotarisedTx,
        ctx: &mut TxContext,
    ) {
        // Tüm counterparty'lerin imzası olmalı
        assert!(vector::length(&transaction.signatures) == vector::length(&transaction.public_tx.counterparties), EInvalidSignature);
        
        // Notary imzası olmalı
        assert!(option::is_some(&transaction.notary_signature), EInvalidNotary);
        
        // ZK proof doğrulaması (simulated)
        assert!(verify_zk_proof(&transaction.zk_proof), EInvalidProof);
        
        transaction.status = 2; // completed
        transaction.updated_at = tx_context::epoch_timestamp_ms(ctx);

        event::emit(TransactionCompleted {
            transaction_id: transaction.zk_proof.transaction_id,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    /// Transaction ID oluşturma
    fun create_transaction_id(initiator: &address, merkle_root: &vector<u8>, nonce: u64): vector<u8> {
        let mut id_data = vector::empty<u8>();
        vector::append(&mut id_data, bcs::to_bytes(initiator));
        vector::append(&mut id_data, *merkle_root);
        vector::append(&mut id_data, bcs::to_bytes(&nonce));
        
        // Basit hash (gerçek uygulamada crypto::blake2b256 kullanılabilir)
        id_data
    }

    /// ZK Proof doğrulama (simulated)
    fun verify_zk_proof(zk_proof: &ZKProofTx): bool {
        // Gerçek uygulamada burada ZK proof verification yapılır
        // Şimdilik basit bir kontrol
        vector::length(&zk_proof.proof.proof_data) > 0
    }

    /// Notary capability oluşturma (sadece deployer)
    fun init(ctx: &mut TxContext) {
        let notary_cap = NotaryCap {
            id: object::new(ctx),
            notary: tx_context::sender(ctx),
        };
        transfer::transfer(notary_cap, tx_context::sender(ctx));
    }

    // ===== ENTRY FUNCTIONS =====

    /// Entry function for creating transaction
    public entry fun create_transaction_entry(
        initiator: address,
        counterparties: vector<address>,
        merkle_root: vector<u8>,
        metadata: vector<u8>,
        component_hashes: vector<vector<u8>>,
        proof_data: vector<u8>,
        public_inputs: vector<vector<u8>>,
        circuit_id: String,
        ctx: &mut TxContext,
    ) {
        let notarised_tx = create_transaction(
            ctx,
            initiator,
            counterparties,
            merkle_root,
            metadata,
            component_hashes,
            proof_data,
            public_inputs,
            circuit_id,
        );
        
        // Transaction'ı paylaş
        transfer::share_object(notarised_tx);
    }

    /// Entry function for adding signature
    public entry fun add_signature_entry(
        transaction: &mut NotarisedTx,
        signer: address,
        signature: vector<u8>,
        public_key: vector<u8>,
    ) {
        add_signature(transaction, signer, signature, public_key);
    }

    /// Entry function for adding notary signature
    public entry fun add_notary_signature_entry(
        _notary_cap: &NotaryCap,
        transaction: &mut NotarisedTx,
        notary: address,
        signature: vector<u8>,
        public_key: vector<u8>,
    ) {
        add_notary_signature(_notary_cap, transaction, notary, signature, public_key);
    }

    /// Entry function for completing transaction
    public entry fun complete_transaction_entry(
        transaction: &mut NotarisedTx,
    ) {
        // Gerçek uygulamada ctx parametresi alınır
        // Şimdilik basit bir mock
        transaction.status = 2; // completed
    }
}
