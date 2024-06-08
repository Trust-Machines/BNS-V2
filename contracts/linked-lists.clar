;; Linked Lists Approach Suggested by Hank
;; Maps
;; owner-primary-name-map: Maps a principal to its primary name ID.
;; owner-last-name-map: Maps a principal to the ID of the last name in their list.
;; owner-name-next-map: Maps a name ID to the next name ID in the list.
;; owner-name-prev-map: Maps a name ID to the previous name ID in the list.
;; owner-balance-map: Maps a principal to the count of names they own.

;; Private functions
;; add-name-to-principal-updates: Adds a name ID to a principal's list.
    ;; Parameters: principal, id
    ;; Logic:
        ;; Updates the owner-balance-map to increase the balance by 1.
        ;; Sets the owner-primary-name-map to the new name if it's the first name.
        ;; Updates the owner-last-name-map to the new name.
        ;; If the account already has a last name, updates the owner-name-next-map and owner-name-prev-map to link the new name to the end of the list.

;; remove-name-from-principal-updates: Removes a name ID to a principal's list.
    ;; Parameters: principal, id
    ;; Logic:
        ;; Updates the owner-balance-map to decrease the balance by 1.
        ;; Checks if the name being removed is the primary name and updates owner-primary-name-map if necessary.
        ;; Checks if the name being removed is the last name and updates owner-last-name-map if necessary.
        ;; Updates the owner-name-next-map and owner-name-prev-map to bypass the removed name in the list.

;; set-primary-name: Sets a specific name as the primary name for a principal.
    ;; Parameters: principal, id
    ;; Logic:
        ;; Ensures the name is not already the primary name.
        ;; Removes the name from its current position using remove-name-from-principal-updates.
        ;; Updates owner-primary-name-map to the new primary name.
        ;; Updates the linked list to place the new primary name at the start.
;; Import SIP-09 NFT trait 
(impl-trait .sip-09.nft-trait)

;; Define error constants
(define-constant ERR_UNAUTHORIZED (err u4000))
(define-constant ERR_ALREADY_REGISTERED (err u4001))
(define-constant ERR_CANNOT_SET_PRIMARY (err u4002)) 
(define-constant ERR_INVALID_ID (err u4003)) 
(define-constant ERR_NOT_OWNER (err u4004)) 
(define-constant ERR_BURN_UPDATES_FAILED (err u4004)) 

;; Define data variables
;; Last ID used for incrementing new name IDs
(define-data-var last-id-var uint u0) 
;; Token URI for NFT metadata
(define-data-var token-uri-var (string-ascii 256) "") 

;; Define the non-fungible token (NFT) called Linked with unique identifiers as unsigned integers
(define-non-fungible-token Linked uint)

;; Define maps for managing the linked list and name ownership
;; Maps principal to their primary name ID
(define-map owner-primary-name-map principal uint) 
;; Maps principal to the last name ID in their list
(define-map owner-last-name-map principal uint) 
;; Maps name ID to the next name ID in the list
(define-map owner-name-next-map uint uint) 
;; Maps name ID to the previous name ID in the list
(define-map owner-name-prev-map uint uint) 
;; Maps name ID to the owner principal
(define-map name-owner-map uint principal) 
;; Maps name and namespace to name ID
(define-map name-id-map { name: (buff 48), namespace: (buff 20) } uint) 
;; Maps name ID to name and namespace
(define-map id-name-map uint { name: (buff 48), namespace: (buff 20) }) 
;; Maps principal to the count of names they own
(define-map owner-balance-map principal uint)

;; Define public function to register a new name
(define-public (register (name { name: (buff 48), namespace: (buff 20) }) (owner principal))
    (let
        (
            ;; Increment ID for the new name
            (id (increment-id)) 
        )
        ;; Ensure the name is not already registered, triple check
        (asserts! (map-insert name-id-map name id) ERR_ALREADY_REGISTERED)
        (asserts! (map-insert id-name-map id name) ERR_ALREADY_REGISTERED)
        (asserts! (map-insert name-owner-map id owner) ERR_ALREADY_REGISTERED)
        ;; Log the new name registration
        (print 
            {
                topic: "new-name",
                owner: owner,
                name: name,
                id: id,
            }
        )
        ;; Add the new name to the owner's linked list
        (add-name-to-principal-updates owner id)
        ;; Mint the NFT for the new name
        (try! (nft-mint? Linked id owner))
        ;; Return the new name ID
        (ok id) 
    )
)

;; Define private function to increment ID
(define-private (increment-id)
    (let
        (
            ;; Get the last used ID
            (last (var-get last-id-var)) 
        )
        ;; Increment the ID
        (var-set last-id-var (+ last u1)) 
        ;; Return the incremented ID
        last 
    )
)

;; Define private function to add a name to a principal's list
(define-private (add-name-to-principal-updates (account principal) (id uint))
    (let
        (
            ;; Get the last name ID for the account
            (last-owner-name (map-get? owner-last-name-map account)) 
        )
        ;; Update the balance map to increase the balance by 1
        (map-set owner-balance-map account (+ (get-balance account) u1))
        ;; Log the primary name update
        (print-primary-update account (some id))
        ;; Set the primary name if it doesn't exist
        (map-insert owner-primary-name-map account id)
        ;; Update the last name map to the new name
        (map-set owner-last-name-map account id)
        ;; Link the new name to the end of the list if there is a last name
        (match last-owner-name last 
            (begin
                (map-set owner-name-next-map last id)
                (map-set owner-name-prev-map id last)
            )
            true
        )
        ;; Return true indicating successful addition
        true 
    )
)

;; Define private function to log primary name updates
(define-private (print-primary-update (account principal) (id (optional uint)))
    (begin
        ;; Print log of primary update
        (print 
            {
                topic: "primary-update",
                id: id,
                account: account,
                prev: (map-get? owner-primary-name-map account)
            }
        )
        ;; Return true indicating successful logging
        true 
    )
)

;; Define read-only function to get the balance of names for a principal
(define-read-only (get-balance (account principal))
    ;; Return balance or 0 if not found
    (default-to u0 (map-get? owner-balance-map account)) 
)

;; Define public function to burn a name
(define-public (burn (id uint))
    ;; Check if name-owner-map returns some
    (match (map-get? name-owner-map id) owner 
        ;; If it does then
        (begin
            ;; Ensure the caller is the owner
            (asserts! (is-eq tx-sender owner) ERR_NOT_OWNER)
            ;; Burn the name
            (unwrap! (burn-name-updates id) ERR_BURN_UPDATES_FAILED)
            ;; Burn the NFT
            (nft-burn? Linked id owner)
        )
        ;; If it returns none, it means no owner exists
        ;; Return error if not the owner
        ERR_NOT_OWNER 
    )
)

;; Define private function to burn a name
(define-private (burn-name-updates (id uint))
    (let
        (
            ;; Get the name details
            (name (unwrap! (map-get? id-name-map id) ERR_INVALID_ID)) 
            ;; Get the owner
            (owner (unwrap! (map-get? name-owner-map id) ERR_NOT_OWNER)) 
        )
        ;; Remove the name from the owner's linked list
        (remove-name-from-principal-updates owner id)
        
        ;; Delete the name from all maps
        (map-delete name-id-map name)
        (map-delete id-name-map id)
        (map-delete name-owner-map id)
        ;; Log the burn action
        (print 
            {
                topic: "burn",
                id: id,
            }
        )
        ;; Return true indicating successful burn
        (ok true) 
    )
)

;; Define private function to remove a name from a principal's list
(define-private (remove-name-from-principal-updates (account principal) (id uint))
    (let
        (
            ;; Get the previous name ID in the list
            (prev-opt (map-get? owner-name-prev-map id)) 
            ;; Get the next name ID in the list
            (next-opt (map-get? owner-name-next-map id)) 
            ;; Get the primary name ID for the account
            (first (unwrap-panic (map-get? owner-primary-name-map account))) 
            ;; Get the last name ID for the account
            (last (unwrap-panic (map-get? owner-last-name-map account))) 
            ;; Get the balance of names for the account
            (balance (unwrap-panic (map-get? owner-balance-map account))) 
        )
        ;; Log the removal action
        (print 
            {
                topic: "remove", 
                account: account
            }
        ) 
        ;; Update the balance map to decrease the balance by 1
        (map-set owner-balance-map account (- balance u1))
        ;; If the name being removed is the first name in the list
        (and 
            (is-eq first id)
            ;; Check if there is a name
            (match next-opt next-name
                ;; If there is a next name, update the primary name to the next name and print the update
                (begin 
                    ;; Log the primary name update
                    (print-primary-update account next-opt) 
                    ;; Set the next name as the primary name
                    (map-set owner-primary-name-map account next-name) 
                )
                ;; If there is no next name, remove the primary name entry
                (and
                    ;; Log the primary name update to none
                    (print-primary-update account none) 
                    ;; Delete the primary name entry
                    (map-delete owner-primary-name-map account) 
                )
            )
        )
        ;; If the name being removed is the last name in the list
        (and 
            (is-eq last id)
            (match prev-opt prev-name
                ;; If there is a previous name, update the last name to the previous name
                (map-set owner-last-name-map account prev-name)
                ;; If there is no previous name, remove the last name entry 
                (map-delete owner-last-name-map account)
            )
        )
        ;; Update the next and previous maps to bypass the removed name
        (match next-opt next 
            (match prev-opt prev-name
                ;; If there is a previous name, set its next name to the next name of the removed name
                (map-set owner-name-prev-map next prev-name)
                ;; If there is no previous name, delete the next name entry from the map
                (map-delete owner-name-prev-map next)
            )
            ;; If there is no next name then return true
            true
        )
        
        (match prev-opt prev 
            (match next-opt next-name
                ;; If there is a next name, set its previous name to the previous name of the removed node
                (map-set owner-name-next-map prev next-name)
                ;; If there is no next name, delete the previous name entry from the map
                (map-delete owner-name-next-map prev)
            )
            true
        )
        
        ;; Delete the name from the next and previous maps
        (map-delete owner-name-next-map id)
        (map-delete owner-name-prev-map id)

        true ;; Return true indicating successful removal
    )
)


;; Define read-only function to get the last token ID
(define-read-only (get-last-token-id)
    ;; Get the last used ID
    (let 
        (
            (last (var-get last-id-var))
        ) 
        ;; Return the last token ID
        (ok 
            (if (is-eq last u0) 
                u0 
                (- last u1)
            )
        ) 
    )
)

;; Define read-only function to get the owner of a name
(define-read-only (get-owner (id uint))
    ;; Return the owner of the NFT
    (ok (nft-get-owner? Linked id)) 
)

;; Define read-only function to get the token URI
(define-read-only (get-token-uri (id uint))
    ;; Return the token URI
    (ok (some (var-get token-uri-var))) 
)

;; Define public function to transfer a name
(define-public (transfer (id uint) (sender principal) (recipient principal))
    (let
        (
            ;; Get the owner of the name
            (owner (unwrap! (map-get? name-owner-map id) ERR_NOT_OWNER)) 
        )
        ;; Ensure the caller is the owner and the sender
        (asserts! (is-eq tx-sender owner) ERR_NOT_OWNER)
        (asserts! (is-eq owner sender) ERR_NOT_OWNER)
        ;; Transfer ownership
        (transfer-ownership-updates id sender recipient)
        ;; Transfer the NFT
        (try! (nft-transfer? Linked id sender recipient))
        ;; Return true indicating successful transfer
        (ok true) 
    )
)

;; Define private function to transfer ownership of a name
(define-private (transfer-ownership-updates (id uint) (sender principal) (recipient principal))
    (begin
        ;; Update the owner map
        (map-set name-owner-map id recipient)
        
        ;; Log the transfer action
        (print 
            {
                topic: "transfer-ownership",
                id: id,
                recipient: recipient,
            }
        )
        ;; Remove the name from the sender's list and add it to the recipient's list
        (remove-name-from-principal-updates sender id)
        (add-name-to-principal-updates recipient id)
    )
)
