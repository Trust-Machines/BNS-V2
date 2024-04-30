;; title: BNS-V2
;; version: V-1
;; summary: Updated BNS contract, handles the creation of new namespaces and new names on each namespace
;; description:

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;; traits ;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; Import SIP-09 NFT trait 
(impl-trait .sip-09.nft-trait)

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; Import a custom commission trait for handling commissions for NFT marketplaces functions
(use-trait commission-trait .commission-trait.commission)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Token Definition ;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; Define the non-fungible token (NFT) called BNS-V2 with unique identifiers as unsigned integers
(define-non-fungible-token BNS-V2 uint)

;; To be removed
;; A non-fungible token (NFT) representing a specific name within a namespace.
(define-non-fungible-token names { name: (buff 48), namespace: (buff 20) })

;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Constants ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;
;; New ;;
;;;;;;;;;
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

(define-constant HASH160LEN u20)


;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;
;; Price tables ;;
;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;

;; Defines the price tiers for namespaces based on their lengths.
(define-constant NAMESPACE-PRICE-TIERS (list
    u640000000000
    u64000000000 u64000000000 
    u6400000000 u6400000000 u6400000000 u6400000000 
    u640000000 u640000000 u640000000 u640000000 u640000000 u640000000 u640000000 u640000000 u640000000 u640000000 u640000000 u640000000 u640000000)
)

;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;
;;;; Errors ;;;;
;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;

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
(define-constant ERR-NAMESPACE-PREORDER-LAUNCHABILITY-EXPIRED (err u120))
(define-constant ERR-NAMESPACE-NOT-LAUNCHED (err u121))
(define-constant ERR-NAME-OPERATION-UNAUTHORIZED (err u122))
(define-constant ERR-NAME-NOT-AVAILABLE (err u123))
(define-constant ERR-NAME-NOT-FOUND (err u124))
(define-constant ERR-NAMESPACE-PREORDER-EXPIRED (err u125))
(define-constant ERR-NAMESPACE-UNAVAILABLE (err u126))
(define-constant ERR-NAMESPACE-PRICE-FUNCTION-INVALID (err u127))
(define-constant ERR-NAMESPACE-BLANK (err u128))
(define-constant ERR-NAME-PREORDER-NOT-FOUND (err u129))
(define-constant ERR-NAME-PREORDER-EXPIRED (err u130))
(define-constant ERR-NAME-PREORDER-FUNDS-INSUFFICIENT (err u131))
(define-constant ERR-NAME-UNAVAILABLE (err u132))
(define-constant ERR-NAME-STX-BURNT-INSUFFICIENT (err u133))
(define-constant ERR-NAME-EXPIRED (err u134))
(define-constant ERR-NAME-GRACE-PERIOD (err u135))
(define-constant ERR-NAME-BLANK (err u136))
(define-constant ERR-NAME-ALREADY-CLAIMED (err u137))
(define-constant ERR-NAME-CLAIMABILITY-EXPIRED (err u138))
(define-constant ERR-NAME-REVOKED (err u139))
(define-constant ERR-NAME-TRANSFER-FAILED (err u140))
(define-constant ERR-NAME-PREORDER-ALREADY-EXISTS (err u141))
(define-constant ERR-NAME-HASH-MALFORMED (err u142))
(define-constant ERR-NAME-PREORDERED-BEFORE-NAMESPACE-LAUNCH (err u143))
(define-constant ERR-NAME-NOT-RESOLVABLE (err u144))
(define-constant ERR-NAME-COULD-NOT-BE-MINTED (err u145))
(define-constant ERR-NAME-COULD-NOT-BE-TRANSFERED (err u146))
(define-constant ERR-NAME-CHARSET-INVALID (err u147))
(define-constant ERR-PRINCIPAL-ALREADY-ASSOCIATED (err u148))
(define-constant ERR-PANIC (err u149))
(define-constant ERR-NAMESPACE-HAS-MANAGER (err u150))
(define-constant ERR-OVERFLOW (err u151))
(define-constant ERR-NO-OWNER-FOR-NFT (err u152))
(define-constant ERR-NO-BNS-NAMES-OWNED (err u153))
(define-constant ERR-NO-NAMESPACE-MANAGER (err u154))


;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Variables ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; Counter to keep track of the last minted NFT ID, ensuring unique identifiers
(define-data-var bns-index uint u0)

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; Variable to store the token URI, allowing for metadata association with the NFT
(define-data-var token-uri (string-ascii 246) "")

;; Variable helper to remove an NFT from the list of owned NFTs by a user
(define-data-var uint-helper-to-remove uint u0)

;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;
;;;;;; Maps ;;;;;
;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;

;; Rule 1-1 -> 1 principal, 1 name

;; Maps a principal to the name they own, enforcing a one-to-one relationship between principals and names.
(define-map owner-name principal { name: (buff 48), namespace: (buff 20) })

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; Map to track market listings, associating NFT IDs with price and commission details
(define-map market uint {price: uint, commission: principal})

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; This map tracks the primary name chosen by a user who owns multiple BNS names.
;; It maps a user's principal to the ID of their primary name.
(define-map primary-name principal uint)

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; Tracks all the BNS names owned by a user. Each user is mapped to a list of name IDs.
;; This allows for easy enumeration of all names owned by a particular user.
(define-map bns-ids-by-principal principal (list 1000 uint))


;;;;;;;;;;;;;
;; Updated ;;
;;;;;;;;;;;;;
;; Contains detailed properties of names, including registration and importation times, revocation status, and zonefile hash.
(define-map name-properties
    { name: (buff 48), namespace: (buff 20) }
    {
        registered-at: (optional uint),
        imported-at: (optional uint),
        revoked-at: (optional uint),
        zonefile-hash: (optional (buff 20)),
        locked: bool, 
        renewal-height: uint,
        stx-burn: uint,
        owner: principal,
    }
)

;;;;;;;;;
;; New ;;
;;;;;;;;;
(define-map index-to-name uint 
    {
        name: (buff 48), namespace: (buff 20)
    } 
)

;;;;;;;;;
;; New ;;
;;;;;;;;;
(define-map name-to-index 
    {
        name: (buff 48), namespace: (buff 20)
    } 
    uint
)

;;;;;;;;;;;;;
;; Updated ;;
;;;;;;;;;;;;;
;; Stores properties of namespaces, including their import principals, reveal and launch times, and pricing functions.
(define-map namespaces (buff 20)
    { 
        namespace-manager: (optional principal),
        manager-transferable: bool,
        namespace-import: principal,
        revealed-at: uint,
        launched-at: (optional uint),
        lifetime: uint,
        can-update-price-function: bool,
        price-function: 
            {
                buckets: (list 16 uint),
                base: uint, 
                coeff: uint, 
                nonalpha-discount: uint, 
                no-vowel-discount: uint
            }
    }
)

;; Records namespace preorder transactions with their creation times, claim status, and STX burned.
(define-map namespace-preorders
    { hashed-salted-namespace: (buff 20), buyer: principal }
    { created-at: uint, claimed: bool, stx-burned: uint }
)


;; Tracks preorders for names, including their creation times, claim status, and STX burned.
(define-map name-preorders
    { hashed-salted-fqn: (buff 20), buyer: principal }
    { created-at: uint, claimed: bool, stx-burned: uint }
)

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;; Public ;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; @desc SIP-09 compliant function to transfer a token from one owner to another
;; @param id: the id of the nft being transferred, owner: the principal of the owner of the nft being transferred, recipient: the principal the nft is being transferred to
(define-public (transfer (id uint) (owner principal) (recipient principal))
    (let 
        (
            ;; Attempts to retrieve the name and namespace associated with the given NFT ID. If not found, it returns an error.
            (name-and-namespace (unwrap! (map-get? index-to-name id) ERR-NO-NAME))
            ;; Extracts the namespace part from the retrieved name-and-namespace tuple.
            (namespace (get namespace name-and-namespace))
            ;; Extracts the name part from the retrieved name-and-namespace tuple.
            (name (get name name-and-namespace))
            ;; Fetches properties of the identified namespace to confirm its existence and retrieve management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Extracts the manager of the namespace, if one is set.
            (namespace-manager (get namespace-manager namespace-props))
            ;; Gets the name-props
            (name-props (unwrap! (map-get? name-properties name-and-namespace) ERR-NO-NAME))
            ;; Gets the registered-at value
            (registered-at-value (get registered-at name-props))
            ;; Gets the imported-at value
            (imported-at-value (get imported-at name-props))
            ;; Gets the current owner of the name from the name-props
            (name-current-owner (get owner name-props))
            ;; Revalidate the name current owner
            (nft-current-owner (unwrap! (nft-get-owner? BNS-V2 id) ERR-UNWRAP))
            ;; Gets the currently owned NFTs by the owner
            (all-nfts-owned-by-owner (default-to (list) (map-get? bns-ids-by-principal name-current-owner)))
            ;; Gets the currently owned NFTs by the recipient
            (all-nfts-owned-by-recipient (default-to (list) (map-get? bns-ids-by-principal recipient)))
            ;; Checks if the owner has a primary name
            (owner-primary-name (map-get? primary-name name-current-owner))
            ;; Checks if the recipient has a primary name
            (recipient-primary-name (map-get? primary-name recipient))
        )
        ;; Checks if the name was imported
        (match imported-at-value 
            is-imported 
            ;; If it was imported, then do nothing
            true 
            ;; If it was not imported then it was registered, so check if registered-at is lower than current blockheight
            (asserts! (<= (+ (unwrap! registered-at-value ERR-UNWRAP) u1) block-height) ERR-NAME-OPERATION-UNAUTHORIZED)
        )

        ;; Checks if the namespace is managed.
        (match namespace-manager 
            manager
            ;; If the namespace is managed, performs the transfer under the management's authorization.
            ;; Asserts that the transaction caller is the namespace manager, hence authorized to handle the transfer.
            (begin 
                (asserts! (is-eq contract-caller manager) ERR-NOT-AUTHORIZED)
                ;; Also check if the namespace allows manager transfers
                (asserts! (get manager-transferable namespace-props) ERR-NOT-AUTHORIZED)
            )
            ;; Asserts that the transaction sender is the owner of the NFT to authorize the transfer.
            (asserts! (is-eq tx-sender name-current-owner nft-current-owner) ERR-NOT-AUTHORIZED)
        ) 
        ;; Ensures the NFT is not currently listed in the market, which would block transfers.
        (asserts! (is-none (map-get? market id)) ERR-LISTED)
        ;; Set the helper variable to remove the id being transferred from the list of currently owned nfts by owner
        (var-set uint-helper-to-remove id)
        ;; Updates currently owned names of the owner by removing the id being transferred
        (map-set bns-ids-by-principal name-current-owner (filter is-not-removeable all-nfts-owned-by-owner))
        ;; Updates currently owned names of the recipient by adding the id being transferred
        (map-set bns-ids-by-principal recipient (unwrap! (as-max-len? (append all-nfts-owned-by-recipient id) u1000) ERR-OVERFLOW))
        ;; Updates the primary name of the owner if needed, in the case that the id being transferred is the primary name
        (shift-primary-name id name-current-owner)
        ;; Updates the primary name of the receiver if needed, if the receiver doesn't have a name assign it as primary
        (match recipient-primary-name
            name-match
            ;; If there is a primary name then do nothing
            false
            ;; If no primary name then assign this as the primary name
            (map-set primary-name recipient id)
        )
        ;; Updates the name-props map with the new information, everything stays the same, we only change the zonefile to none for a clean slate and the owner
        (map-set name-properties name-and-namespace (merge name-props {zonefile-hash: none, owner: recipient}))
        ;; Executes the NFT transfer from owner to recipient if all conditions are met.
        (nft-transfer? BNS-V2 id name-current-owner recipient)
    )
)

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; @desc Function to list an NFT for sale
;; @param id: the ID of the NFT in question, price: the price being listed, comm-trait: a principal that conforms to the commission-trait
(define-public (list-in-ustx (id uint) (price uint) (comm-trait <commission-trait>))
    (let
        (
            ;; Attempts to retrieve the name and namespace associated with the given NFT ID. If not found, it returns an error.
            (name-and-namespace (unwrap! (map-get? index-to-name id) ERR-NO-NAME))
            ;; Extracts the namespace part from the retrieved name-and-namespace tuple.
            (namespace (get namespace name-and-namespace))
            ;; Extracts the name part from the retrieved name-and-namespace tuple.
            (name (get name name-and-namespace))
            ;; Fetches properties of the identified namespace to confirm its existence and retrieve management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Extracts the manager of the namespace, if one is set.
            (namespace-manager (get namespace-manager namespace-props))
            ;; Gets the name-props
            (name-props (unwrap! (map-get? name-properties name-and-namespace) ERR-NO-NAME))
            ;; Gets the registered-at value
            (registered-at-value (get registered-at name-props))
            ;; Gets the imported-at value
            (imported-at-value (get imported-at name-props))
            ;; Creates a listing record with price and commission details
            (listing {price: price, commission: (contract-of comm-trait)})
        )
        ;; Checks if the name was imported
        (match imported-at-value 
            is-imported 
            ;; If it was imported, then do nothing
            true 
            ;; If it was not imported then it was registered, so check if registered-at + 1 is lower than current blockheight
            (asserts! (< (unwrap! registered-at-value ERR-UNWRAP) block-height) ERR-NAME-OPERATION-UNAUTHORIZED)
        )
        ;; Check if there is a namespace manager
        (match namespace-manager 
            manager 
            ;; If there is then check that the contract-caller is the manager
            (asserts! (is-eq manager contract-caller) ERR-NOT-AUTHORIZED)
            ;; If there isn't assert that the owner is the tx-sender
            (asserts! (is-eq (some tx-sender) (unwrap! (get-owner id) ERR-UNWRAP)) ERR-NOT-AUTHORIZED)
        )
        
        ;; Updates the market map with the new listing details
        (map-set market id listing)
        ;; Prints listing details
        (ok (print (merge listing {a: "list-in-ustx", id: id})))
    )
)

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; @desc Function to remove an NFT listing from the market
;; @param id: the ID of the NFT in question, price: the price being listed, comm-trait: a principal that conforms to the commission-trait
(define-public (unlist-in-ustx (id uint))
    (let
        (
            ;; Attempts to retrieve the name and namespace associated with the given NFT ID. If not found, it returns an error.
            (name-and-namespace (unwrap! (map-get? index-to-name id) ERR-NO-NAME))
            ;; Attempts to retrieve market map of the name
            (market-map (unwrap! (map-get? market id) ERR-NOT-LISTED))
            ;; Extracts the namespace part from the retrieved name-and-namespace tuple.
            (namespace (get namespace name-and-namespace))
            ;; Extracts the name part from the retrieved name-and-namespace tuple.
            (name (get name name-and-namespace))
            ;; Fetches properties of the identified namespace to confirm its existence and retrieve management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Extracts the manager of the namespace, if one is set.
            (namespace-manager (get namespace-manager namespace-props))
        )
        ;; Check if there is a namespace manager
        (match namespace-manager 
            manager 
            ;; If there is then check that the contract-caller is the manager
            (asserts! (is-eq manager contract-caller) ERR-NOT-AUTHORIZED)
            ;; If there isn't assert that the owner is the tx-sender
            (asserts! (is-eq (some tx-sender) (unwrap! (get-owner id) ERR-UNWRAP)) ERR-NOT-AUTHORIZED)
        )
        ;; Deletes the listing from the market map
        (map-delete market id)
        ;; Prints unlisting details
        (ok (print {a: "unlist-in-ustx", id: id}))
    )
)

;;;;;;;;;
;; New ;;
;;;;;;;;;
;; @desc Function to buy an NFT listed for sale, transferring ownership and handling commission
;; @param id: the ID of the NFT in question, comm-trait: a principal that conforms to the commission-trait for royalty split
(define-public (buy-in-ustx (id uint) (comm-trait <commission-trait>))
    (let
        (
            ;; Retrieves current owner and listing details
            (owner (unwrap! (nft-get-owner? BNS-V2 id) ERR-NO-NAME))
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
        (try! (purchase-transfer id owner tx-sender))
        ;; Removes the listing from the market map
        (map-delete market id)
        ;; Prints purchase details
        (ok (print {a: "buy-in-ustx", id: id}))
    )
)

;; Sets the primary name for the caller to a specific BNS name they own.
(define-public (set-primary-name (primary-name-id uint))
    (let 
        (
            ;; Retrieves the owner of the specified name ID
            (owner (unwrap! (nft-get-owner? BNS-V2 primary-name-id) ERR-NO-NAME))
            ;; Retrieves the current primary name for the caller, to check if an update is necessary. This should never cause an error unless the user doesn't own any BNS names
            (current-primary-name (unwrap! (map-get? primary-name tx-sender) ERR-NO-BNS-NAMES-OWNED))
            ;; Retrieves the name and namespace from the uint/index
            (name-and-namespace (unwrap! (map-get? index-to-name primary-name-id) ERR-NO-NAME))
        ) 
        ;; Verifies that the caller (`tx-sender`) is indeed the owner of the name they wish to set as primary.
        (asserts! (is-eq owner tx-sender) ERR-NOT-AUTHORIZED)
        ;; Ensures the new primary name is different from the current one to avoid redundant updates.
        (asserts! (not (is-eq primary-name-id current-primary-name)) ERR-ALREADY-PRIMARY-NAME)
        ;; Updates the mapping of the caller's principal to the new primary name ID.
        (map-set primary-name tx-sender primary-name-id)
        ;; Returns 'true' upon successful execution of the function.
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
            (current-namespace-manager (unwrap! (get namespace-manager namespace-props) ERR-NO-NAMESPACE-MANAGER))
            ;; Retrieves the current owner of the NFT, necessary to authorize the burn operation.
            (current-name-owner (unwrap! (nft-get-owner? BNS-V2 id) ERR-UNWRAP))
            ;; Gets the currently owned NFTs by the owner
            (all-nfts-owned-by-owner (default-to (list) (map-get? bns-ids-by-principal current-name-owner)))
            ;; Get if it is listed
            (is-listed (map-get? market id))
            ;; Checks if the owner has a primary name
            (owner-primary-name (map-get? primary-name current-name-owner))
        ) 
        ;; Ensures that the function caller is the current namespace manager, providing the authority to perform the burn.
        (asserts! (is-eq contract-caller current-namespace-manager) ERR-NOT-AUTHORIZED)
        ;; Check if the nft is listed 
        (match is-listed
            listed
            ;; If it is listed then unlist
            (unwrap! (unlist-in-ustx id) ERR-UNWRAP)
            {a: "not-listed", id: id}
        )
        ;; Set the helper variable to remove the id being burned from the list of currently owned nfts by owner
        (var-set uint-helper-to-remove id)
        ;; Updates currently owned names of the owner by removing the id being burned
        (map-set bns-ids-by-principal current-name-owner (filter is-not-removeable all-nfts-owned-by-owner))
        ;; Deletes the maps
        (map-delete name-properties name-and-namespace)
        (map-delete index-to-name id)
        (map-delete name-to-index name-and-namespace)
        ;; Checks if the id being burned is the primary name of the owner
        ;; Updates the primary name of the owner if needed, in the case that the id being burned is the primary name
        (shift-primary-name id current-name-owner)
        ;; Executes the burn operation for the specified NFT, effectively removing it from circulation.
        (nft-burn? BNS-V2 id current-name-owner)
    )
)

;; This function transfers the management role of a specific namespace to a new principal.
(define-public (mng-manager-transfer (new-manager principal) (namespace (buff 20)))
    (let 
        (
            ;; Fetches existing properties of the namespace to verify its existence and current management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))

            ;; Extracts the current manager of the namespace from the retrieved properties.
            (current-namespace-manager (unwrap! (get namespace-manager namespace-props) ERR-NO-NAMESPACE-MANAGER))
        ) 
        ;; Verifies that the caller of the function is the current namespace manager to authorize the management transfer.
        (asserts! (is-eq contract-caller current-namespace-manager) ERR-NOT-AUTHORIZED)

        ;; If the checks pass, updates the namespace entry with the new manager's principal.
        ;; Retains other properties such as the launched time and the lifetime of names.
        (ok 
            (map-set namespaces namespace 
                (merge 
                    namespace-props 
                    {
                        ;; Updates the namespace-manager field to the new manager's principal.
                        namespace-manager: (some new-manager),
                        namespace-import: new-manager,
                    }
                )
                
            )
        )
    )
)

;;;; NAMESPACES
;; NAMESPACE-PREORDER
;; This step registers the salted hash of the namespace with BNS nodes, and burns the requisite amount of cryptocurrency.
;; Additionally, this step proves to the BNS nodes that user has honored the BNS consensus rules by including a recent
;; consensus hash in the transaction.
;; Returns pre-order's expiration date (in blocks).

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
            (match former-preorder
                preorder 
                ;; If a previous preorder exists, check that it has expired based on the NAMESPACE-PREORDER-CLAIMABILITY-TTL.
                (>= block-height (+ NAMESPACE-PREORDER-CLAIMABILITY-TTL (unwrap! (get created-at former-preorder) ERR-NAMESPACE-PREORDER-ALREADY-EXISTS))) 
                ;; Proceed if no previous preorder exists.
                true 
            ) 
            ERR-NAMESPACE-PREORDER-ALREADY-EXISTS
        )
        ;; Validate that the hashed-salted-namespace is exactly 20 bytes long to conform to expected hash standards.
        (asserts! (is-eq (len hashed-salted-namespace) HASH160LEN) ERR-NAMESPACE-HASH-MALFORMED)
        ;; Confirm that the STX amount to be burned is positive
        (asserts! (> stx-to-burn u0) ERR-NAMESPACE-STX-BURNT-INSUFFICIENT)
        ;; Execute the token burn operation, deducting the specified STX amount from the buyer's balance.
        (unwrap! (stx-burn? stx-to-burn tx-sender) ERR-INSUFFICIENT-FUNDS)
        ;; Record the preorder details in the `namespace-preorders` map, marking it as not yet claimed.
        (map-set namespace-preorders
            { hashed-salted-namespace: hashed-salted-namespace, buyer: tx-sender }
            { created-at: block-height, claimed: false, stx-burned: stx-to-burn }
        )
        ;; Return the block height at which the preorder claimability expires, based on the NAMESPACE-PREORDER-CLAIMABILITY-TTL.
        (ok (+ block-height NAMESPACE-PREORDER-CLAIMABILITY-TTL))
    )
)

;; NAMESPACE-REVEAL
;; This second step reveals the salt and the namespace ID (pairing it with its NAMESPACE-PREORDER). It reveals how long
;; names last in this namespace before they expire or must be renewed, and it sets a price function for the namespace
;; that determines how cheap or expensive names its will be.

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
(define-public (namespace-reveal (namespace (buff 20)) (namespace-salt (buff 20)) (transfers bool) (p-func-base uint) (p-func-coeff uint) (p-func-b1 uint) (p-func-b2 uint) (p-func-b3 uint) (p-func-b4 uint) (p-func-b5 uint) (p-func-b6 uint) (p-func-b7 uint) (p-func-b8 uint) (p-func-b9 uint) (p-func-b10 uint) (p-func-b11 uint) (p-func-b12 uint) (p-func-b13 uint) (p-func-b14 uint) (p-func-b15 uint) (p-func-b16 uint) (p-func-non-alpha-discount uint) (p-func-no-vowel-discount uint) (lifetime uint) (namespace-import principal) (namespace-manager (optional principal)))
    ;; The salt and namespace must hash to a preorder entry in the `namespace-preorders` table.
    ;; The sender must match the principal in the preorder entry (implied)
    (let 
        (
            ;; Generate the hashed, salted namespace identifier to match with its preorder.
            (hashed-salted-namespace (hash160 (concat namespace namespace-salt)))
            ;; Define the price function based on the provided parameters.
            (price-function  
                {
                    buckets: (list p-func-b1 p-func-b2 p-func-b3 p-func-b4 p-func-b5 p-func-b6 p-func-b7 p-func-b8 p-func-b9 p-func-b10 p-func-b11 p-func-b12 p-func-b13 p-func-b14 p-func-b15 p-func-b16),
                    base: p-func-base,
                    coeff: p-func-coeff,
                    nonalpha-discount: p-func-non-alpha-discount,
                    no-vowel-discount: p-func-no-vowel-discount
                }
            )
            ;; Retrieve the preorder record to ensure it exists and is valid for the revealing namespace.
            (preorder (unwrap! (map-get? namespace-preorders { hashed-salted-namespace: hashed-salted-namespace, buyer: tx-sender }) ERR-NAMESPACE-PREORDER-NOT-FOUND))
            ;; Calculate the namespace's registration price for validation. Using the price tiers in the NAMESPACE-PRICE-TIERS
            (namespace-price (try! (get-namespace-price namespace)))
            ;; Get the namespace props to see if it already exists
            (namespace-props (map-get? namespaces namespace))
        )
        ;; Ensure the namespace consists of valid characters only.
        (asserts! (not (has-invalid-chars namespace)) ERR-NAMESPACE-CHARSET-INVALID)
        ;; Check that the namespace is available for reveal (not already existing or expired).
        (asserts! (is-none namespace-props) ERR-NAMESPACE-ALREADY-EXISTS)
        ;; Verify the burned amount during preorder meets or exceeds the namespace's registration price.
        (asserts! (>= (get stx-burned preorder) namespace-price) ERR-NAMESPACE-STX-BURNT-INSUFFICIENT)
        ;; Confirm the reveal action is performed within the allowed timeframe from the preorder.
        (asserts! (< block-height (+ (get created-at preorder) NAMESPACE-PREORDER-CLAIMABILITY-TTL)) ERR-NAMESPACE-PREORDER-CLAIMABILITY-EXPIRED)
        ;; Mark the preorder as claimed to prevent reuse.
        (map-set namespace-preorders
            { hashed-salted-namespace: hashed-salted-namespace, buyer: tx-sender }
            { created-at: (get created-at preorder), claimed: true, stx-burned: (get stx-burned preorder) }
        )
        ;; Check if the namespace manager is assigned
        (if (is-none namespace-manager) 
        ;; If it is then assign everything
            (map-set namespaces namespace
                {
                    ;; Added manager here
                    namespace-manager: namespace-manager,
                    manager-transferable: transfers,
                    namespace-import: namespace-import,
                    revealed-at: block-height,
                    launched-at: none,
                    lifetime: lifetime,
                    can-update-price-function: true,
                    price-function: price-function 
                }
            )
            ;; If it is not, then assign everything except the lifetime, that is set to u0 sinces renewals will be made in the namespace manager contract and set the can update price function to false, since no changes will ever need to be made there
            (map-set namespaces namespace
            {
                ;; Added manager here
                namespace-manager: namespace-manager,
                manager-transferable: transfers,
                namespace-import: namespace-import,
                revealed-at: block-height,
                launched-at: none,
                lifetime: u0,
                can-update-price-function: false,
                price-function: price-function 
            }
        )
        )
        
        ;; Confirm successful reveal of the namespace
        (ok true)
    )
)

;; NAMESPACE-READY
;; The final step of the process launches the namespace and makes the namespace available to the public. Once a namespace
;; is launched, anyone can register a name in it if they pay the appropriate amount of cryptocurrency.

;; Public function `namespace-ready` marks a namespace as launched and available for public name registrations.
;; This is the final step in the namespace creation process, opening up the namespace for anyone to register names in it.
;; @params:
    ;; namespace (buff 20): The namespace to be launched and made available for public registrations.
(define-public (namespace-ready (namespace (buff 20)))
    (let 
        (
            ;; Retrieve the properties of the namespace to ensure it exists and to check its current state.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
        )
        ;; Ensure the transaction sender is the namespace's designated import principal, confirming their authority to launch it.
        (asserts! (is-eq (get namespace-import namespace-props) tx-sender) ERR-NAMESPACE-OPERATION-UNAUTHORIZED)
        ;; Verify the namespace has not already been launched to prevent re-launching.
        (asserts! (is-none (get launched-at namespace-props)) ERR-NAMESPACE-ALREADY-LAUNCHED)
        ;; Confirm that the action is taken within the permissible time frame since the namespace was revealed.
        (asserts! (< block-height (+ (get revealed-at namespace-props) NAMESPACE-LAUNCHABILITY-TTL)) ERR-NAMESPACE-PREORDER-LAUNCHABILITY-EXPIRED)      
        (let 
            (
                ;; Update the namespace properties to include the launch timestamp, effectively marking it as "launched".
                (namespace-props-updated (merge namespace-props { launched-at: (some block-height) }))
            )
            ;; Update the `namespaces` map with the newly launched status of the namespace.
            (map-set namespaces namespace namespace-props-updated)
            ;; Emit an event to indicate the namespace is now ready and launched.
            (print { namespace: namespace, status: "ready", properties: namespace-props-updated })
            ;; Confirm the successful launch of the namespace.
            (ok true)
        )
    )
)

;; NAME-IMPORT
;; Once a namespace is revealed, the user has the option to populate it with a set of names. Each imported name is given
;; both an owner and some off-chain state. This step is optional; Namespace creators are not required to import names.

;; Public function `name-import` allows the insertion of names into a namespace that has been revealed but not yet launched.
;; This facilitates pre-populating the namespace with specific names, assigning owners and zone file hashes to them.
;; @params:
    ;; namespace (buff 20): The namespace into which the name is being imported.
    ;; name (buff 48): The name being imported into the namespace.
    ;; beneficiary (principal): The principal who will own the imported name.
    ;; zonefile-hash (buff 20): The hash of the zone file associated with the imported name.
(define-public (name-import (namespace (buff 20)) (name (buff 48)) (beneficiary principal) (zonefile-hash (buff 20)) (stx-burn uint))
    (let 
        (
            ;; Fetch properties of the specified namespace to ensure it exists and to check its current state.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Fetch the latest index to mint
            (current-mint (+ (var-get bns-index) u1))
            ;; Fetch the primary name of the beneficiary
            (beneficiary-primary-name (map-get? primary-name beneficiary))
            ;; Fetch names owned by the beneficiary
            (all-users-names-owned (default-to (list) (map-get? bns-ids-by-principal beneficiary)))
        )
        ;; Verify that the name contains only valid characters to ensure compliance with naming conventions.
        (asserts! (not (has-invalid-chars name)) ERR-NAME-CHARSET-INVALID)
        ;; Ensure the transaction sender is the namespace's designated import principal, confirming their authority to import names.
        (asserts! (is-eq (get namespace-import namespace-props) tx-sender) ERR-NAMESPACE-OPERATION-UNAUTHORIZED)
        ;; Check that the namespace has not been launched yet, as names can only be imported to namespaces that are revealed but not launched.
        (asserts! (is-none (get launched-at namespace-props)) ERR-NAMESPACE-ALREADY-LAUNCHED)
        ;; Confirm that the import is occurring within the allowed timeframe since the namespace was revealed.
        (asserts! (< block-height (+ (get revealed-at namespace-props) NAMESPACE-LAUNCHABILITY-TTL)) ERR-NAMESPACE-PREORDER-LAUNCHABILITY-EXPIRED)
        ;; Check if beneficiary has primary-name
        (match beneficiary-primary-name
            primary
            ;; if it does then do nothing
            false
            ;; If not, then set this as primary name
            (map-set primary-name beneficiary current-mint)
        )
        ;; Add the name into the all-users-name map
        (map-set bns-ids-by-principal beneficiary (unwrap! (as-max-len? (append all-users-names-owned current-mint) u1000) ERR-OVERFLOW))
        ;; Set the name properties
        (map-set name-properties {name: name, namespace: namespace}
            {
                registered-at: none,
                imported-at: (some block-height),
                revoked-at: none,
                zonefile-hash: (some zonefile-hash),
                locked: false,
                renewal-height: (+ (get lifetime namespace-props) block-height),
                stx-burn: stx-burn,
                owner: beneficiary,
            }
        )
        ;; Set the map index-to-name
        (map-set index-to-name current-mint {name: name, namespace: namespace})
        ;; Set the map name-to-index
        (map-set name-to-index {name: name, namespace: namespace} current-mint)
        ;; Update the index of the minting
        (var-set bns-index current-mint)
         ;; Mint the name to the beneficiary
        (unwrap! (nft-mint? BNS-V2 current-mint beneficiary) ERR-NAME-COULD-NOT-BE-MINTED)
        ;; Confirm successful import of the name.
        (ok true)
    )
)

;; NAMESPACE-UPDATE-FUNCTION-PRICE
;; Public function `namespace-update-function-price` updates the pricing function for a specific namespace.
;; This allows changing how the cost of registering names within the namespace is calculated.
;; @params:
    ;; namespace (buff 20): The namespace for which the price function is being updated.
    ;; p-func-base (uint): The base price used in the pricing function.
    ;; p-func-coeff (uint): The coefficient used in the pricing function.
    ;; p-func-b1 to p-func-b16 (uint): The bucket-specific multipliers for the pricing function.
    ;; p-func-non-alpha-discount (uint): The discount applied for non-alphabetic characters.
    ;; p-func-no-vowel-discount (uint): The discount applied when no vowels are present.
(define-public (namespace-update-function-price (namespace (buff 20)) (p-func-base uint) (p-func-coeff uint) (p-func-b1 uint) (p-func-b2 uint) (p-func-b3 uint) (p-func-b4 uint) (p-func-b5 uint) (p-func-b6 uint) (p-func-b7 uint) (p-func-b8 uint) (p-func-b9 uint) (p-func-b10 uint) (p-func-b11 uint) (p-func-b12 uint) (p-func-b13 uint) (p-func-b14 uint) (p-func-b15 uint) (p-func-b16 uint) (p-func-non-alpha-discount uint) (p-func-no-vowel-discount uint))
    (let 
        (
            ;; Retrieve the current properties of the namespace to ensure it exists and fetch its current price function.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Construct the new price function based on the provided parameters.
            (price-function 
                {
                    buckets: (list p-func-b1 p-func-b2 p-func-b3 p-func-b4 p-func-b5 p-func-b6 p-func-b7 p-func-b8 p-func-b9 p-func-b10 p-func-b11 p-func-b12 p-func-b13 p-func-b14 p-func-b15 p-func-b16),
                    base: p-func-base,
                    coeff: p-func-coeff,
                    nonalpha-discount: p-func-non-alpha-discount,
                    no-vowel-discount: p-func-no-vowel-discount
                }
            )
        )
        ;; Ensure that the transaction sender is the namespace's designated import principal.
        (asserts! (is-eq (get namespace-import namespace-props) tx-sender) ERR-NAMESPACE-OPERATION-UNAUTHORIZED)
        ;; Verify that the namespace's price function is still allowed to be updated.
        (asserts! (get can-update-price-function namespace-props) ERR-NAMESPACE-OPERATION-UNAUTHORIZED)
        ;; Update the namespace's record in the `namespaces` map with the new price function.
        (map-set namespaces namespace (merge namespace-props { price-function: price-function }))
        ;; Confirm the successful update of the price function.
        (ok true)
    )
)

;; NAMESPACE-REVOKE-PRICE-EDITION
;; Public function `namespace-revoke-function-price-edition` disables the ability to update the price function for a given namespace.
;; This is a finalizing action ensuring that the price for registering names within the namespace cannot be altered once set.
;; @params:
    ;; namespace (buff 20): The target namespace for which the price function update capability is being revoked.
(define-public (namespace-revoke-function-price-edition (namespace (buff 20)))
    (let 
        (
            ;; Retrieve the properties of the specified namespace to verify its existence and fetch its current settings.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
        )
        ;; Ensure that the transaction sender is the same as the namespace's designated import principal.
        ;; This check ensures that only the owner or controller of the namespace can revoke the price function update capability.
        (asserts! (is-eq (get namespace-import namespace-props) tx-sender) ERR-NAMESPACE-OPERATION-UNAUTHORIZED)
        ;; Update the namespace properties in the `namespaces` map, setting `can-update-price-function` to false.
        ;; This action effectively locks the price function, preventing any future changes.
        (map-set namespaces namespace 
            (merge namespace-props { can-update-price-function: false })
        )
        ;; Return a success confirmation, indicating the price function update capability has been successfully revoked.
        (ok true)
    )
)

;; NEW FAST MINT
;; A 'fast' one-block registration function: (name-claim-fast)
(define-public (name-claim-fast (name (buff 48)) (namespace (buff 20)) (zonefile-hash (buff 20)) (stx-burn uint) (send-to principal)) 
    (let 
        (
            ;; Retrieves existing properties of the namespace to confirm its existence and management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Extracts the current manager of the namespace to verify the authority of the caller.
            (current-namespace-manager (get namespace-manager namespace-props))
            ;; Calculates the ID for the new name to be minted, incrementing the last used ID.
            (id-to-be-minted (+ (var-get bns-index) u1))
            ;; Retrieves a list of all names currently owned by the recipient. Defaults to an empty list if none are found.
            (all-users-names-owned (default-to (list) (map-get? bns-ids-by-principal send-to)))
            ;; Tries to retrieve the name and namespace to see if it already exists
            (name-props (map-get? name-properties {name: name, namespace: namespace}))
        ) 
        ;; Checks if that name already exists for the namespace if it does, then don't mint
        (asserts! (is-none name-props) ERR-NAME-ALREADY-CLAIMED)
        ;; Verifies if the namespace has a manager
        (match current-namespace-manager 
            manager 
            ;; If it does
            (asserts! (is-eq contract-caller manager) ERR-NOT-AUTHORIZED)
           
            ;; If it doesn't
            (begin 
                ;; Asserts tx-sender is the send-to
                (asserts! (is-eq tx-sender send-to) ERR-NOT-AUTHORIZED)
                ;; Burns the STX from the user
                (unwrap! (stx-burn? stx-burn send-to) ERR-INSUFFICIENT-FUNDS)
                ;; Confirms that the amount of STX burned with the preorder is sufficient for the name registration based on a computed price.
                (asserts! (>= stx-burn (compute-name-price name (get price-function namespace-props))) ERR-NAME-STX-BURNT-INSUFFICIENT)
            )
        )
        ;; Updates the list of all names owned by the recipient to include the new name ID.
        (map-set bns-ids-by-principal send-to (unwrap! (as-max-len? (append all-users-names-owned id-to-be-minted) u1000) ERR-UNWRAP))
        ;; Set the index 
        (var-set bns-index id-to-be-minted)
        ;; Conditionally sets the newly minted name as the primary name if the recipient does not already have one.
        (match (map-get? primary-name send-to) 
            receiver
            false
            (map-set primary-name send-to id-to-be-minted)
        )
        ;; Sets properties for the newly registered name including registration time, price, owner, and associated zonefile hash.
        (map-set name-properties
            {
                name: name, namespace: namespace
            } 
            {
               
                registered-at: (some (+ block-height u1)),
                imported-at: none,
                revoked-at: none,
                zonefile-hash: (some zonefile-hash),
                locked: false,
                renewal-height: (+ (get lifetime namespace-props) block-height),
                stx-burn: stx-burn,
                owner: send-to,
            }
        )
        ;; Links the newly minted ID to the name and namespace combination for reverse lookup.
        (map-set index-to-name id-to-be-minted {name: name, namespace: namespace})
        ;; Links the name and namespace combination to the newly minted ID for forward lookup.
        (map-set name-to-index {name: name, namespace: namespace} id-to-be-minted)
        ;; Mints the new BNS name as an NFT, assigned to the 'send-to' principal.
        (unwrap! (nft-mint? BNS-V2 id-to-be-minted send-to) ERR-NAME-COULD-NOT-BE-MINTED)
        ;; Signals successful completion of the registration process.
        (ok true)
    )
)

;; Defines a public function called `name-preorder`.
;; This function is responsible for preordering BNS name by burning the registration fee and submitting the salted hash of the name with the namesace included.
;; This function is callable by ANYONE, regular users or namespace managers, the real check happens in the name-register function. Only regular users who preorder a name through this function should be able to mint a name trough the register-name function
(define-public (name-preorder (hashed-salted-fqn (buff 20)) (stx-to-burn uint))
    (let 
        (
            ;; Attempt to retrieve a previous preorder from the 'name-preorders' map using the hashed-salted FQN and the tx-sender's address as keys.
            ;; This checks if the same user has already preordered the same name.
            (former-preorder (map-get? name-preorders { hashed-salted-fqn: hashed-salted-fqn, buyer: tx-sender }))
        )
        ;; Checks if there was a previous preorder and if it has expired.
        (asserts! 
            (match former-preorder
                preorder
                ;; Checks if the current block height is greater than or equal to the creation time of the previous preorder plus the TTL.
                ;; This determines if the previous preorder has expired.
                (>= block-height (+ NAME-PREORDER-CLAIMABILITY-TTL (unwrap! (get created-at former-preorder) ERR-UNWRAP)))
                ;; If no previous preorder is found, then true, allowing the process to continue.
                true
            )
            ;; If a previous preorder is still valid/not expired, return an error indicating that a duplicate active preorder exists.
            ERR-NAME-PREORDER-ALREADY-EXISTS
        )
        ;; Validates that the length of the hashed and salted FQN is exactly 20 bytes.
        ;; This ensures that the input conforms to the expected hash format.
        (asserts! (is-eq (len hashed-salted-fqn) HASH160LEN) ERR-NAME-HASH-MALFORMED)
        ;; Ensures that the amount of STX specified to burn is greater than zero.
        (asserts! (> stx-to-burn u0) ERR-NAME-STX-BURNT-INSUFFICIENT)
        ;; Burns the specified amount of STX tokens from the tx-sender
        ;; This operation fails if the sender does not have enough tokens, returns an insufficient funds error.
        (unwrap! (stx-burn? stx-to-burn tx-sender) ERR-INSUFFICIENT-FUNDS)
        ;; Records the preorder in the 'name-preorders' map.
        ;; It includes the hashed-salted FQN, the tx-sender as the buyer, the current block height, the amount of STX burned, and marks the preorder as not yet claimed.
        (map-set name-preorders
            { hashed-salted-fqn: hashed-salted-fqn, buyer: tx-sender }
            { created-at: block-height, stx-burned: stx-to-burn, claimed: false }
        )
        ;; Returns the block height at which the preorder's claimability period will expire.
        ;; This is calculated by adding the NAME-PREORDER-CLAIMABILITY-TTL to the current block height.
        (ok (+ block-height NAME-PREORDER-CLAIMABILITY-TTL))
    )
)

;; Defines a public function `name-register` that finalizes the registration of a BNS name.
;; This function uses provided details to verify the preorder, register the name, and assign it initial properties.
;; This should only allow users from UNMANAGED namespaces to register names
(define-public (name-register (namespace (buff 20)) (name (buff 48)) (salt (buff 20)) (zonefile-hash (buff 20)))
    (let 
        (
            ;; Generates the hashed, salted fully-qualified name by concatenating the name, namespace, and salt, then applying a hash160 function.
            (hashed-salted-fqn (hash160 (concat (concat (concat name 0x2e) namespace) salt)))
            ;; Retrieves the preorder details from the `name-preorders` map using the hashed-salted FQN to ensure the preorder exists and belongs to the tx-sender.
            (preorder (unwrap! (map-get? name-preorders { hashed-salted-fqn: hashed-salted-fqn, buyer: tx-sender }) ERR-NAME-PREORDER-NOT-FOUND))
            ;; Retrieves the properties of the namespace to confirm its existence and check its management settings.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Extracts the current manager of the namespace to ensure only authorized actions are performed.
            (current-namespace-manager (get namespace-manager namespace-props))
            ;; Generates a new ID for the name to be registered, incrementing the last used ID in the BNS system.
            (id-to-be-minted (+ (var-get bns-index) u1))
            ;; Retrieves a list of all names currently owned by the tx-sender, defaults to an empty list if none exist.
            (all-users-names-owned (default-to (list) (map-get? bns-ids-by-principal tx-sender)))
            ;; Checks if the name and namespace combination already exists in the system.
            (name-props (map-get? name-properties {name: name, namespace: namespace}))
            ;; Retrieves the index of the name if it exists, to check for prior registrations.
            (name-index (map-get? name-to-index {name: name, namespace: namespace}))
        )
        ;; Ensures that the namespace does not have a manager.
        (asserts! (is-none current-namespace-manager) ERR-NOT-AUTHORIZED)
        ;; Ensure the name is available
        (asserts! (is-none name-index) ERR-NAME-UNAVAILABLE)
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        ;; ;; Check if the name is-none 
        ;; (match name-index 
        ;;     name-exists
        ;;     ;; If the name exists then do name-renewal
        ;;     (unwrap! (name-renewal namespace name (unwrap! (get stx-burn name-props) ERR-UNWRAP) (some zonefile-hash)) ERR-UNWRAP)
        ;;     ;; If the name does not exist, then do everything as it is right now
        ;;     (begin
        ;;         ;; Validates that the preorder was made after the namespace was officially launched.
        ;;         (asserts! (> (get created-at preorder) (unwrap-panic (get launched-at namespace-props))) ERR-NAME-PREORDERED-BEFORE-NAMESPACE-LAUNCH)
        ;;         ;; Checks that the preorder has not already been claimed to avoid duplicate name registrations.
        ;;         ;; I think we can remove this... since it already checks for a name
        ;;         (asserts! (is-eq (get claimed preorder) false) ERR-NAME-ALREADY-CLAIMED)
        ;;         ;; Verifies the registration is completed within the claimability period defined by the NAME-PREORDER-CLAIMABILITY-TTL.
        ;;         (asserts! (< block-height (+ (get created-at preorder) NAME-PREORDER-CLAIMABILITY-TTL)) ERR-NAME-CLAIMABILITY-EXPIRED)
        ;;         ;; Confirms that the amount of STX burned with the preorder is sufficient for the name registration based on a computed price.
        ;;         (asserts! (>= (get stx-burned preorder) (compute-name-price name (get price-function namespace-props))) ERR-NAME-STX-BURNT-INSUFFICIENT)
        ;;         ;; Updates the list of names owned by the recipient to include the new name ID.
        ;;         (map-set bns-ids-by-principal tx-sender (unwrap! (as-max-len? (append all-users-names-owned id-to-be-minted) u1000) ERR-UNWRAP))
        ;;         ;; Sets the newly registered name as the primary name for the recipient if they do not already have one.
        ;;         (match (map-get? primary-name tx-sender) 
        ;;             receiver
        ;;             ;; If it has a primary-name then do nothing
        ;;             false
        ;;             ;; If it is none, then assign the ID being minted as the primary-name
        ;;             (map-set primary-name tx-sender id-to-be-minted)
        ;;         )
        ;;         ;; Sets properties for the newly registered name including registration time, price, owner, and associated zonefile hash.
        ;;         (map-set name-properties
        ;;             {
        ;;                 name: name, namespace: namespace
        ;;             } 
        ;;             {
        ;;                 registered-at: (some block-height),
        ;;                 imported-at: none,
        ;;                 revoked-at: none,
        ;;                 zonefile-hash: (some zonefile-hash),
        ;;                 locked: false,
        ;;                 renewal-height: (+ (get lifetime namespace-props) block-height),
        ;;                 stx-burn: (get stx-burned preorder),
        ;;                 owner: tx-sender,
        ;;             }
        ;;         )
        ;;         ;; Updates the preorder to mark it as claimed.
        ;;         (map-set name-preorders { hashed-salted-fqn: hashed-salted-fqn, buyer: tx-sender } 
        ;;             (merge 
        ;;                 preorder 
        ;;                 {claimed: true}
        ;;             )
        ;;         )
        ;;         ;; Links the new ID to the name and namespace.
        ;;         (map-set index-to-name id-to-be-minted {name: name, namespace: namespace})
        ;;         ;; Links the name and namespace to the new ID.
        ;;         (map-set name-to-index {name: name, namespace: namespace} id-to-be-minted)
        ;;         ;; Updates the BNS-index var
        ;;         (var-set bns-index id-to-be-minted)
        ;;         ;; Mints the BNS name as an NFT and assigns it to the tx sender.
        ;;         (unwrap! (nft-mint? BNS-V2 id-to-be-minted tx-sender) ERR-NAME-COULD-NOT-BE-MINTED)
        ;;     )
        ;; )
        ;; Validates that the preorder was made after the namespace was officially launched.
        (asserts! (> (get created-at preorder) (unwrap-panic (get launched-at namespace-props))) ERR-NAME-PREORDERED-BEFORE-NAMESPACE-LAUNCH)
        ;; Checks that the preorder has not already been claimed to avoid duplicate name registrations.
        ;; I think we can remove this... since it already checks for a name
        (asserts! (is-eq (get claimed preorder) false) ERR-NAME-ALREADY-CLAIMED)
        ;; Verifies the registration is completed within the claimability period defined by the NAME-PREORDER-CLAIMABILITY-TTL.
        (asserts! (< block-height (+ (get created-at preorder) NAME-PREORDER-CLAIMABILITY-TTL)) ERR-NAME-CLAIMABILITY-EXPIRED)
        ;; Confirms that the amount of STX burned with the preorder is sufficient for the name registration based on a computed price.
        (asserts! (>= (get stx-burned preorder) (compute-name-price name (get price-function namespace-props))) ERR-NAME-STX-BURNT-INSUFFICIENT)
        ;; Updates the list of names owned by the recipient to include the new name ID.
        (map-set bns-ids-by-principal tx-sender (unwrap! (as-max-len? (append all-users-names-owned id-to-be-minted) u1000) ERR-UNWRAP))
        ;; Sets the newly registered name as the primary name for the recipient if they do not already have one.
        (match (map-get? primary-name tx-sender) 
            receiver
            ;; If it has a primary-name then do nothing
            false
            ;; If it is none, then assign the ID being minted as the primary-name
            (map-set primary-name tx-sender id-to-be-minted)
        )
        ;; Sets properties for the newly registered name including registration time, price, owner, and associated zonefile hash.
        (map-set name-properties
            {
                name: name, namespace: namespace
            } 
            {
                registered-at: (some block-height),
                imported-at: none,
                revoked-at: none,
                zonefile-hash: (some zonefile-hash),
                locked: false,
                renewal-height: (+ (get lifetime namespace-props) block-height),
                stx-burn: (get stx-burned preorder),
                owner: tx-sender,
            }
        )
        ;; Updates the preorder to mark it as claimed.
        (map-set name-preorders { hashed-salted-fqn: hashed-salted-fqn, buyer: tx-sender } 
            (merge 
                preorder 
                {claimed: true}
            )
        )
        ;; Links the new ID to the name and namespace.
        (map-set index-to-name id-to-be-minted {name: name, namespace: namespace})
        ;; Links the name and namespace to the new ID.
        (map-set name-to-index {name: name, namespace: namespace} id-to-be-minted)
        ;; Updates the BNS-index var
        (var-set bns-index id-to-be-minted)
        ;; Mints the BNS name as an NFT and assigns it to the tx sender.
        (unwrap! (nft-mint? BNS-V2 id-to-be-minted tx-sender) ERR-NAME-COULD-NOT-BE-MINTED)
        ;; Confirms successful registration of the name.
        (ok true)
    )
)


;; Defines a public function called `mng-name-preorder`.
;; This function is similar to `name-preorder` but only for namespace managers, without the burning of STX tokens.
;; This function is intended only for managers, but in reality anyone can call this, but the mng-name-register and name-register will validate everything
(define-public (mng-name-preorder (hashed-salted-fqn (buff 20)))
    (let 
        (
            ;; Attempt to retrieve a previous preorder from the 'name-preorders' map using the hashed-salted FQN and the contract-caller address as keys.
            ;; This checks if the same user has already preordered the same name.
            (former-preorder (map-get? name-preorders { hashed-salted-fqn: hashed-salted-fqn, buyer: contract-caller }))
        )
        ;; Checks if there was a previous preorder and if it has expired.
        (asserts! 
            (match former-preorder
                preorder
                ;; Checks if the current block height is greater than or equal to the creation time of the previous preorder plus the TTL.
                ;; This determines if the previous preorder has expired.
                (>= block-height (+ NAME-PREORDER-CLAIMABILITY-TTL (unwrap! (get created-at former-preorder) ERR-UNWRAP)))
                ;; If no previous preorder is found, then true, allowing the process to continue.
                true
            )
            ;; If a previous preorder is still valid/not expired, return an error indicating that a duplicate active preorder exists.
            ERR-NAME-PREORDER-ALREADY-EXISTS
        )
        ;; Validates that the length of the hashed and salted FQN is exactly 20 bytes.
        ;; This ensures that the salt conforms to the expected hash160 output length.
        (asserts! (is-eq (len hashed-salted-fqn) HASH160LEN) ERR-NAME-HASH-MALFORMED)
        ;; Records the preorder in the 'name-preorders' map.
        ;; It includes the hashed-salted FQN, the contract-caller as the buyer, the current block height, the amount of STX burned is set to u0, and marks the preorder as not yet claimed.
        (map-set name-preorders
            { hashed-salted-fqn: hashed-salted-fqn, buyer: contract-caller }
            { created-at: block-height, stx-burned: u0, claimed: false }
        )
        ;; Returns the block height at which the preorder's claimability period will expire.
        ;; This is calculated by adding the NAME-PREORDER-CLAIMABILITY-TTL to the current block height.
        (ok (+ block-height NAME-PREORDER-CLAIMABILITY-TTL))
    )
)

;; Defines a public function `name-register` that finalizes the registration of a BNS name.
;; This function uses provided details to verify the preorder, register the name, and assign it initial properties.
;; This should only allow Managers from MANAGED namespaces to register names
(define-public (mng-name-register (namespace (buff 20)) (name (buff 48)) (salt (buff 20)) (zonefile-hash (buff 20)) (send-to principal))
    (let 
        (
            ;; Generates the hashed, salted fully-qualified name by concatenating the name, namespace, and salt, then applying a hash160 function.
            (hashed-salted-fqn (hash160 (concat (concat (concat name 0x2e) namespace) salt)))
            ;; Retrieves the existing properties of the namespace to confirm its existence and management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Extracts the current manager of the namespace to verify the authority of the caller, ensuring only the namespace manager can perform this action.
            (current-namespace-manager (unwrap! (get namespace-manager namespace-props) ERR-NO-NAMESPACE-MANAGER))
            ;; Retrieves the preorder information using the hashed-salted FQN to verify the preorder exists and is associated with the current namespace manager.
            (preorder (unwrap! (map-get? name-preorders { hashed-salted-fqn: hashed-salted-fqn, buyer: current-namespace-manager }) ERR-NAME-PREORDER-NOT-FOUND))
            ;; Calculates the ID for the new name to be minted, incrementing the last used ID in the BNS system.
            (id-to-be-minted (+ (var-get bns-index) u1))
            ;; Retrieves a list of all names currently owned by the send-to address, defaults to an empty list if none exist.
            (all-users-names-owned (default-to (list) (map-get? bns-ids-by-principal send-to)))
            ;; Checks if the name is already registered within the namespace.
            (name-props (map-get? name-properties {name: name, namespace: namespace}))
            ;; Retrieves the index of the name, if it exists, to check for prior registrations.
            (name-index (map-get? name-to-index {name: name, namespace: namespace}))
        )
        ;; Verifies that the caller of the contract is the namespace manager.
        (asserts! (is-eq contract-caller current-namespace-manager) ERR-NOT-AUTHORIZED)
        ;; Ensures the name is not already registered by checking if it lacks an existing index.
        (asserts! (is-none name-index) ERR-NAME-UNAVAILABLE)
        ;; Validates that the preorder was made after the namespace was officially launched.
        (asserts! (> (get created-at preorder) (unwrap-panic (get launched-at namespace-props))) ERR-NAME-PREORDERED-BEFORE-NAMESPACE-LAUNCH)
        ;; Checks that the preorder has not already been claimed to avoid duplicate name registrations.
        ;; I don't think this is needed
        (asserts! (is-eq (get claimed preorder) false) ERR-NAME-ALREADY-CLAIMED)
        ;; Verifies the registration is completed within the claimability period defined by the NAME-PREORDER-CLAIMABILITY-TTL.
        (asserts! (< block-height (+ (get created-at preorder) NAME-PREORDER-CLAIMABILITY-TTL)) ERR-NAME-CLAIMABILITY-EXPIRED)
        ;; Updates the list of all names owned by the recipient to include the new name ID.
        (map-set bns-ids-by-principal send-to (unwrap! (as-max-len? (append all-users-names-owned id-to-be-minted) u1000) ERR-UNWRAP))
        ;; Sets the newly registered name as the primary name for the recipient if they do not already have one.
        (match (map-get? primary-name send-to) 
            receiver
            ;; If it has a primary-name then do nothing
            false
            ;; If it is none, then assign the ID being minted as the primary-name
            ;; Updated this major bug haha 
            (map-set primary-name send-to id-to-be-minted)
        )
        ;; Sets properties for the newly registered name including registration time, price, owner, and associated zonefile hash.
        (map-set name-properties
            {
                name: name, namespace: namespace
            } 
            {
                registered-at: (some block-height),
                imported-at: none,
                revoked-at: none,
                zonefile-hash: (some zonefile-hash),
                locked: false,
                renewal-height: (+ (get lifetime namespace-props) block-height),
                stx-burn: u0,
                owner: send-to,
            }
        )
        ;; Marks the preorder as claimed in the 'name-preorders' map to prevent reuse.
        (map-set name-preorders { hashed-salted-fqn: hashed-salted-fqn, buyer: current-namespace-manager} 
            (merge 
                preorder 
                {claimed: true}
            )
        )
        ;; Links the newly minted ID to the name and namespace.
        (map-set index-to-name id-to-be-minted {name: name, namespace: namespace})
        ;; Links the name and namespace combination to the newly minted ID.
        (map-set name-to-index {name: name, namespace: namespace} id-to-be-minted)
        ;; Updates BNS-index variable to the newly minted ID.
        (var-set bns-index id-to-be-minted)
        ;; Mints the BNS name as an NFT to the send-to address, finalizing the registration.
        (unwrap! (nft-mint? BNS-V2 id-to-be-minted send-to) ERR-NAME-COULD-NOT-BE-MINTED)
        ;; Confirms successful registration of the name.
        (ok true)
    )
)

;; update-zonefile-hash
;; A update-zonefile-hash transaction changes the name's zone file hash. You would send one of these transactions 
;; if you wanted to change the name's zone file contents. 
;; For example, you would do this if you want to deploy your own Gaia hub and want other people to read from it.

;; Public function `update-zonefile-hash` for changing the zone file hash associated with a name.
;; This operation is typically used to update the zone file contents of a name, such as when deploying a new Gaia hub.
;; @params:
    ;; namespace (buff 20): The namespace of the name whose zone file hash is being updated.
    ;; name (buff 48): The name whose zone file hash is being updated.
    ;; zonefile-hash (buff 20): The new zone file hash to be associated with the name.
(define-public (update-zonefile-hash (namespace (buff 20)) (name (buff 48)) (zonefile-hash (buff 20)))
    (let 
        (
            ;; Get index from name and namespace
            (index-id (unwrap! (map-get? name-to-index {name: name, namespace: namespace}) ERR-NO-NAME))
            ;; Get the owner
            (owner (unwrap! (nft-get-owner? BNS-V2 index-id) ERR-UNWRAP))
            ;; Get name props
            (name-props (unwrap! (map-get? name-properties {name: name, namespace: namespace}) ERR-NO-NAME))
            ;; Get namespace props
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Retrieve namespace manager if any
            (namespace-manager (get namespace-manager namespace-props))
            ;; Get the renewal height
            (renewal (get renewal-height name-props))
            ;; Get the locked value
            (is-locked (get locked name-props))
            ;; Get the current zonefile
            (current-zone-file (get zonefile-hash name-props))
        )
        ;; Assert we are actually updating the zonefile
        (asserts! (not (is-eq (some zonefile-hash) current-zone-file)) ERR-NAME-OPERATION-UNAUTHORIZED)
        ;; Asserts the name has not been revoked.
        (asserts! (is-none (get revoked-at name-props)) ERR-NAME-REVOKED)
        ;; See if the namespace has a manager
        (asserts! 
            (match namespace-manager 
                manager 
                ;; If it does, then check contract caller is the manager
                (is-eq contract-caller manager)
                ;; If not then check that the tx-sender is the owner
                (is-eq tx-sender owner)
            ) 
            ERR-NOT-AUTHORIZED
        )
        
        ;; Assert that the name is in valid time or grace period
        (asserts! (<= block-height (+ renewal NAME-GRACE-PERIOD-DURATION)) ERR-NAME-OPERATION-UNAUTHORIZED)
        ;; Update the zonefile hash
        (map-set name-properties {name: name, namespace: namespace}
            (merge
                name-props
                {zonefile-hash: (some zonefile-hash)}
            )
        )
        ;; Confirm successful completion of the zone file hash update.
        (ok true)
    )
)

;; NAME-REVOKE
;; A NAME-REVOKE transaction makes a name unresolvable. The BNS consensus rules stipulate that once a name 
;; is revoked, no one can change its public key hash or its zone file hash. 
;; The name's zone file hash is set to null to prevent it from resolving.
;; You should only do this if your private key is compromised, or if you want to render your name unusable for whatever reason.

;; Public function `name-revoke` for making a name unresolvable.
;; @params:
    ;; namespace (buff 20): The namespace of the name to be revoked.
    ;; name (buff 48): The actual name to be revoked.
    ;; Keeping this and only modifying it enought to be able to revoke-it, don't know if we will need this so I am doing this only to assert in the update-zonefile function
(define-public (name-revoke (namespace (buff 20)) (name (buff 48)))
    (let 
        (
            ;; Retrieve the properties of the namespace to ensure it exists and is valid for registration.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Retrieve namespace manager if any
            (namespace-manager (get namespace-manager namespace-props))
            ;; retreive the name props
            (name-props (unwrap! (map-get? name-properties {name: name, namespace: namespace}) ERR-NO-NAME))
        )
        (asserts! 
            (match namespace-manager 
                manager 
                (is-eq contract-caller manager)
                (is-eq tx-sender (get namespace-import namespace-props))
            ) 
            ERR-NOT-AUTHORIZED
        )
            
        (map-set name-properties {name: name, namespace: namespace}
            (merge 
                name-props
                {revoked-at: (some block-height)} 
            )
        )
        ;; Return a success response indicating the name has been successfully revoked.
        (ok true)
    )
)

;; NAME-RENEWAL
;; Depending in the namespace rules, a name can expire. For example, names in the .id namespace expire after 2 years. 
;; You need to send a NAME-RENEWAL every so often to keep your name.
;; You will pay the registration cost of your name to the namespace's designated burn address when you renew it.
;; When a name expires, it enters a month-long "grace period" (5000 blocks). 
;; It will stop resolving in the grace period, and all of the above operations will cease to be honored by the BNS consensus rules.
;; You may, however, send a NAME-RENEWAL during this grace period to preserve your name.
;; If your name is in a namespace where names do not expire, then you never need to use this transaction.

;; Public function `name-renewal` for renewing ownership of a name.
;; @params 
    ;; namespace (buff 20): The namespace of the name to be renewed.
    ;; name (buff 48): The actual name to be renewed.
    ;; stx-to-burn (uint): The amount of STX tokens to be burned for renewal.
(define-public (name-renewal (namespace (buff 20)) (name (buff 48)) (stx-to-burn uint) (zonefile-hash (optional (buff 20))))
    (let 
        (
            ;; Get the index of the name
            (name-index (unwrap! (map-get? name-to-index {name: name, namespace: namespace}) ERR-NO-NAME))
            ;; Fetch the namespace properties from the `namespaces` map.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Get the current owner of the name.
            (owner (unwrap! (nft-get-owner? BNS-V2 name-index) ERR-NO-NAME))
            ;; Fetch the name properties from the `name-properties` map.
            (name-props (unwrap! (map-get? name-properties { name: name, namespace: namespace }) ERR-NAME-NOT-FOUND))
            ;; Retrieve namespace manager if any
            (namespace-manager (get namespace-manager namespace-props))
        )
        ;; Assert that the namespace doesn't have a manager, if it does then only the manager can renew names
        (asserts! (is-none namespace-manager) ERR-NAMESPACE-HAS-MANAGER)
        ;; Asserts that the namespace has been launched.
        (asserts! (is-some (get launched-at namespace-props)) ERR-NAMESPACE-NOT-LAUNCHED)
        ;; Asserts that renewals are required for names in this namespace
        (asserts! (> (get lifetime namespace-props) u0) ERR-NAME-OPERATION-UNAUTHORIZED)
        ;; Checks if the name's lease has expired.
        (if (unwrap! (is-name-lease-expired namespace name) ERR-UNWRAP)
            ;; If it has, Check that the name is in grace period
            (if (is-eq true (unwrap! (is-name-in-grace-period namespace name) ERR-UNWRAP))
                ;; If the name is in grace period
                (begin 
                    ;; Asserts that the sender of the transaction matches the current owner of the name.
                    (asserts! (is-eq owner tx-sender) ERR-NOT-AUTHORIZED) 
                    ;; Update the renewal-height to be the current block-height + the lifetime of the namespace, to start from scratch
                    (map-set name-properties {name: name, namespace: namespace}
                        (merge 
                            name-props 
                            {renewal-height: (+ block-height (get lifetime namespace-props))}
                        )
                    )
                )
                ;; If the name is not in grace period then anyone can claim the name?
                ;; First check that it is not listed on the market
                (if (is-none (map-get? market name-index)) 
                    (begin 
                        ;; If true then transfer the name and update everything
                        (unwrap! (purchase-transfer name-index owner tx-sender) ERR-UNWRAP)
                        ;; Update the renewal-height
                        (map-set name-properties {name: name, namespace: namespace}
                            (merge 
                                (unwrap! (map-get? name-properties {name: name, namespace: namespace}) ERR-UNWRAP)
                                {renewal-height: (+ block-height (get lifetime namespace-props))}
                            )
                        )
                    )
                    ;; If false then
                    (begin 
                        ;; Deletes the listing from the market map
                        (map-delete market name-index) 
                        ;; Then transfers the name and updates everything
                        (unwrap! (purchase-transfer name-index owner tx-sender) ERR-UNWRAP)
                        ;; Update the renewal-height
                        (map-set name-properties {name: name, namespace: namespace}
                            (merge 
                                (unwrap! (map-get? name-properties {name: name, namespace: namespace}) ERR-UNWRAP)
                                {renewal-height: (+ block-height (get lifetime namespace-props))}
                            )
                        )
                    )
                )   
            )
            ;; If the name lease has not expired, then increase the renewal height + the lifetime of the namespace, and everything else stays the same
            (map-set name-properties {name: name, namespace: namespace} 
                (merge 
                    name-props
                    {renewal-height: (+ (get renewal-height name-props) (get lifetime namespace-props))}
                )
            )
        )
        ;; Asserts that the amount of STX to be burned is at least equal to the renewal price of the name.
        (asserts! (>= stx-to-burn (compute-name-price name (get price-function namespace-props))) ERR-NAME-STX-BURNT-INSUFFICIENT)
        ;; Asserts that the name has not been revoked.
        (asserts! (is-none (get revoked-at name-props)) ERR-NAME-REVOKED)
        ;; Burns the STX provided
        (unwrap! (stx-burn? stx-to-burn tx-sender) ERR-UNWRAP)
        ;; Checks if a new zone file hash is specified
        (if (is-some zonefile-hash) 
            ;; If it is then update it
            (unwrap! (update-zonefile-hash namespace name (unwrap! zonefile-hash ERR-UNWRAP)) ERR-UNWRAP)
            ;; If there isn't then continue
            false
        )
        ;; Successfully completes the renewal process.
        (ok true)
    )
)

;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;
;;;;; Read Only ;;;;
;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;

;; @desc SIP-09 compliant function to get the last minted token's ID
(define-read-only (get-last-token-id)
    ;; Returns the current value of bns-index variable, which tracks the last token ID
    (ok (var-get bns-index))
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

;; This read-only function determines the availability of a specific BNS (Blockchain Name Service) name within a specified namespace.
(define-read-only (is-name-available (name (buff 48)) (namespace (buff 20)))
    (let 
        (
            ;; Attempts to retrieve properties of the specified namespace to ensure it exists.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))

            ;; Attempts to find an index for the name-namespace pair, which would indicate prior registration.
            (name-index (map-get? name-to-index {name: name, namespace: namespace}))

            ;; Tries to get the properties associated with the name within the namespace, if it's registered.
            (name-props (map-get? name-properties {name: name, namespace: namespace}))
        ) 
        ;; Returns the availability status based on whether name properties were found.
        (ok
            (if (is-none name-props)
                {
                    ;; If no properties are found, the name is considered available, and no renewal or price info is applicable.
                    available: true,
                    renews-at: none,
                    stx-burn: none
                }
                {
                    ;; If properties are found, the name is not available, and the function returns its renewal height and price.
                    available: false,
                    renews-at: (get renewal-height name-props),  ;; The block height at which the name needs to be renewed.
                    stx-burn: (get stx-burn name-props)  ;; The current registration price for the name.
                }
            )
        )
    )
)


;; Read-only function `get-namespace-price` calculates the registration price for a namespace based on its length.
;; @params:
    ;; namespace (buff 20): The namespace for which the price is being calculated.
(define-read-only (get-namespace-price (namespace (buff 20)))
    (let 
        (
            ;; Calculate the length of the namespace.
            (namespace-len (len namespace))
        )
        ;; Ensure the namespace is not blank, its length is greater than 0.
        (asserts! (> namespace-len u0) ERR-NAMESPACE-BLANK)
        ;; Retrieve the price for the namespace based on its length from the NAMESPACE-PRICE-TIERS list.
        ;; The price tier is determined by the minimum of 7 or the namespace length minus one.
        (ok (unwrap-panic (element-at NAMESPACE-PRICE-TIERS (min u7 (- namespace-len u1)))))
    )
)

;; Read-only function `get-name-price` calculates the registration price for a name within a specific namespace.
;; @params:
    ;; namespace (buff 20): The namespace within which the name's price is being calculated.
    ;; name (buff 48): The name for which the price is being calculated.
(define-read-only (get-name-price (namespace (buff 20)) (name (buff 48)))
    (let 
        (
            ;; Fetch properties of the specified namespace to access its price function.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
        )
        ;; Calculate and return the price for the specified name using the namespace's price function.
        (ok (compute-name-price name (get price-function namespace-props)))
    )
)

;; Read-only function `check-name-ops-preconditions` ensures that all necessary conditions are met for operations on a specific name.
;; @params:
    ;; namespace (buff 20): The namespace of the name being checked.
    ;; name (buff 48): The name being checked for operation preconditions.
(define-read-only (check-name-ops-preconditions (namespace (buff 20)) (name (buff 48)))
    (let 
        (
            ;; Retrieve the owner of the name from the `names` map, ensuring the name exists.
            (owner (unwrap! (nft-get-owner? names { name: name, namespace: namespace }) ERR-NAME-NOT-FOUND))
            ;; Fetch properties of the namespace, ensuring the namespace exists.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Fetch properties of the name, ensuring the name exists.
            (name-props (unwrap! (map-get? name-properties { name: name, namespace: namespace }) ERR-NAME-NOT-FOUND))
        ) 
        
        ;; Returns a tuple containing the namespace properties, name properties, and the owner of the name if all checks pass.
        (ok { namespace-props: namespace-props, name-props: name-props, owner: owner })
    )
)

;; Read-only function `can-namespace-be-registered` checks if a namespace is available for registration.
;; @params:
    ;; namespace (buff 20): The namespace being checked for availability.
(define-read-only (can-namespace-be-registered (namespace (buff 20)))
    ;; Returns the result of `is-namespace-available` directly, indicating if the namespace can be registered.
    (ok (is-namespace-available namespace))
)

;; Read-only function `is-name-lease-expired` checks if the lease for a specific name has expired.
;; @params:
    ;; namespace (buff 20): The namespace of the name being checked.
    ;; name (buff 48): The name being checked for lease expiration.
(define-read-only (is-name-lease-expired (namespace (buff 20)) (name (buff 48)))
    (let 
        (
            ;; Fetch properties of the namespace, ensuring the namespace exists.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Fetch properties of the name, ensuring the name exists.
            (name-props (unwrap! (map-get? name-properties { name: name, namespace: namespace }) ERR-NAME-NOT-FOUND))
            ;; Determine the lease start date based on namespace launch and name properties.
            (lease-started-at (try! (name-lease-started-at? (get launched-at namespace-props) (get revealed-at namespace-props) name-props)))
            ;; Retrieve the lifetime of names within this namespace.
            (lifetime (get lifetime namespace-props))
        )
        ;; If the namespace's lifetime for names is set to 0 (indicating names do not expire)
        (if (is-eq lifetime u0)
            ;; Return false.
            (ok false)
            ;; Otherwise, check if the current block height is greater than the sum of the lease start and lifetime, indicating expiration.
            (ok (> block-height (+ lifetime lease-started-at)))
        )
    )
)

;; Read-only function `is-name-in-grace-period` checks if a specific name within a namespace is currently in its grace period.
;; @params:
    ;; namespace (buff 20): The namespace of the name being checked.
    ;; name (buff 48): The specific name being checked for grace period status.
(define-read-only (is-name-in-grace-period (namespace (buff 20)) (name (buff 48)))
    (let 
        (
            ;; Fetch properties of the specified namespace.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Fetch properties of the specific name.
            (name-props (unwrap! (map-get? name-properties { name: name, namespace: namespace }) ERR-NAME-NOT-FOUND))
            ;; Determine the start of the lease for the name based on its namespace's launch and the name's specific properties.
            (lease-ends-at (get renewal-height name-props))
            ;; Retrieve the lifetime duration of names within this namespace.
            (lifetime (get lifetime namespace-props))
        )
        ;; If the namespace's lifetime for names is set to 0 (indicating names do not expire).
        (if (is-eq lifetime u0)
            ;; Return false as names cannot be in a grace period.
            (ok false)
            ;; Otherwise, check if the current block height is lower than the lease-ends-at or renewal height of the name
            (ok 
                (or 
                    (< block-height lease-ends-at) 
                    (<= block-height (+ lease-ends-at NAME-GRACE-PERIOD-DURATION))
                )
            )
        )
    )
)

;; Read-only function `get-namespace-properties` for retrieving properties of a specific namespace.
;; @params:
    ;; namespace (buff 20): The namespace whose properties are being queried.
(define-read-only (get-namespace-properties (namespace (buff 20)))
    (let 
        (
            ;; Fetch the properties of the specified namespace from the `namespaces` map.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
        )
        ;; Returns the namespace along with its associated properties.
        (ok { namespace: namespace, properties: namespace-props })
    )
)


;; Defines a read-only function to fetch the unique ID of a BNS name given its name and the namespace it belongs to.
(define-read-only (get-id-from-bns (name (buff 48)) (namespace (buff 20))) 
    ;; Attempts to retrieve the ID from the 'name-to-index' map using the provided name and namespace as the key.
    (map-get? name-to-index {name: name, namespace: namespace})
)

;; Defines a read-only function to fetch the unique ID of a BNS name given its name and the namespace it belongs to.
(define-read-only (get-bns-from-id (id uint)) 
    ;; Attempts to retrieve the ID from the 'name-to-index' map using the provided name and namespace as the key.
    (map-get? index-to-name id)
)

;; Fetcher for all BNS ids owned by a principal
(define-read-only (get-all-names-owned-by-principal (owner principal))
    (map-get? bns-ids-by-principal owner)
)

;; Fetcher for primary name
(define-read-only (get-primary-name (owner principal))
    (map-get? primary-name owner)
)


;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;
;;;;; Private ;;;;
;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;


;; Returns the minimum of two uint values.
(define-private (min (a uint) (b uint))
    ;; If 'a' is less than or equal to 'b', return 'a', else return 'b'.
    (if (<= a b) a b)  
)

;; Returns the maximum of two uint values.
(define-private (max (a uint) (b uint))
    ;; If 'a' is greater than 'b', return 'a', else return 'b'.
    (if (> a b) a b)  
)

;; Retrieves an exponent value from a list of buckets based on the provided index.
(define-private (get-exp-at-index (buckets (list 16 uint)) (index uint))
    ;; Retrieves the element at the specified index.
    (unwrap-panic (element-at buckets index))  
)

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

;; Calculates the block height at which a name's lease started, considering if it was registered or imported.
(define-private (name-lease-started-at? (namespace-launched-at (optional uint)) (namespace-revealed-at uint) (name-props { registered-at: (optional uint), imported-at: (optional uint), revoked-at: (optional uint), zonefile-hash: (optional (buff 20)), locked: bool, renewal-height: uint, stx-burn: uint, owner: principal}))
    (let 
        (
            ;; Extract the registration and importation times from the name properties.
            (registered-at (get registered-at name-props))
            (imported-at (get imported-at name-props))
        )
        (if (is-none namespace-launched-at)
            ;; If the namespace has not been launched:
            (begin
                ;; Ensure the namespace has not expired by comparing the current block height with the namespace reveal time plus TTL.
                (asserts! (> (+ namespace-revealed-at NAMESPACE-LAUNCHABILITY-TTL) block-height) ERR-NAMESPACE-PREORDER-LAUNCHABILITY-EXPIRED) 
                ;; Return the block height at which the name was imported if the namespace is yet to launch.
                (ok (unwrap! imported-at ERR-UNWRAP))
            )
            ;; If the namespace has been launched:
            (begin
                ;; Confirm the namespace is launched by checking the launch timestamp is set.
                (asserts! (is-some namespace-launched-at) ERR-NAMESPACE-NOT-LAUNCHED)
                ;; Ensure the name has been either registered or imported, but not both.
                (asserts! (is-eq (xor 
                    (match registered-at res 1 0)
                    (match imported-at   res 1 0)) 1) 
                    ERR-PANIC
                )
                ;; Determine the lease start based on registration or importation:
                (if (is-some registered-at)
                    ;; If the name was registered, return the registration block height.
                    (ok (unwrap-panic registered-at))
                    ;; If the name was imported, check if it was between the namespace reveal and launch.
                    (if (and (>= (unwrap-panic imported-at) namespace-revealed-at) (<= (unwrap-panic imported-at) (unwrap-panic namespace-launched-at)))
                        ;; If imported correctly, return the namespace launch block height as the lease start.
                        (ok (unwrap-panic namespace-launched-at))
                        ;; If the importation timing does not match criteria, return 0.
                        (ok u0)
                    )
                )
            )
        )
    )
)


;; Private helper function `is-namespace-available` checks if a namespace is available for registration or other operations.
;; It considers if the namespace has been launched and whether it has expired.
;; @params:
    ;; namespace (buff 20): The namespace to check for availability.
(define-private (is-namespace-available (namespace (buff 20)))
    (match 
        ;; Attempt to fetch the properties of the namespace from the `namespaces` map.
        (map-get? namespaces namespace) 
        namespace-props
        (begin
            ;; Check if the namespace has been launched. If it has, it may not be available for certain operations.
            (if (is-some (get launched-at namespace-props)) 
                ;; If the namespace is launched, it's considered unavailable if it hasn't expired.
                false
                ;; Check if the namespace is expired by comparing the current block height to the reveal time plus the launchability TTL.
                (> block-height (+ (get revealed-at namespace-props) NAMESPACE-LAUNCHABILITY-TTL)))
        ) 
        ;; If the namespace doesn't exist in the map, it's considered available.
        true
    )
)

;; Private helper function `compute-name-price` calculates the registration price for a name based on its length and character composition.
;; It utilizes a configurable pricing function that can adjust prices based on the name's characteristics.
;; @params:
    ;; name (buff 48): The name for which the price is being calculated.
    ;; price-function (tuple): A tuple containing the parameters of the pricing function, including:
        ;; buckets (list 16 uint): A list defining price multipliers for different name lengths.
        ;; base (uint): The base price multiplier.
        ;; coeff (uint): A coefficient that adjusts the base price.
        ;; nonalpha-discount (uint): A discount applied to names containing non-alphabetic characters.
        ;; no-vowel-discount (uint): A discount applied to names lacking vowel characters.
(define-private (compute-name-price (name (buff 48)) (price-function {buckets: (list 16 uint), base: uint, coeff: uint, nonalpha-discount: uint, no-vowel-discount: uint}))
    (let 
        (
            ;; Determine the appropriate exponent based on the name's length, which corresponds to a specific bucket in the pricing function.
            (exponent (get-exp-at-index (get buckets price-function) (min u15 (- (len name) u1))))
            ;; Calculate the no-vowel discount. If the name has no vowels, apply the discount; otherwise, use 1 (no discount).
            (no-vowel-discount (if (not (has-vowels-chars name)) (get no-vowel-discount price-function) u1))
            ;; Calculate the non-alphabetic character discount. If the name contains non-alphabetic characters, apply the discount; otherwise, use 1.
            (nonalpha-discount (if (has-nonalpha-chars name) (get nonalpha-discount price-function) u1))
        )
        ;; Compute the final price by multiplying the base price adjusted by the coefficient and exponent, then dividing by the greater of the two discounts.
        ;; The result is further scaled by a factor of 10 to adjust for unit precision.
        (* (/ (* (get coeff price-function) (pow (get base price-function) exponent)) (max nonalpha-discount no-vowel-discount)) u10)
    )
)

;; @desc - Helper function for removing a specific NFT from the NFTs list
(define-private (is-not-removeable (nft uint))
  (not (is-eq nft (var-get uint-helper-to-remove)))
)

;; @desc SIP-09 compliant function to transfer a token from one owner to another
;; @param id: the id of the nft being transferred, owner: the principal of the owner of the nft being transferred, recipient: the principal the nft is being transferred to
(define-private (purchase-transfer (id uint) (owner principal) (recipient principal))
    (let 
        (
            ;; Attempts to retrieve the name and namespace associated with the given NFT ID. If not found, it returns an error.
            (name-and-namespace (unwrap! (map-get? index-to-name id) ERR-NO-NAME))
            ;; Extracts the namespace part from the retrieved name-and-namespace tuple.
            (namespace (get namespace name-and-namespace))
            ;; Extracts the name part from the retrieved name-and-namespace tuple.
            (name (get name name-and-namespace))
            ;; Fetches properties of the identified namespace to confirm its existence and retrieve management details.
            (namespace-props (unwrap! (map-get? namespaces namespace) ERR-NAMESPACE-NOT-FOUND))
            ;; Extracts the manager of the namespace, if one is set.
            (namespace-manager (get namespace-manager namespace-props))
            ;; Gets the name-props
            (name-props (unwrap! (map-get? name-properties name-and-namespace) ERR-NO-NAME))
            ;; Gets the registered-at value
            (registered-at-value (get registered-at name-props))
            ;; Gets the imported-at value
            (imported-at-value (get imported-at name-props))
            ;; Gets the current owner of the name from the name-props
            (name-current-owner (get owner name-props))
            ;; Gets the currently owned NFTs by the owner
            (all-nfts-owned-by-owner (default-to (list) (map-get? bns-ids-by-principal owner)))
            ;; Gets the currently owned NFTs by the recipient
            (all-nfts-owned-by-recipient (default-to (list) (map-get? bns-ids-by-principal recipient)))
            ;; Checks if the owner has a primary name
            (owner-primary-name (map-get? primary-name owner))
            ;; Checks if the recipient has a primary name
            (recipient-primary-name (map-get? primary-name recipient))
        )
        ;; Set the helper variable to remove the id being transferred from the list of currently owned nfts by owner
        (var-set uint-helper-to-remove id)
        ;; Updates currently owned names of the owner by removing the id being transferred
        (map-set bns-ids-by-principal owner (filter is-not-removeable all-nfts-owned-by-owner))
        ;; Updates currently owned names of the recipient by adding the id being transferred
        (map-set bns-ids-by-principal recipient (unwrap! (as-max-len? (append all-nfts-owned-by-recipient id) u1000) ERR-OVERFLOW))
        ;; Updates the primary name of the owner if needed, in the case that the id being transferred is the primary name
        (shift-primary-name id owner)
        ;; Updates the primary name of the receiver if needed, if the receiver doesn't have a name assign it as primary
        (match recipient-primary-name
            name-match
            ;; If there is a primary name then do nothing
            false
            ;; If no primary name then assign this as the primary name
            (map-set primary-name recipient id)
        )
        ;; Updates the name-props map with the new information, everything stays the same, we only change the zonefile to none for a clean slate and the owner
        (map-set name-properties name-and-namespace (merge name-props {zonefile-hash: none, owner: recipient}))
        ;; Executes the NFT transfer from owner to recipient if all conditions are met.
        (nft-transfer? BNS-V2 id owner recipient)
    )
)

(define-private (shift-primary-name (nft uint) (owner principal)) 
    (let 
        (
            ;; Checks if the owner has a primary name
            (owner-primary-name (map-get? primary-name owner))
            ;; Gets the currently owned NFTs by the owner
            (all-nfts-owned-by-owner (default-to (list) (map-get? bns-ids-by-principal owner)))
        ) 
        (if (is-eq (some nft) owner-primary-name) 
        ;; If the id is the primary name, then check if there are other names owned by the user
        (match (element-at? (filter is-not-removeable all-nfts-owned-by-owner) u0) 
            next-name 
            ;; If the user does have more names then set it to the index0 name
            (map-set primary-name owner next-name) 
            ;; If the user doesn't have more names then delete the primary-name map associated to that user
            (map-delete primary-name owner)
        )
        ;; If it is not equal then do nothing
        false
        )
    )
)