
;; title: locker
;; version: V-1
;; summary: Manager contract for the .locker namespace
;; description: All actions that can be taken for names will be made through this contract

;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;; Cons, Vars, & Maps ;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;
;;;;;;;;;;;;;;
;;;; Cons ;;;;
;;;;;;;;;;;;;;
;;;;;;;;;;;;;;

(define-constant contract-deployer tx-sender)
(define-constant ERR-NOT-AUTH (err u200))

;;;;;;;;;;;;;;
;;;;;;;;;;;;;;
;;;; Maps ;;;;
;;;;;;;;;;;;;;
;;;;;;;;;;;;;;

;; Map of admin principals
(define-map admin-principals principal 
    {
        authorized: bool,
        signer-pubkey-hash: (buff 20)
    }
)

;; Set the contract deployer as an initial admin principal
(map-set admin-principals contract-deployer 
    {
        authorized: true,
        signer-pubkey-hash: (get-pubkey-hash contract-deployer)
    }
)

;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;
;;;; Functions ;;;;
;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;

;;;;;;;;;;;;;;
;;;;;;;;;;;;;;
;;;; Read ;;;;
;;;;;;;;;;;;;;
;;;;;;;;;;;;;;

;; Is the caller an admin principal?
(define-read-only (is-admin (who principal))
	(ok (asserts! (get authorized (default-to {authorized: false, signer-pubkey-hash: (get-pubkey-hash who)} (map-get? admin-principals who))) ERR-NOT-AUTH))
)

;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;
;;;; Public ;;;;
;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;

;; mng-preorder-wrapper
;; description: Allows and admin principal to preorder a name on the .locker namespace
;; inputs: hashed-salted-fqn (buff 20)
(define-public (mng-preorder-wrapper (hashed-salted-fqn (buff 20)))
    (begin
        (try! (is-admin contract-caller))
        (contract-call? .BNS-V2 mng-name-preorder hashed-salted-fqn)
    )
)

;; mng-register-wrapper
;; description: Allows and admin principal to register a preordered name on the .locker namespace
;; inputs: hashed-salted-fqn (buff 20)
(define-public (mng-register-wrapper (namespace (buff 20)) (name (buff 48)) (salt (buff 20)) (zonefile-hash (buff 20)) (send-to principal))
    (begin
        (try! (is-admin contract-caller))
        (contract-call? .BNS-V2 mng-name-register namespace name salt zonefile-hash send-to)
    )
)

;; add-admin-principal
;; description: Allows an admin principal to add another admin principal
;; inputs: new-admin/principal - The new admin principal
(define-public (add-admin-principal (new-admin-principal principal))
	(begin 
		;; check that the caller is an admin principal
		(try! (is-admin contract-caller))
		;; map set the new admin principal
		(ok (map-set admin-principals new-admin-principal {authorized: true, signer-pubkey-hash: (get-pubkey-hash new-admin-principal)}))
	)
)

;; remove-admin-principal
;; description: Allows an admin principal to remove an admin principal
;; inputs: admin-principal/principal - The admin principal to remove
(define-public (remove-admin-principal (admin-principal principal))
	(begin 
		;; check that the caller is a privileged protocol principal
		(try! (is-admin contract-caller))
		;; map remove the protocol principal
		(ok (map-delete admin-principals admin-principal))
	)
)

;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;
;;;; Private ;;;;
;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;

(define-private (get-pubkey-hash (addr principal))
  (get hash-bytes (unwrap-panic (principal-destruct? addr)))
)

