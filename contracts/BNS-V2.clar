
;; title: BNS-V2
;; version: V-1
;; summary: Updated BNS contract, handles the creation of new namespaces and new names on each namespace
;; description:

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;; traits ;;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

(impl-trait .sip-09.nft-trait)
(use-trait commission-trait .commission-trait.commission)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Token Definition ;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Defining the NFT BNS-V2
(define-non-fungible-token BNS-V2 uint)

;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;
;;;;;; SIP - 09 ;;;;;
;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;

;; SIP-09: get last token id
(define-read-only (get-last-token-id)
  (ok (var-get bns-mint-counter))
)

;; SIP-09: URI for metadata associated with the token
(define-read-only (get-token-uri (id uint))
    (ok (some (var-get token-uri)))
)

;; SIP-09: Gets the owner of the Specified token ID.
(define-read-only (get-owner (id uint))
  (ok (nft-get-owner? BNS-V2 id))
)

;; SIP-09: Transfer
(define-public (transfer (id uint) (owner principal) (recipient principal))
        (nft-transfer? BNS-V2 id owner recipient)
)

;; @desc listing function
;; @param id: the ID of the NFT in question, price: the price being listed, comm-trait: a principal that conforms to the commission-trait
(define-public (list-in-ustx (id uint) (price uint) (comm-trait <commission-trait>))
  (let
    (
      (listing {price: price, commission: (contract-of comm-trait)})
    )

    (asserts! (is-eq (some tx-sender) (unwrap! (get-owner id) ERR-UNWRAP)) ERR-NOT-AUTHORIZED)
    (map-set market id listing)
    (ok (print (merge listing {a: "list-in-ustx", id: id})))
  )
)

;; @desc un-listing function
;; @param id: the ID of the NFT in question, price: the price being listed, comm-trait: a principal that conforms to the commission-trait
(define-public (unlist-in-ustx (id uint))
  (begin
    (asserts! (is-eq (some tx-sender) (unwrap! (get-owner id) ERR-UNWRAP)) ERR-NOT-AUTHORIZED)
    (map-delete market id)
    (ok (print {a: "unlist-in-stx", id: id}))
  )
)

;; @desc function to buy from a current listing
;; @param buy: the ID of the NFT in question, comm-trait: a principal that conforms to the commission-trait for royalty split
(define-public (buy-in-ustx (id uint) (comm-trait <commission-trait>))
    (let
        (
            (owner (unwrap! (unwrap! (get-owner id) ERR-UNWRAP) ERR-UNWRAP))
            (listing (unwrap! (map-get? market id) ERR-NOT-LISTED))
            (price (get price listing))
        )
        (asserts! (is-eq (contract-of comm-trait) (get commission listing)) ERR-WRONG-COMMISSION)
        (try! (stx-transfer? price tx-sender owner))
        (try! (contract-call? comm-trait pay id price))
        (try! (transfer id owner tx-sender))
        (map-delete market id)
        (ok (print {a: "buy-in-ustx", id: id}))
    )
)

;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Constants ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

;; Setting the Constant for the name of the NFTs
(define-constant token-name "BNS-V2")
;; Setting the Constant for the Symbol of the NFTs
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


;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;; Variables ;;;;;
;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;

;;Variable for token-uri
(define-data-var token-uri (string-ascii 246) "")

;;Keep track of last token id
(define-data-var bns-mint-counter uint u0)

;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;
;;;;;; Maps ;;;;;
;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;

;; Map to keep track if a NFT is listed on a marketplace
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

