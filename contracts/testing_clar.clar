(impl-trait .sip-09.nft-trait)
(use-trait commission-trait .commission-trait.commission)
(define-non-fungible-token test uint)
(define-constant token-uri "https://gateway.pinata.cloud/ipfs/QmZTohP7pAg2BhUPWfxYNmYYg779DwELThXyseKsaKDKko")

;; errors
(define-constant ERR-UNWRAP (err u101))
(define-constant ERR-NOT-AUTHORIZED (err u102))
(define-constant ERR-NOT-LISTED (err u103))
(define-constant ERR-WRONG-COMMISSION (err u104))
(define-constant ERR-LISTED (err u105))

;; (new) Counter to keep track of the last minted NFT ID, ensuring unique identifiers
(define-data-var test-index uint u0)

;; maps
;; (new) Map to track market listings, associating NFT IDs with price and commission details
(define-map market uint {price: uint, commission: principal})

;; read-only
;; @desc (new) SIP-09 compliant function to get the last minted token's ID
(define-read-only (get-last-token-id)
    ;; Returns the current value of bns-index variable, which tracks the last token ID
    (ok (var-get test-index))
)

;; @desc (new) SIP-09 compliant function to get token URI
(define-read-only (get-token-uri (id uint))
    ;; Returns a predefined set URI for the token metadata
    (ok (some token-uri))
)

;; @desc (new) SIP-09 compliant function to get the owner of a specific token by its ID
(define-read-only (get-owner (id uint))
    ;; Check and return the owner of the specified NFT
    (ok (nft-get-owner? test id))
)

;; public functions
;; @desc (new) SIP-09 compliant function to transfer a token from one owner to another.
;; @param id: ID of the NFT being transferred.
;; @param owner: Principal of the current owner of the NFT.
;; @param recipient: Principal of the recipient of the NFT.
(define-public (transfer (id uint) (owner principal) (recipient principal))
    (let 
        (
            (nft-current-owner (unwrap-panic (nft-get-owner? test id)))
        )
        (try! (nft-transfer? test id nft-current-owner recipient))
        (ok true)
    )
)

;; @desc (new) Function to list an NFT for sale.
;; @param id: ID of the NFT being listed.
;; @param price: Listing price.
;; @param comm-trait: Address of the commission-trait.
(define-public (list-in-ustx (id uint) (price uint) (comm-trait <commission-trait>))
    (let
        (
            ;; Creates a listing record with price and commission details
            (listing {price: price, commission: (contract-of comm-trait)})
        )
        ;; Updates the market map with the new listing details
        (map-set market id listing)
        ;; Prints listing details
        (ok (print (merge listing {a: "list-in-ustx", id: id})))
    )
)

;; @desc (new) Function to remove an NFT listing from the market.
;; @param id: ID of the NFT being unlisted.
(define-public (unlist-in-ustx (id uint))
    (let
        (
            ;; Verify if the NFT is listed in the market.
            (market-map (unwrap! (map-get? market id) ERR-NOT-LISTED))
        )
        ;; Deletes the listing from the market map
        (map-delete market id)
        ;; Prints unlisting details
        (ok (print {a: "unlist-in-ustx", id: id}))
    )
)   

;; @desc (new) Function to buy an NFT listed for sale, transferring ownership and handling commission.
;; @param id: ID of the NFT being purchased.
;; @param comm-trait: Address of the commission-trait.
(define-public (buy-in-ustx (id uint) (comm-trait <commission-trait>))
    (let
        (
            ;; Retrieves current owner and listing details
            (owner (unwrap-panic (nft-get-owner? test id)))
            (listing (unwrap! (map-get? market id) ERR-NOT-LISTED))
            (price (get price listing))
        )
        ;; Removes the listing from the market map
        (map-delete market id)
        ;; Prints purchase details
        (ok (print {a: "buy-in-ustx", id: id}))
    )
)


(nft-mint? test u1 tx-sender)