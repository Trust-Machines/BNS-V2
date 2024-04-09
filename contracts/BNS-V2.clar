
;; title: BNS-V2
;; version: V-1
;; summary: Updated BNS contract, handles the creation of new namespaces and new names on each namespace
;; description:

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;; traits ;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

;; Import SIP-09 NFT trait 
(impl-trait .sip-09.nft-trait)
;; Import a custom commission trait for handling commissions for NFT marketplaces functions
(use-trait commission-trait .commission-trait.commission)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Token Definition ;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Define the non-fungible token (NFT) called BNS-V2 with unique identifiers as unsigned integers
(define-non-fungible-token BNS-V2 uint)

;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;
;;;;;; SIP - 09 ;;;;;
;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;

;; @desc SIP-09 compliant function to get the last minted token's ID
(define-read-only (get-last-token-id)
    ;; Returns the current value of bns-mint-counter variable, which tracks the last token ID
    (ok (var-get bns-mint-counter))
)

;; @desc SIP-09 compliant function to get token URI
(define-read-only (get-token-uri (id uint))
    ;; Returns a predefined set URI for the token metadata
    (ok (some (var-get token-uri)))
)

;; @desc SIP-09 compliant function to get the owner of a specific token by its ID
(define-read-only (get-owner (id uint))
    ;; Check and return the owner of the specified NFT
    (ok (nft-get-owner? BNS-V2 id))
)

;; @desc SIP-09 compliant function to transfer a token from one owner to another
;; @param id: the id of the nft being transferred, owner: the principal of the owner of the nft being transferred, recipient: the principal the nft is being transferred to
(define-public (transfer (id uint) (owner principal) (recipient principal))
    (begin
        ;; Asserts that the tx-sender is the owner of the NFT being transferred
        (asserts! (is-eq tx-sender owner) ERR-NOT-AUTHORIZED)
        ;; Asserts that the ID being transferred is not listed in a marketplace
        (asserts! (is-none (map-get? market id)) ERR-LISTED)
        ;; Executes NFT transfer if conditions are met
        (nft-transfer? BNS-V2 id owner recipient)
    )

)

;; @desc Function to list an NFT for sale
;; @param id: the ID of the NFT in question, price: the price being listed, comm-trait: a principal that conforms to the commission-trait
(define-public (list-in-ustx (id uint) (price uint) (comm-trait <commission-trait>))
    (let
        (
            ;; Creates a listing record with price and commission details
            (listing {price: price, commission: (contract-of comm-trait)})
        )
        ;; Asserts that the caller is the owner of the NFT before listing it
        (asserts! (is-eq (some tx-sender) (unwrap! (get-owner id) ERR-UNWRAP)) ERR-NOT-AUTHORIZED)
        ;; Updates the market map with the new listing details
        (map-set market id listing)
        ;; Prints listing details
        (ok (print (merge listing {a: "list-in-ustx", id: id})))
    )
)

;; @desc Function to remove an NFT listing from the market
;; @param id: the ID of the NFT in question, price: the price being listed, comm-trait: a principal that conforms to the commission-trait
(define-public (unlist-in-ustx (id uint))
    (begin
        ;; Asserts that the caller is the owner of the NFT before unlisting it
        (asserts! (is-eq (some tx-sender) (unwrap! (get-owner id) ERR-UNWRAP)) ERR-NOT-AUTHORIZED)
        ;; Deletes the listing from the market map
        (map-delete market id)
        ;; Prints unlisting details
        (ok (print {a: "unlist-in-stx", id: id}))
    )
)

;; @desc Function to buy an NFT listed for sale, transferring ownership and handling commission
;; @param id: the ID of the NFT in question, comm-trait: a principal that conforms to the commission-trait for royalty split
(define-public (buy-in-ustx (id uint) (comm-trait <commission-trait>))
    (let
        (
            ;; Retrieves current owner and listing details
            (owner (unwrap! (unwrap! (get-owner id) ERR-UNWRAP) ERR-UNWRAP))
            (listing (unwrap! (map-get? market id) ERR-NOT-LISTED))
            (price (get price listing))
        )
        ;; Verifies the commission details match the listing
        (asserts! (is-eq (contract-of comm-trait) (get commission listing)) ERR-WRONG-COMMISSION)
        ;; Transfers STX from buyer to seller
        (try! (stx-transfer? price tx-sender owner))
        ;; Calls the commission contract to handle commission payment
        (try! (contract-call? comm-trait pay id price))
        ;; Transfers the NFT to the buyer
        (try! (transfer id owner tx-sender))
        ;; Removes the listing from the market map
        (map-delete market id)
        ;; Prints purchase details
        (ok (print {a: "buy-in-ustx", id: id}))
    )
)

;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Constants ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

;; Constants for the token name and symbol, providing identifiers for the NFTs
(define-constant token-name "BNS-V2")
(define-constant token-symbol "BNS-V2")

;; Time-to-live (TTL) constants for namespace preorders and name preorders, and the duration for name grace period.
;; The TTL for namespace preorders.
(define-constant NAMESPACE-PREORDER-CLAIMABILITY-TTL u144) 
;; The duration after revealing a namespace within which it must be launched.
(define-constant NAMESPACE-LAUNCHABILITY-TTL u52595) 
;; The TTL for name preorders.
(define-constant NAME-PREORDER-CLAIMABILITY-TTL u144) 
;; The grace period duration for name renewals post-expiration.
(define-constant NAME-GRACE-PERIOD-DURATION u5000) 

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;; Errors ;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

(define-constant ERR-UNWRAP (err u101))
(define-constant ERR-NOT-AUTHORIZED (err u102))
(define-constant ERR-NOT-LISTED (err u103))
(define-constant ERR-WRONG-COMMISSION (err u104))
(define-constant ERR-LISTED (err u105))
(define-constant ERR-ALREADY-PRIMARY-NAME (err u106))
(define-constant ERR-NO-NAME (err u107))
(define-constant ERR-NAME-LOCKED (err u108))
(define-constant ERR-NAMESPACE-PREORDER-ALREADY-EXISTS (err u109))
(define-constant ERR-NAMESPACE-HASH-MALFORMED (err u110))
(define-constant ERR-NAMESPACE-STX-BURNT-INSUFFICIENT (err u111))
(define-constant ERR-INSUFFICIENT-FUNDS (err u112))
(define-constant ERR-NAMESPACE-PREORDER-NOT-FOUND (err u113))
(define-constant ERR-NAMESPACE-CHARSET-INVALID (err u114))
(define-constant ERR-NAMESPACE-ALREADY-EXISTS (err u115))
(define-constant ERR-NAMESPACE-PREORDER-CLAIMABILITY-EXPIRED (err u116))
(define-constant ERR-NAMESPACE-NOT-FOUND (err u117))
(define-constant ERR-NAMESPACE-OPERATION-UNAUTHORIZED (err u118))
(define-constant ERR-NAMESPACE-ALREADY-LAUNCHED (err u119))
(define-constant ERR-NAMESPACE-PREORDER-LAUNCHABILITY-EXPIRED (err u200))
(define-constant ERR-NAMESPACE-NOT-LAUNCHED (err u201))
(define-constant ERR-NAME-OPERATION-UNAUTHORIZED (err u202))
(define-constant ERR-NAME-NOT-AVAILABLE (err u203))
(define-constant ERR-NAME-NOT-FOUND (err u204))


;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Variables ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

;; Variable to store the token URI, allowing for metadata association with the NFT
(define-data-var token-uri (string-ascii 246) "")

;; Counter to keep track of the last minted NFT ID, ensuring unique identifiers
(define-data-var bns-mint-counter uint u0)

;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;
;;;;;; Maps ;;;;;
;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;

;; Map to track market listings, associating NFT IDs with price and commission details
(define-map market uint {price: uint, commission: principal})

;; This map stores properties of each namespace including who manages it, and the timestamps of key events.
;; It allows tracking the lifecycle of namespace names.
(define-map namespaces (buff 20)
    { 
        ;; Optional principal indicating who manages the namespace. 'None' if not managed.
        namespace-manager: (optional principal),
        ;; Timestamp for when the namespace was officially launched.
        launched-at: uint,
        ;; Duration in blocks for how long names within the namespace are valid.
        lifetime: uint,
    }
)

;; This map tracks the primary name chosen by a user who owns multiple BNS names.
;; It maps a user's principal to the ID of their primary name.
(define-map primary-name principal uint)

;; Tracks all the BNS names owned by a user. Each user is mapped to a list of name IDs.
;; This allows for easy enumeration of all names owned by a particular user.
(define-map all-user-names principal (list 1000 uint))

(define-map name-properties 
    {
        name: (buff 48), namespace: (buff 20)
    } 
    { 
        registered-at: (optional uint),
        locked: bool,
        renewal-height: uint,
        price: uint,
        owner: principal,
        zonefile-hash: (buff 20)
    }
)

(define-map index-to-name uint 
    {
        name: (buff 48), namespace: (buff 20)
    } 
)

(define-map name-to-index 
    {
        name: (buff 48), namespace: (buff 20)
    } 
    uint
)

;; Records namespace preorder transactions with their creation times, claim status, and STX burned.
(define-map namespace-preorders
    { hashed-salted-namespace: (buff 20), buyer: principal }
    { created-at: uint, claimed: bool, stx-burned: uint }
)

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;; Public ;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

;; Sets the primary name for the caller to a specific BNS name they own.
(define-public (set-primary-name (primary-name-id uint))
    (let 
        (
            ;; Retrieves the owner of the specified name ID
            (owner (unwrap! (nft-get-owner? BNS-V2 primary-name-id) ERR-UNWRAP))
            ;; Retrieves the current primary name for the caller, to check if an update is necessary.
            (current-primary-name (unwrap! (map-get? primary-name tx-sender) ERR-UNWRAP))
            ;; Retrieves the name and namespace from the uint/index
            (name-and-namespace (unwrap! (map-get? index-to-name primary-name-id) ERR-NO-NAME))
            ;; Retrieves the current locked status of the name
            (is-locked (unwrap! (get locked (map-get? name-properties name-and-namespace)) ERR-UNWRAP))
        ) 
        ;; Verifies that the caller (`tx-sender`) is indeed the owner of the name they wish to set as primary.
        (asserts! (is-eq owner tx-sender) ERR-NOT-AUTHORIZED)
        ;; Ensures the new primary name is different from the current one to avoid redundant updates.
        (asserts! (not (is-eq primary-name-id current-primary-name)) ERR-ALREADY-PRIMARY-NAME)
        ;; Asserts that the name is not locked
        (asserts! (is-eq false is-locked) ERR-NAME-LOCKED)
        ;; Updates the mapping of the caller's principal to the new primary name ID.
        (map-set primary-name tx-sender primary-name-id)
        ;; Returns 'true' upon successful execution of the function.
        (ok true)
    )
)

;; Public function `namespace-preorder` initiates the registration process for a namespace by sending a transaction with a salted hash of the namespace.
;; This transaction burns the registration fee as a commitment.
;; @params:
    ;; hashed-salted-namespace (buff 20): The hashed and salted namespace being preordered.
    ;; stx-to-burn (uint): The amount of STX tokens to be burned as part of the preorder process.
(define-public (namespace-preorder (hashed-salted-namespace (buff 20)) (stx-to-burn uint))
    (let 
        (
            ;; Check if there's an existing preorder for the same hashed-salted-namespace by the same buyer.
            (former-preorder (map-get? namespace-preorders { hashed-salted-namespace: hashed-salted-namespace, buyer: tx-sender }))
        )
        ;; Verify that any previous preorder by the same buyer has expired.
        (asserts! 
            (if (is-none former-preorder) 
                ;; Proceed if no previous preorder exists.
                true 
                ;; If a previous preorder exists, check that it has expired based on the NAMESPACE-PREORDER-CLAIMABILITY-TTL.
                (>= block-height (+ NAMESPACE-PREORDER-CLAIMABILITY-TTL (unwrap! (get created-at former-preorder) ERR-UNWRAP)))
            ) 
            ERR-NAMESPACE-PREORDER-ALREADY-EXISTS
        )
        ;; Validate that the hashed-salted-namespace is exactly 20 bytes long to conform to expected hash standards.
        (asserts! (is-eq (len hashed-salted-namespace) u20) ERR-NAMESPACE-HASH-MALFORMED)
        ;; Confirm that the STX amount to be burned is positive
        (asserts! (> stx-to-burn u0) ERR-NAMESPACE-STX-BURNT-INSUFFICIENT)
        ;; Execute the token burn operation, deducting the specified STX amount from the buyer's balance.
        (unwrap! (stx-burn? stx-to-burn tx-sender) ERR-INSUFFICIENT-FUNDS)
        ;; Record the preorder details in the `namespace-preorders` map, marking it as not yet claimed.
        (map-set namespace-preorders
            { hashed-salted-namespace: hashed-salted-namespace, buyer: tx-sender }
            { created-at: block-height, claimed: false, stx-burned: stx-to-burn }
        )
        ;; Return the block height at which the preorder claimability expires, based on the NAMESPACE_PREORDER_CLAIMABILITY_TTL.
        (ok (+ block-height NAMESPACE-PREORDER-CLAIMABILITY-TTL))
    )
)

;; Public function `namespace-reveal` completes the second step in the namespace registration process by revealing the details of the namespace to the blockchain.
;; It associates the revealed namespace with its corresponding preorder, establishes the namespace's pricing function, and sets its lifetime and ownership details.
;; @params:
    ;; namespace (buff 20): The namespace being revealed.
    ;; namespace-salt (buff 20): The salt used during the preorder to generate a unique hash.
    ;; p-func-base, p-func-coeff, p-func-b1 to p-func-b16: Parameters defining the price function for registering names within this namespace.
    ;; p-func-non-alpha-discount (uint): Discount applied to names with non-alphabetic characters.
    ;; p-func-no-vowel-discount (uint): Discount applied to names without vowels.
    ;; lifetime (uint): Duration that names within this namespace are valid before needing renewal.
    ;; namespace-import (principal): The principal authorized to import names into this namespace.
(define-public (namespace-launch (namespace (buff 20)) (namespace-salt (buff 20)) (lifetime uint) (namespace-manager (optional principal)))
    ;; The salt and namespace must hash to a preorder entry in the `namespace_preorders`.
    ;; The sender must match the principal in the preorder entry
    (let 
        (
            ;; Generate the hashed, salted namespace identifier to match with its preorder.
            (hashed-salted-namespace (hash160 (concat namespace namespace-salt)))
            ;; Retrieve the preorder record to ensure it exists and is valid for the revealing namespace.
            (preorder (unwrap! (map-get? namespace-preorders { hashed-salted-namespace: hashed-salted-namespace, buyer: tx-sender }) ERR-NAMESPACE-PREORDER-NOT-FOUND))
           
        )
        ;; Ensure the namespace consists of valid characters only.
        (asserts! (not (has-invalid-chars namespace)) ERR-NAMESPACE-CHARSET-INVALID)
        ;; Check that the namespace is available for reveal (not already existing or expired).
        (asserts! (is-none (map-get? namespaces namespace)) ERR-NAMESPACE-ALREADY-EXISTS)
        ;; Verify the burned amount during preorder meets or exceeds the namespace's registration price.
        (asserts! (>= (get stx-burned preorder) u2) ERR-NAMESPACE-STX-BURNT-INSUFFICIENT)
        ;; Confirm the reveal action is performed within the allowed timeframe from the preorder.
        (asserts! (< block-height (+ (get created-at preorder) NAMESPACE-PREORDER-CLAIMABILITY-TTL)) ERR-NAMESPACE-PREORDER-CLAIMABILITY-EXPIRED)
        ;; Mark the preorder as claimed to prevent reuse.
        (map-set namespace-preorders
            { hashed-salted-namespace: hashed-salted-namespace, buyer: tx-sender }
            { created-at: (get created-at preorder), claimed: true, stx-burned: (get stx-burned preorder) }
        )
        ;; Register the namespace as revealed with its pricing function, lifetime, and import principal details.
        (map-set namespaces namespace
            { 
                ;; Optional principal indicating who manages the namespace. 'None' if not managed.
                namespace-manager: namespace-manager,
                ;; Timestamp for when the namespace was officially launched.
                launched-at: block-height,
                ;; Duration in blocks for how long names within the namespace are valid.
                lifetime: lifetime,
            }
        )
        ;; Confirm successful reveal of the namespace
        (ok true)
    )
)

;; Defines a public function to burn an NFT, identified by its unique ID, under managed namespace authority.
(define-public (mng-burn (id uint)) 
    (let 
        (
            ;; Retrieves the name and namespace associated with the given NFT ID. If not found, returns an error.
            (name-and-namespace (unwrap! (map-get? index-to-name id) ERR-NAME-NOT-FOUND))

            ;; Extracts the namespace part from the retrieved name-and-namespace tuple.
            (namespace (get namespace name-and-namespace))

            ;; Fetches existing properties of the namespace to confirm its existence and retrieve management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))

            ;; Retrieves the current manager of the namespace from the namespace properties.
            (current-namespace-manager (unwrap! (get namespace-manager namespace-props) ERR-UNWRAP))

            ;; Retrieves the current owner of the NFT, necessary to authorize the burn operation.
            (current-name-owner (unwrap! (nft-get-owner? BNS-V2 id) ERR-UNWRAP))
        ) 
        ;; Ensures that the function caller is the current namespace manager, providing the authority to perform the burn.
        (asserts! (is-eq contract-caller current-namespace-manager) ERR-NOT-AUTHORIZED)

        ;; Executes the burn operation for the specified NFT, effectively removing it from circulation.
        (ok (nft-burn? BNS-V2 id current-name-owner))
    )
)

;; Defines a public function for registering a new BNS name within a specified namespace.
(define-public (mng-register (name (buff 48)) (namespace (buff 20)) (send-to principal) (price uint) (zonefile (buff 20)))
    (let 
        (
            ;; Retrieves existing properties of the namespace to confirm its existence and management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            
            ;; Extracts the current manager of the namespace to verify the authority of the caller.
            (current-namespace-manager (unwrap! (get namespace-manager namespace-props) ERR-UNWRAP))
            
            ;; Calculates the ID for the new name to be minted, incrementing the last used ID.
            (id-to-be-minted (+ (var-get bns-mint-counter) u1))
            
            ;; Retrieves a list of all names currently owned by the recipient. Defaults to an empty list if none are found.
            (all-users-names-owned (default-to (list) (map-get? all-user-names send-to)))
        ) 
        ;; Verifies that the caller of the function is the current namespace manager to authorize the registration.
        (asserts! (is-eq contract-caller current-namespace-manager) ERR-NOT-AUTHORIZED)

        ;; Updates the list of all names owned by the recipient to include the new name ID.
        (map-set all-user-names send-to (unwrap! (as-max-len? (append all-users-names-owned id-to-be-minted) u1000) ERR-UNWRAP))

        ;; Conditionally sets the newly minted name as the primary name if the recipient does not already have one.
        (if (is-none (map-get? primary-name send-to)) 
            (map-set primary-name send-to id-to-be-minted)
            false
        )

        ;; Sets properties for the newly registered name including registration time, price, owner, and associated zonefile hash.
        (map-set name-properties
            {
                name: name, namespace: namespace
            } 
            {
                registered-at: (some block-height),
                locked: false,
                renewal-height: (+ (get lifetime namespace-props) block-height),
                price: price,
                owner: send-to,
                zonefile-hash: zonefile
            }
        )

        ;; Links the newly minted ID to the name and namespace combination for reverse lookup.
        (map-set index-to-name id-to-be-minted {name: name, namespace: namespace})

        ;; Links the name and namespace combination to the newly minted ID for forward lookup.
        (map-set name-to-index {name: name, namespace: namespace} id-to-be-minted)

        ;; Mints the new BNS name as an NFT, assigned to the 'send-to' principal.
        (unwrap! (nft-mint? BNS-V2 id-to-be-minted send-to) ERR-UNWRAP)

        ;; Signals successful completion of the registration process.
        (ok true)
    )
)


;; This function transfers the management role of a specific namespace to a new principal.
(define-public (mng-manager-transfer (new-manager principal) (namespace (buff 20)))
    (let 
        (
            ;; Fetches existing properties of the namespace to verify its existence and current management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))

            ;; Extracts the current manager of the namespace from the retrieved properties.
            (current-namespace-manager (unwrap! (get namespace-manager namespace-props) ERR-UNWRAP))
        ) 
        ;; Verifies that the caller of the function is the current namespace manager to authorize the management transfer.
        (asserts! (is-eq contract-caller current-namespace-manager) ERR-NOT-AUTHORIZED)

        ;; If the checks pass, updates the namespace entry with the new manager's principal.
        ;; Retains other properties such as the launched time and the lifetime of names.
        (ok 
            (map-set namespaces namespace 
                {
                    ;; Updates the namespace-manager field to the new manager's principal.
                    namespace-manager: (some new-manager),

                    ;; Retains the existing launch time of the namespace.
                    launched-at: (get launched-at namespace-props),

                    ;; Retains the existing lifetime duration setting for names within the namespace.
                    lifetime: (get lifetime namespace-props),
                }
            )
        )
    )
)


;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Read Only ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

(define-read-only (get-bns-info (name (buff 48)) (namespace (buff 20))) 
    (let 
        (
            (nft-index (unwrap! (map-get? name-to-index {name: name, namespace: namespace}) ERR-NAME-NOT-FOUND))
            (owner (unwrap! (nft-get-owner? BNS-V2 nft-index) ERR-UNWRAP))
        ) 
        (ok 
            {
                owner: owner, id: nft-index
            }
        )
    )
)

;; Fetches the primary BNS name ID set by a specific owner.
(define-read-only (get-primary-name (owner principal))
    ;; Looks up the primary name associated with the given owner's principal in the 'primary-name' map
    (map-get? primary-name owner)
)

;; Retrieves all BNS name IDs owned by a specific principal.
(define-read-only (bns-ids-by-principal (owner principal))
    ;; Accesses the 'all-user-names' map to find all name IDs associated with the given owner's principal.
    (map-get? all-user-names owner)
)

;; Checks whether a specific BNS name is available within a given namespace.
(define-read-only (is-name-available (name (buff 48)) (namespace (buff 20))) 
    (let 
        (
            ;; Fetches properties of the specified namespace to ensure it exists.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Attempts to retrieve the index or ID for the given name within the namespace, expecting failure if no name is found.
            (name-index  (unwrap! (map-get? name-to-index {name: name, namespace: namespace}) ERR-NAME-NOT-FOUND))
            ;; Checks if the name is currently owned by any principal.
            (owner (nft-get-owner? BNS-V2 name-index))
            ;; Gets the name properties
            (name-props (unwrap! (map-get? name-properties {name: name, namespace: namespace}) ERR-UNWRAP))
        )
        (ok 
            {
                available: true,
                renews-at: (get renewal-height name-props),
                price: (get price name-props),
            }
        )
    )
)

;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;
;;;;;; Private ;;;;;
;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;

;; Determines if a character is a digit (0-9).
(define-private (is-digit (char (buff 1)))
    (or 
        ;; Checks if the character is between '0' and '9' using hex values.
        (is-eq char 0x30) ;; 0
        (is-eq char 0x31) ;; 1
        (is-eq char 0x32) ;; 2
        (is-eq char 0x33) ;; 3
        (is-eq char 0x34) ;; 4
        (is-eq char 0x35) ;; 5
        (is-eq char 0x36) ;; 6
        (is-eq char 0x37) ;; 7
        (is-eq char 0x38) ;; 8
        (is-eq char 0x39) ;; 9
    )
) 

;; Checks if a character is a lowercase alphabetic character (a-z).
(define-private (is-lowercase-alpha (char (buff 1)))
    (or 
        ;; Checks for each lowercase letter using hex values.
        (is-eq char 0x61) ;; a
        (is-eq char 0x62) ;; b
        (is-eq char 0x63) ;; c
        (is-eq char 0x64) ;; d
        (is-eq char 0x65) ;; e
        (is-eq char 0x66) ;; f
        (is-eq char 0x67) ;; g
        (is-eq char 0x68) ;; h
        (is-eq char 0x69) ;; i
        (is-eq char 0x6a) ;; j
        (is-eq char 0x6b) ;; k
        (is-eq char 0x6c) ;; l
        (is-eq char 0x6d) ;; m
        (is-eq char 0x6e) ;; n
        (is-eq char 0x6f) ;; o
        (is-eq char 0x70) ;; p
        (is-eq char 0x71) ;; q
        (is-eq char 0x72) ;; r
        (is-eq char 0x73) ;; s
        (is-eq char 0x74) ;; t
        (is-eq char 0x75) ;; u
        (is-eq char 0x76) ;; v
        (is-eq char 0x77) ;; w
        (is-eq char 0x78) ;; x
        (is-eq char 0x79) ;; y
        (is-eq char 0x7a) ;; z
    )
) 

;; Determines if a character is a vowel (a, e, i, o, u, and y).
(define-private (is-vowel (char (buff 1)))
    (or 
        (is-eq char 0x61) ;; a
        (is-eq char 0x65) ;; e
        (is-eq char 0x69) ;; i
        (is-eq char 0x6f) ;; o
        (is-eq char 0x75) ;; u
        (is-eq char 0x79) ;; y
    )
)

;; Identifies if a character is a special character, specifically '-' or '_'.
(define-private (is-special-char (char (buff 1)))
    (or 
        (is-eq char 0x2d) ;; -
        (is-eq char 0x5f)) ;; _
) 

;; Determines if a character is valid within a name, based on allowed character sets.
(define-private (is-char-valid (char (buff 1)))
    (or (is-lowercase-alpha char) (is-digit char) (is-special-char char))
)

;; Checks if a character is non-alphabetic, either a digit or a special character.
(define-private (is-nonalpha (char (buff 1)))
    (or (is-digit char) (is-special-char char))
)

;; Evaluates if a name contains any vowel characters.
(define-private (has-vowels-chars (name (buff 48)))
    (> (len (filter is-vowel name)) u0)
)

;; Determines if a name contains non-alphabetic characters.
(define-private (has-nonalpha-chars (name (buff 48)))
    (> (len (filter is-nonalpha name)) u0)
)

;; Identifies if a name contains any characters that are not considered valid.
(define-private (has-invalid-chars (name (buff 48)))
    (< (len (filter is-char-valid name)) (len name))
)