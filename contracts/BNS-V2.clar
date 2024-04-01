
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

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;; Public ;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Read Only ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;
;;;;;; Private ;;;;;
;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;

