// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SupplyChainTracker
 * @notice Blockchain-based supply chain tracking system used as the practical
 *         demo for the Advanced Information Security report (Topic: Blockchain
 *         Technology and Applications).
 *
 * Security properties demonstrated by this contract:
 *  - Data integrity & tamper detection : each product stores a keccak256 hash
 *    computed from its descriptive fields. verifyProduct() recomputes the hash
 *    from presented data and compares it with the stored one.
 *  - Authentication                    : every state-changing call is a signed
 *    transaction, so msg.sender proves who performed the action.
 *  - Access control                    : only the owner and authorized
 *    participants can create products or update status.
 *  - Auditability & traceability       : every action is recorded in an
 *    append-only history array and emitted as an event.
 */
contract SupplyChainTracker {
    // Supply chain flow: Created -> Shipped -> Received -> Sold
    enum Status {
        Created,
        Shipped,
        Received,
        Sold
    }

    struct Product {
        uint256 id; // Product ID
        string name; // Product name
        string origin; // Origin
        bytes32 productHash; // Fingerprint of product information
        Status status; // Current status
        address handler; // Current handler (last account that touched it)
        uint256 createdAt; // Created timestamp
        bool exists; // Existence flag
    }

    struct HistoryRecord {
        Status status; // Status set by this update
        address updatedBy; // Account that performed the update
        uint256 timestamp; // Block timestamp of the update
        string note; // Human-readable note (e.g. "Shipped by distributor")
    }

    address public owner;
    uint256 public productCount;

    mapping(address => bool) public authorized; // authorized participants
    mapping(uint256 => Product) private products; // productId => Product
    mapping(uint256 => HistoryRecord[]) private history; // productId => history

    event ParticipantAuthorized(address indexed account);
    event ProductCreated(
        uint256 indexed id,
        string name,
        bytes32 productHash,
        address indexed handler
    );
    event StatusUpdated(
        uint256 indexed id,
        Status status,
        address indexed updatedBy
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "Not an authorized participant");
        _;
    }

    modifier productExists(uint256 id) {
        require(products[id].exists, "Product does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        authorized[msg.sender] = true; // deployer (manufacturer) is authorized
        emit ParticipantAuthorized(msg.sender);
    }

    /**
     * @notice Owner authorizes another blockchain account to act in the supply
     *         chain (e.g. distributor, retailer). Demonstrates access control.
     */
    function authorizeParticipant(address account) external onlyOwner {
        require(account != address(0), "Zero address");
        authorized[account] = true;
        emit ParticipantAuthorized(account);
    }

    /**
     * @notice Create a new product and store its hash on the blockchain.
     * @dev The hash is computed on-chain from (name, serial, origin). If any of
     *      these fields is later altered, the recomputed hash will differ.
     * @return id The new product id.
     */
    function createProduct(
        string calldata name,
        string calldata origin,
        string calldata serial
    ) external onlyAuthorized returns (uint256 id) {
        productCount += 1;
        id = productCount;

        bytes32 productHash = keccak256(abi.encodePacked(name, serial, origin));

        products[id] = Product({
            id: id,
            name: name,
            origin: origin,
            productHash: productHash,
            status: Status.Created,
            handler: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        history[id].push(
            HistoryRecord({
                status: Status.Created,
                updatedBy: msg.sender,
                timestamp: block.timestamp,
                note: "Product created"
            })
        );

        emit ProductCreated(id, name, productHash, msg.sender);
    }

    /**
     * @notice Advance a product to the next status. Status can only move forward
     *         in order (Created -> Shipped -> Received -> Sold), enforcing the
     *         business rule on-chain.
     */
    function updateStatus(
        uint256 id,
        Status newStatus,
        string calldata note
    ) external onlyAuthorized productExists(id) {
        Product storage p = products[id];
        require(
            uint8(newStatus) == uint8(p.status) + 1,
            "Invalid status transition"
        );

        p.status = newStatus;
        p.handler = msg.sender;

        history[id].push(
            HistoryRecord({
                status: newStatus,
                updatedBy: msg.sender,
                timestamp: block.timestamp,
                note: note
            })
        );

        emit StatusUpdated(id, newStatus, msg.sender);
    }

    /**
     * @notice Verify whether presented product data matches the hash stored on
     *         chain. Returns false if the data was tampered with.
     */
    function verifyProduct(
        uint256 id,
        string calldata name,
        string calldata origin,
        string calldata serial
    ) external view productExists(id) returns (bool) {
        bytes32 recomputed = keccak256(abi.encodePacked(name, serial, origin));
        return recomputed == products[id].productHash;
    }

    /** @notice Returns the current product information. */
    function getProduct(uint256 id)
        external
        view
        productExists(id)
        returns (
            uint256,
            string memory,
            string memory,
            bytes32,
            Status,
            address,
            uint256
        )
    {
        Product storage p = products[id];
        return (
            p.id,
            p.name,
            p.origin,
            p.productHash,
            p.status,
            p.handler,
            p.createdAt
        );
    }

    /** @notice Number of history records for a product (for iteration). */
    function getHistoryLength(uint256 id)
        external
        view
        productExists(id)
        returns (uint256)
    {
        return history[id].length;
    }

    /** @notice Returns a specific history record of a product. */
    function getHistoryRecord(uint256 id, uint256 index)
        external
        view
        productExists(id)
        returns (Status, address, uint256, string memory)
    {
        require(index < history[id].length, "Index out of range");
        HistoryRecord storage r = history[id][index];
        return (r.status, r.updatedBy, r.timestamp, r.note);
    }
}
