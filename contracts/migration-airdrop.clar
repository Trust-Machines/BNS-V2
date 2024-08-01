(define-constant ERR-NOT-AUTH (err u200))
(define-constant ERR-NOT-AUTHORIZED (err 200))

(define-map authorized-caller principal bool)

(map-set authorized-caller tx-sender true)

(define-public (mng-airdrop-name
    (name (buff 48))
    (namespace (buff 20))
    (imported-at (optional uint)) 
    (registered-at (optional uint)) 
    (revoked-at bool) 
    (zonefile-hash (optional (buff 20)))
    (renewal-height uint)
    (owner principal)
)
    (begin
        (asserts! (is-some (map-get? authorized-caller tx-sender)) ERR-NOT-AUTH)
        (contract-call? .BNS-V2 name-airdrop 
            name 
            namespace 
            imported-at 
            registered-at 
            revoked-at 
            zonefile-hash 
            renewal-height 
            owner
        )
    )
)

(define-public (mng-airdrop-namespace (namespace (buff 20)))
    (let 
        (
            (namespace-props-call (try! (contract-call? 'SP000000000000000000002Q6VF78.bns get-namespace-properties namespace)))
            (namespace-props-v1 (get properties namespace-props-call))
        )
        (asserts! (is-some (map-get? authorized-caller contract-caller)) ERR-NOT-AUTHORIZED)
        (ok 
            (contract-call? .BNS-V2 namespace-airdrop 
                namespace 
                (get price-function namespace-props-v1) 
                (get lifetime namespace-props-v1) 
                (get namespace-import namespace-props-v1) 
                ;; Manager address
                none 
                (get can-update-price-function namespace-props-v1) 
                ;; Manager transfers
                false 
                ;; Manager frozen
                true 
                (get revealed-at namespace-props-v1)
                (get launched-at namespace-props-v1)
            )
        )
    )
)