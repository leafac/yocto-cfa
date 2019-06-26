#lang racket

(require racket/hash (only-in racket/control reset) "../languages.rkt")
(provide (all-defined-out))

;; Σ ::= {ς, ...}                                 Visited States
;; ς ::= ⟨ℓᵉ, ρ, σ, t⟩                            States
;; £ ::= {¢, ...}                                 Result Sets
;; ¢ ::= ⟨d, σ⟩                                   Results
;; d ::= {v, ...}                                 Denotable Values
;; v ::= ⟨f, ρ⟩                                   Values
;; ρ ::= [x ↦ a, ...]                             Environments
;; σ ::= [a ↦ d, ...]                             Stores
;; a ::= ⟨ℓᶠ, t⟩                                  Addresses
;; t ::= [ℓᶜ, ...] «List of unique elements»      Time Stamps

;; ⇒ : e → £
(define (⇒ e)
  (define Σ (mutable-set))

  ;; → : e ρ σ t → £
  (define (→ e ρ σ t)
    (define ς `(,(cdr e) ,ρ ,σ ,t))
    (set-add! Σ ς)
    (match e
      [`((λ (,x) ,eᵇ) . ,ℓᶠ) (set `(,(set `(,e ,ρ)) ,σ))]
      [`((,eᶠ ,eᵃ) . ,ℓᶜ)
       (match-define tᵉ (if (member ℓᶜ t) t (cons ℓᶜ t)))
       (apply
        set-union
        (for*/list ([¢ᶠ (in-set (→ eᶠ ρ σ tᵉ))]
                    [¢ᵃ (in-set (→ eᵃ ρ (second ¢ᶠ) tᵉ))]
                    [vᶠ (in-set (first ¢ᶠ))]
                    [vᵃ (in-set (first ¢ᵃ))])
          (match-define `(((λ (,x) ,eᵇ) . ,ℓᶠ) ,ρᶠ) vᶠ)
          (match-define σᶠ⁺ᵃ (second ¢ᵃ))
          (match-define a `(,ℓᶠ ,tᵉ))
          (match-define ρᶠ⁺ˣ (hash-set ρᶠ x a))
          (match-define σᶠ⁺ᵃ⁺ˣ (hash-union σᶠ⁺ᵃ (hash a (set vᵃ)) #:combine set-union))
          (→ eᵇ ρᶠ⁺ˣ σᶠ⁺ᵃ⁺ˣ tᵉ)))]
      [`(,(? symbol? x) . ,ℓʳ) (set `(,(hash-ref σ (hash-ref ρ x)) ,σ))]))

  (→ e (hash) (hash) empty))

;; ⇑ : £ → Racket S-Expression
(define (⇑ £)

  ;; ⇑/¢ : ¢ → Racket S-Expression
  (define (⇑/¢ ¢)
    (match-define `(,d ,σ) ¢)
    `(letrec (,@(for/list ([(a d) (in-hash σ)])
                  (define xᵏ (gensym))
                  `[,(⇑/a a)
                    (thunk (shift ,xᵏ (set-union ,@(for/list ([v (in-set d)])
                                                     `(,xᵏ ,(⇑/v v))))))]))
       (set ,@(set-map d ⇑/v))))

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
        [`(,(? symbol? x) . ,ℓʳ) `(,(⇑/a (hash-ref ρ x)))]))
    (↑ f (set)))

  `(begin (require (only-in racket/control shift))
          (set-union ,@(for/list ([¢ (in-set £)]) (⇑/¢ ¢)))))

;; eval : eˢ decoder → Racket Value
(define (eval e [decode identity])
  (apply set-union
         (for/list ([eʳ (in-set (racket:eval (⇑ (⇒ (⇓ e)))))])
           (reset (set (decode eʳ))))))

(module+ test
  (require rackunit "../programs.rkt")

  (check-equal? (eval identity (λ (f) (f #t))) (set #t))
  (check-equal? (eval application decode/boolean) (set #t))
  (check-equal? (eval const decode/boolean) (set #t))
  (check-equal? (eval identity-called-twice decode/boolean) (set #t))
  (check-equal? (eval identity-called-twice/apply decode/boolean) (set #t))
  (check-equal? (eval identity-called-twice/η-expanded decode/boolean) (set #t))
  (check-equal? (eval identity-called-twice/iife decode/boolean) (set #t))
  (check-equal? (eval non-recursive-self-application decode/boolean) (set #t))
  (check-incomputable (thunk (eval identity&apply-with-self-passing decode/boolean)))
  (check-equal? (eval try decode/boolean) (set #f))
  (check-incomputable (thunk (eval Ω)))
  (check-incomputable (thunk (eval Ω/creating-closures)))
  (check-incomputable (thunk (eval Ω/pushing-stack-frames)))
  (check-incomputable (thunk (eval countdown decode/number)))
  (check-equal? (eval church-arithmetic decode/number) (set 16))
  (check-equal? (eval sat decode/boolean) (set #t)))
