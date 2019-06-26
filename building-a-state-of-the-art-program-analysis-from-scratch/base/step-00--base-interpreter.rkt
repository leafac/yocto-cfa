#lang racket

(require "../languages.rkt")
(provide (all-defined-out))

;; ⇒ : e → f
(define (⇒ e)

  ;; substitute : e x f → e
  (define (substitute e xˢ f)
    (match e
      [`((λ (,x) ,eᵇ) . ,ℓᶠ) #:when (equal? xˢ x) e]
      [`((λ (,x) ,eᵇ) . ,ℓᶠ) `((λ (,x) ,(substitute eᵇ xˢ f)) . ,ℓᶠ)]
      [`((,eᶠ ,eᵃ) . ,ℓᶜ) `((,(substitute eᶠ xˢ f) ,(substitute eᵃ xˢ f)) . ,ℓᶜ)]
      [`(,(? symbol? x) . ,ℓʳ) #:when (equal? xˢ x) f]
      [`(,(? symbol? x) . ,ℓʳ) e]))

  (match e
    [`((λ (,x) ,eᵇ) . ,ℓᶠ) e]
    [`((,eᶠ ,eᵃ) . ,ℓᶜ)
     (match-define fᶠ (⇒ eᶠ))
     (match-define fᵃ (⇒ eᵃ))
     (match-define `((λ (,x) ,eᵇ) . ,ℓᶠ) fᶠ)
     (⇒ (substitute eᵇ x fᵃ))]))

;; ⇑ : f → Racket S-Expression
(define (⇑ f)
  ;; ↑ : e → Racket S-Expression
  (define (↑ e)
    (match e
      [`((λ (,x) ,eᵇ) . ,ℓᶠ) `(λ (,x) ,(↑ eᵇ))]
      [`((,eᶠ ,eᵃ) . ,ℓᶜ) `(,(↑ eᶠ) ,(↑ eᵃ))]
      [`(,(? symbol? x) . ,ℓʳ) x]))
  (↑ f))

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
