;; gamma-bns-comission-container
(define-public (pay (id uint) (price uint)) 
    (begin 
        ;; Gamma (1%)
        (try! (stx-transfer? (/ (* price u200) u10000) tx-sender 'SPNWZ5V2TPWGQGVDR6T7B6RQ4XMGZ4PXTEE0VQ0S))
        (ok true)
    )
)