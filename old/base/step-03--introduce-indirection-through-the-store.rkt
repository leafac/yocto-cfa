#lang racket

(require "../languages.rkt")
(provide (all-defined-out))

;; ¢ ::= ⟨v, σ⟩                                   Results
;; v ::= ⟨f, ρ⟩                                   Values
;; ρ ::= [x ↦ a, ...]                             Environments
;; σ ::= [a ↦ v, ...]                             Stores
;; a ::= ⟨ℓᶠ, t⟩                                  Addresses
;; t ::= [ℓᶜ, ...]                                Time Stamps

;; ⇒ : e → ¢
(define (⇒ e)

  ;; → : e ρ σ t → ¢
  (define (→ e ρ σ t)
    (match e
      [`((λ (,x) ,eᵇ) . ,ℓᶠ) `((,e ,ρ) ,σ)]
      [`((,eᶠ ,eᵃ) . ,ℓᶜ)
       (match-define tᵉ (cons ℓᶜ t))
       (match-define ¢ᶠ (→ eᶠ ρ σ tᵉ))
       (match-define ¢ᵃ (→ eᵃ ρ (second ¢ᶠ) tᵉ))
       (match-define vᶠ (first ¢ᶠ))
       (match-define vᵃ (first ¢ᵃ))
       (match-define `(((λ (,x) ,eᵇ) . ,ℓᶠ) ,ρᶠ) vᶠ)
       (match-define σᶠ⁺ᵃ (second ¢ᵃ))
       (match-define a `(,ℓᶠ ,tᵉ))
       (match-define ρᶠ⁺ˣ (hash-set ρᶠ x a))
       (match-define σᶠ⁺ᵃ⁺ˣ (hash-set σᶠ⁺ᵃ a vᵃ))
       (→ eᵇ ρᶠ⁺ˣ σᶠ⁺ᵃ⁺ˣ tᵉ)]
      [`(,(? symbol? x) . ,ℓʳ) `(,(hash-ref σ (hash-ref ρ x)) ,σ)]))

  (→ e (hash) (hash) empty))

;; ⇑ : ¢ → Racket S-Expression
(define (⇑ ¢)

  ;; ⇑/a : a → Racket S-Expression (Identifier)
  (define (⇑/a a) (string->symbol (~a a)))

  ;; ⇑/v : v → Racket S-Expression
  (define (⇑/v v)
    (match-define `(,f ,ρ) v)
    ;; ↑ : e {x, ...} → Racket S-Expression
    (define (↑ e x*)
      (match e
        [`((λ (,x) ,eᵇ) . ,ℓᶠ) `(λ (,x) ,(↑ eᵇ (set-add x* x)))]
        [`((,eᶠ ,eᵃ) . ,ℓᶜ) `(,(↑ eᶠ x*) ,(↑ eᵃ x*))]
        [`(,(? symbol? x) . ,ℓʳ) #:when (set-member? x* x) x]
        [`(,(? symbol? x) . ,ℓʳ) (⇑/a (hash-ref ρ x))]))
    (↑ f (set)))

  (match-define `(,v ,σ) ¢)
  `(letrec (,@(for/list ([(a v) (in-hash σ)]) `[,(⇑/a a) ,(⇑/v v)]))
     ,(⇑/v v)))

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
