#lang racket

(require "../languages.rkt")
(provide (all-defined-out))

;; v ::= ⟨f, ρ⟩                                   Values
;; ρ ::= [x ↦ v, ...]                             Environments
;; t ::= [ℓᶜ, ...]                                Time Stamps

;; ⇒ : e → v
(define (⇒ e)

  ;; → : e ρ t → v
  (define (→ e ρ t)
    (match e
      [`((λ (,x) ,eᵇ) . ,ℓᶠ) `(,e ,ρ)]
      [`((,eᶠ ,eᵃ) . ,ℓᶜ)
       (match-define tᵉ (cons ℓᶜ t))
       (match-define vᶠ (→ eᶠ ρ tᵉ))
       (match-define vᵃ (→ eᵃ ρ tᵉ))
       (match-define `(((λ (,x) ,eᵇ) . ,ℓᶠ) ,ρᶠ) vᶠ)
       (match-define ρᶠ⁺ˣ (hash-set ρᶠ x vᵃ))
       (→ eᵇ ρᶠ⁺ˣ tᵉ)]
      [`(,(? symbol? x) . ,ℓʳ) (hash-ref ρ x)]))

  (→ e (hash) empty))

;; ⇑ : v → Racket S-Expression
(define (⇑ v)
  (match-define `(,f ,ρ) v)
  ;; ↑ : e {x, ...} → Racket S-Expression
  (define (↑ e x*)
    (match e
      [`((λ (,x) ,eᵇ) . ,ℓᶠ) `(λ (,x) ,(↑ eᵇ (set-add x* x)))]
      [`((,eᶠ ,eᵃ) . ,ℓᶜ) `(,(↑ eᶠ x*) ,(↑ eᵃ x*))]
      [`(,(? symbol? x) . ,ℓʳ) #:when (set-member? x* x) x]
      [`(,(? symbol? x) . ,ℓʳ) (⇑ (hash-ref ρ x))]))
  (↑ f (set)))

;; eval : eˢ decoder → Racket Value
(define (eval e [decode identity]) (decode (racket:eval (⇑ (⇒ (⇓ e))))))

(module+ test
  (require rackunit "../programs.rkt")

  (check-equal? (eval identity (λ (f) (f #t))) #t)
  (check-equal? (eval application decode/boolean) #t)
  (check-equal? (eval const decode/boolean) #t)
  (check-equal? (eval identity-called-twice decode/boolean) #t)
  (check-equal? (eval identity-called-twice/apply decode/boolean) #t)
  (check-equal? (eval identity-called-twice/η-expanded decode/boolean) #t)
  (check-equal? (eval identity-called-twice/iife decode/boolean) #t)
  (check-equal? (eval non-recursive-self-application decode/boolean) #t)
  (check-equal? (eval identity&apply-with-self-passing decode/boolean) #t)
  (check-equal? (eval try decode/boolean) #f)
  (check-incomputable (thunk (eval Ω)))
  (check-incomputable (thunk (eval Ω/creating-closures)))
  (check-incomputable (thunk (eval Ω/pushing-stack-frames)))
  (check-equal? (eval countdown decode/number) 0)
  (check-equal? (eval church-arithmetic decode/number) 16)
  (check-equal? (eval sat decode/boolean) #t))
