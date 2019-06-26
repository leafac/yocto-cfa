#lang racket

(require racket/hash (only-in racket/control reset) "../languages.rkt")
(provide (all-defined-out))

;; $ ::= [ς ↦ £, ...]                             Caches
;; Σ ::= {ς, ...}                                 Visited States
;; ς ::= ⟨ℓᵉ, ρ, σ, t⟩                            States
;; £ ::= {¢, ...}                                 Result Sets
;; ¢ ::= ⟨d, σ⟩                                   Results
;; d ::= {v, ...}                                 Denotable Values
;; v ::= ⟨f, ρ⟩                                   Values
;; ρ ::= [x ↦ a, ...]                             Environments
;; σ ::= [a ↦ d, ...]                             Stores
;; a ::= ⟨ℓᶠ, t⟩                                  Addresses
;; t ::= [ℓᶜ, ...] «Truncated to ‘k’ elements»    Time Stamps
;; k ::= «Nonnegative-integer»                    Maximum Time Stamp Size

;; ⇒ : k e → £
(define (⇒ k e)
  (define Σ (mutable-set))
  (define $ (make-hash))

  ;; → : e ρ σ t → £
  (define (→ e ρ σ t)
    (define ς `(,(cdr e) ,ρ ,σ ,t))
    (define £
      (cond
        [(and (set-member? Σ ς) (hash-has-key? $ ς))
         (for/set ([¢ (in-set (hash-ref $ ς))])
           (match-define `(,dᶜ ,σᶜ) ¢)
           (match-define σ+σᶜ (hash-union σ σᶜ #:combine set-union))
           `(,dᶜ ,σ+σᶜ))]
        [(set-member? Σ ς) (set)]
        [else
         (set-add! Σ ς)
         (match e
           [`((λ (,x) ,eᵇ) . ,ℓᶠ) (set `(,(set `(,e ,ρ)) ,σ))]
           [`((,eᶠ ,eᵃ) . ,ℓᶜ)
            (match-define tᵉ (take (cons ℓᶜ t) (min k (add1 (length t)))))
            (apply
             set-union
             (set)
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
           [`(,(? symbol? x) . ,ℓʳ) (set `(,(hash-ref σ (hash-ref ρ x)) ,σ))])]))
    (hash-union! $ (hash ς £) #:combine set-union)
    £)

  ;; fixed-point : → £
  (define (fixed-point)
    (define previous-$ (make-immutable-hash (hash->list $)))
    (set-clear! Σ)
    (define £ (→ e (hash) (hash) empty))
    (define current-$ (make-immutable-hash (hash->list $)))
    (if (equal? previous-$ current-$) £ (fixed-point)))

  (fixed-point))

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
          (set-union (set) ,@(for/list ([¢ (in-set £)]) (⇑/¢ ¢)))))

;; eval : k eˢ decoder → Racket Value
(define (eval k e [decode identity])
  (apply set-union (set)
         (for/list ([eʳ (in-set (racket:eval (⇑ (⇒ k (⇓ e)))))])
           (define s (timeout (reset (set (decode eʳ)))))
           (if (equal? s 'timeout) (set '⊤) s))))

(module+ test
  (require rackunit "../programs.rkt")

  (check-equal? (eval 0 identity (λ (f) (f #t))) (set #t))
  (check-equal? (eval 0 application decode/boolean) (set #t))
  (check-equal? (eval 0 const decode/boolean) (set #t))
  (check-equal? (eval 0 identity-called-twice decode/boolean) (set #t #f))
  (check-equal? (eval 1 identity-called-twice decode/boolean) (set #t))
  (check-equal? (eval 0 identity-called-twice/apply decode/boolean) (set #t #f))
  (check-equal? (eval 1 identity-called-twice/apply decode/boolean) (set #t #f))
  (check-equal? (eval 2 identity-called-twice/apply decode/boolean) (set #t))
  (check-equal? (eval 0 identity-called-twice/η-expanded decode/boolean) (set #t #f))
  (check-equal? (eval 1 identity-called-twice/η-expanded decode/boolean) (set #t #f))
  (check-equal? (eval 2 identity-called-twice/η-expanded decode/boolean) (set #t))
  (check-equal? (eval 0 identity-called-twice/iife decode/boolean) (set #t #f))
  (check-equal? (eval 1 identity-called-twice/iife decode/boolean) (set #t))
  (check-equal? (set-count (eval 0 non-recursive-self-application)) 2)
  (check-equal? (eval 1 non-recursive-self-application decode/boolean) (set #t))
  #;(check-equal? (set-count (eval 0 identity&apply-with-self-passing)) 2) ;; SLOW & UNVERIFIED
  (check-equal? (set-count (eval 1 identity&apply-with-self-passing)) 2)
  (check-equal? (eval 2 identity&apply-with-self-passing decode/boolean) (set #t))
  #;(check-equal? (eval 0 try decode/boolean) (set #t #f)) ;; SLOW & UNVERIFIED
  (check-equal? (eval 1 try decode/boolean) (set #f))
  (check-equal? (eval 0 Ω) (set))
  (check-equal? (eval 0 Ω/creating-closures) (set))
  (check-equal? (eval 0 Ω/pushing-stack-frames) (set))
  #;(check-equal? (eval 0 countdown decode/number) (set '⊤)) ;; SLOW & UNVERIFIED
  (check-equal? (eval 10 countdown decode/number) (set 0))
  #;(check-equal? (eval 0 church-arithmetic decode/number) (set '⊤)) ;; SLOW & UNVERIFIED
  (check-equal? (eval 7 church-arithmetic decode/number) (set 16))
  #;(check-equal? (eval 0 sat decode/boolean) (set #t #f)) ;; SLOW & UNVERIFIED
  (check-equal? (eval 13 sat decode/boolean) (set #t)))
