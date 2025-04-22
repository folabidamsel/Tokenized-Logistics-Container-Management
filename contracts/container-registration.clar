;; Container Registration Contract
;; Records details of shipping containers

(define-data-var last-container-id uint u0)

(define-map containers
  { container-id: uint }
  {
    owner: principal,
    size: (string-utf8 20),
    container-type: (string-utf8 20),
    manufacturing-date: uint,
    last-inspection-date: uint,
    is-active: bool
  }
)

(define-read-only (get-container (container-id uint))
  (map-get? containers { container-id: container-id })
)

(define-read-only (get-container-owner (container-id uint))
  (default-to tx-sender (get owner (map-get? containers { container-id: container-id })))
)

(define-public (register-container
    (size (string-utf8 20))
    (container-type (string-utf8 20))
    (manufacturing-date uint)
    (inspection-date uint))
  (let
    (
      (new-id (+ (var-get last-container-id) u1))
      (caller tx-sender)
    )
    (asserts! (> (len size) u0) (err u1)) ;; Size cannot be empty
    (asserts! (> (len container-type) u0) (err u2)) ;; Type cannot be empty

    (map-set containers
      { container-id: new-id }
      {
        owner: caller,
        size: size,
        container-type: container-type,
        manufacturing-date: manufacturing-date,
        last-inspection-date: inspection-date,
        is-active: true
      }
    )

    (var-set last-container-id new-id)
    (ok new-id)
  )
)

(define-public (update-container-status (container-id uint) (is-active bool))
  (let ((container-data (unwrap! (map-get? containers { container-id: container-id }) (err u404))))
    (asserts! (is-eq tx-sender (get owner container-data)) (err u403))

    (map-set containers
      { container-id: container-id }
      (merge container-data { is-active: is-active })
    )
    (ok true)
  )
)

(define-public (update-inspection-date (container-id uint) (inspection-date uint))
  (let ((container-data (unwrap! (map-get? containers { container-id: container-id }) (err u404))))
    (asserts! (is-eq tx-sender (get owner container-data)) (err u403))

    (map-set containers
      { container-id: container-id }
      (merge container-data { last-inspection-date: inspection-date })
    )
    (ok true)
  )
)

(define-public (transfer-ownership (container-id uint) (new-owner principal))
  (let ((container-data (unwrap! (map-get? containers { container-id: container-id }) (err u404))))
    (asserts! (is-eq tx-sender (get owner container-data)) (err u403))

    (map-set containers
      { container-id: container-id }
      (merge container-data { owner: new-owner })
    )
    (ok true)
  )
)
