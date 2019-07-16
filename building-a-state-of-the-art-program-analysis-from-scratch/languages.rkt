#lang racket

(require syntax/parse/define racket/engine rackunit (only-in racket/base [eval raw-eval]))
(provide (all-defined-out))

;; ---------------------------------------------------------------------------------------------------
;; CORE LANGUAGE (ᶜ)
;;
;;          e ::= f | c | r                       Expressions
;;          f ::= ((λ (x) e) . ℓᶠ)                Functions
;;          c ::= ((e e) . ℓᶜ)                    Calls
;;          r ::= (x . ℓʳ)                        Variable References
;;         ℓᵉ ::= ℓᶠ | ℓᶜ | ℓʳ                    Labels
;; ℓᶠ, ℓᶜ, ℓʳ ::= «Disjoint sets of integers»
;;          x ::= «Identifiers»                   Identifiers
;;
;; ---------------------------------------------------------------------------------------------------
;; SURFACE LANGUAGE (ˢ)
;;
;; e ::=                                          Expressions
;;     BOOLEANS
;;     | #t | #f
;;     | (if e e e)
;;     | (and e ...) | (or e ...) | not | xor
;;
;;     NUMBERS
;;     | <non-negative-integers>
;;     | add1 | sub1 | + | (+ e ...) | - | (- e ...{2,})
;;     | zero?
;;     | <= | (<= e ...+) | >= | (>= e ...+)
;;     | = | (= e ...+) | < | (< e ...+) | > | (> e ...+)
;;     | * | (* e ...) | quotient | expt
;;
;;     PAIRS
;;     | null | cons
;;     | null? | car | cdr
;;
;;     LISTS
;;     | empty | (list e ...)
;;     | first | rest
;;     | map
;;
;;     BINDINGS
;;     | (let ([x e] ...) e ...+)
;;     | (let* ([x e] ...) e ...+)
;;     | (letrec ([x e]) e ...+)
;;     | (begin e ...+)
;;
;;     FUNCTIONS
;;     | (λ (x ...) e ...+)
;;     | identity | const | (thunk e)
;;     | (e ...+)
;;     | x
;;
;; x ::= «Identifiers»                            Identifiers
;;
;; ---------------------------------------------------------------------------------------------------
;; COMPILER
;;
;; ‘⇓’ is pronounced ‘compile’.

;; ⇓ : eˢ → eᶜ
(define (⇓ e) (label (encode e)))

;; encode : eˢ → eᶜ⁻ˡ
(define (encode e)
  (define eᵉ (encode¹ e))
  (if (equal? e eᵉ) e (encode eᵉ)))

;; encode¹ : eˢ⁺⁽ᶜ⁻ˡ⁾ → eˢ⁺⁽ᶜ⁻ˡ⁾
(define (encode¹ e)
  (match e
    ;; BOOLEANS
    [`#t `(λ (a b) a)]
    [`#f `(λ (a b) b)]
    [`(if ,eᶜ ,eᵗ ,eᵉ) `((,eᶜ (thunk ,eᵗ) (thunk ,eᵉ)))]
    [`(and) `#t]
    [`(and ,e₁) e₁]
    [`(and ,e₁ ,e₂) `(if ,e₁ ,e₂ #f)]
    [`(and ,e₁ ,e₂ ...) `(and ,e₁ (and ,@e₂))]
    [`(or) `#f]
    [`(or ,e₁) e₁]
    [`(or ,e₁ ,e₂) `(if ,e₁ #t ,e₂)]
    [`(or ,e₁ ,e₂ ...) `(or ,e₁ (or ,@e₂))]
    [`not `(λ (p) (λ (a b) (p b a)))]
    [`xor `(λ (p q) (p (not q) q))]

    ;; NUMBERS
    [(? (λ (n) (and (integer? n) (not (negative? n)))) n)
     `(λ (f) (λ (x) ,(for/fold ([eᵇ `x]) ([i (in-range n)]) `(f ,eᵇ))))]
    [`add1 `(λ (n) (λ (f) (λ (x) (f ((n f) x)))))]
    [`sub1 `(λ (n) (car ((n (λ (x) (let ([p (cdr x)]) (cons p (add1 p))))) (cons 0 0))))]
    [`+ `(λ (m n) ((n add1) m))]
    [`(+) `0]
    [`(+ ,e₁) e₁]
    [`(+ ,e₁ ,e₂) `(,(encode¹ `+) ,e₁ ,e₂)]
    [`(+ ,e₁ ... ,e₂) `(+ (+ ,@e₁) ,e₂)]
    [`- `(λ (m n) ((n sub1) m))]
    [`(- ,e₁ ,e₂) `(,(encode¹ `-) ,e₁ ,e₂)]
    [`(- ,e₁ ... ,e₂) #:when (not (empty? e₁)) `(- (- ,@e₁) ,e₂)]
    [`* `(λ (m n) ((n (λ (a) (+ a m))) (+)))]
    [`(*) `1]
    [`(* ,e₁) e₁]
    [`(* ,e₁ ,e₂) `(,(encode¹ `*) ,e₁ ,e₂)]
    [`(* ,e₁ ... ,e₂) `(* (* ,@e₁) ,e₂)]
    [`quotient `(letrec ([quot (λ (m n) (if (< m n) 0 (add1 (quot (- m n) n))))]) quot)]
    [`expt `(λ (m n) ((n (λ (a) (* a m))) (*)))]
    [`zero? `(λ (n) ((n (λ (x) #f)) #t))]
    [`<= `(λ (m n) (zero? (- m n)))]
    [`(<= ,e₁) `(begin ,e₁ #t)]
    [`(<= ,e₁ ,e₂) `(,(encode¹ `<=) ,e₁ ,e₂)]
    [`(<= ,e₁ ...)
     #:when (not (empty? e₁))
     (let ([x₁ (map (λ (x) (gensym)) e₁)])
       `(let* (,@[map list x₁ e₁])
          (and ,@(map (λ (x₂ x₃) `(<= ,x₂ ,x₃)) (drop-right x₁ 1) (drop x₁ 1)))))]
    [`>= `(λ (m n) (zero? (- n m)))]
    [`(>= ,e₁) `(begin ,e₁ #t)]
    [`(>= ,e₁ ,e₂) `(,(encode¹ `>=) ,e₁ ,e₂)]
    [`(>= ,e₁ ...)
     #:when (not (empty? e₁))
     (let ([x₁ (map (λ (x) (gensym)) e₁)])
       `(let* (,@[map list x₁ e₁])
          (and ,@(map (λ (x₂ x₃) `(>= ,x₂ ,x₃)) (drop-right x₁ 1) (drop x₁ 1)))))]
    [`= `(λ (m n) (and (<= m n) (>= m n)))]
    [`(= ,e₁) `(begin ,e₁ #t)]
    [`(= ,e₁ ,e₂) `(,(encode¹ `=) ,e₁ ,e₂)]
    [`(= ,e₁ ...)
     #:when (not (empty? e₁))
     (let ([x₁ (map (λ (x) (gensym)) e₁)])
       `(let* (,@[map list x₁ e₁])
          (and ,@(map (λ (x₂ x₃) `(= ,x₂ ,x₃)) (drop-right x₁ 1) (drop x₁ 1)))))]
    [`< `(λ (m n) (and (<= m n) (not (= m n))))]
    [`(< ,e₁) `(begin ,e₁ #t)]
    [`(< ,e₁ ,e₂) `(,(encode¹ `<) ,e₁ ,e₂)]
    [`(< ,e₁ ...)
     #:when (not (empty? e₁))
     (let ([x₁ (map (λ (x) (gensym)) e₁)])
       `(let* (,@[map list x₁ e₁])
          (and ,@(map (λ (x₂ x₃) `(< ,x₂ ,x₃)) (drop-right x₁ 1) (drop x₁ 1)))))]
    [`> `(λ (m n) (and (>= m n) (not (= m n))))]
    [`(> ,e₁) `(begin ,e₁ #t)]
    [`(> ,e₁ ,e₂) `(,(encode¹ `>) ,e₁ ,e₂)]
    [`(> ,e₁ ...)
     #:when (not (empty? e₁))
     (let ([x₁ (map (λ (x) (gensym)) e₁)])
       `(let* (,@[map list x₁ e₁])
          (and ,@(map (λ (x₂ x₃) `(> ,x₂ ,x₃)) (drop-right x₁ 1) (drop x₁ 1)))))]

    ;; PAIRS
    [`cons `(λ (a b) (λ (s) (s a b)))]
    [`car `(λ (p) (p (λ (a b) a)))]
    [`cdr `(λ (p) (p (λ (a b) b)))]

    ;; LISTS
    [`null `(λ (s) #t)]
    [`empty `null]
    [`null? `(λ (l) (l (λ (a b) #f)))]
    [`(list) `empty]
    [`(list ,eʰ ,eᵗ ...) `(cons ,eʰ (list ,@eᵗ))]
    [`first `car]
    [`rest `cdr]
    [`map `(letrec ([ma (λ (f l) (if (null? l) l (cons (f (car l)) (ma f (cdr l)))))]) ma)]

    ;; BINDINGS
    [`(let ([,x ,eˣ] ...) ,eᵇ ...) `((λ (,@(reverse x)) ,@eᵇ) ,@(reverse eˣ))]
    [`(let* () ,eᵇ ...) `(let () ,@eᵇ)]
    [`(let* ([,x₁ ,eˣ₁]) ,eᵇ ...) `(let ([,x₁ ,eˣ₁]) ,@eᵇ)]
    [`(let* ([,x₁ ,eˣ₁] [,x₂ ,eˣ₂] ...) ,eᵇ ...)
     `(let ([,x₁ ,eˣ₁]) (let* (,@[map list x₂ eˣ₂]) ,@eᵇ))]
    [`(letrec ([,x ,eˣ]) ,eᵇ ...)
     `(let ([,x ((λ (f) ((λ (x) (f (λ (v) ((x x) v)))) (λ (x) (f (λ (v) ((x x) v))))))
                 (λ (,x) ,eˣ))])
        ,@eᵇ)]
    [`(begin ,eᵇ) eᵇ]
    [`(begin ,eᵇ₁ ,eᵇ₂ ...) `(let ([,(gensym) ,eᵇ₁]) ,@eᵇ₂)]

    ;; FUNCTIONS
    [`(λ (,x) ,eᵇ) `(λ (,x) ,(encode¹ eᵇ))]
    [`(λ (,x) ,eᵇ ...) `(λ (,x) (begin ,@eᵇ))]
    [`(λ () ,eᵇ ...) `(λ (,(gensym)) ,@eᵇ)]
    [`(λ (,x₁ ,x₂ ...) ,eᵇ ...) `(λ (,x₁) (λ (,@x₂) ,@eᵇ))]
    [`identity `(λ (x) x)]
    [`const `(λ (a) (λ (b) a))]
    [`(thunk ,eᵇ) `(λ () ,eᵇ)]
    [`(,eᶠ ,eᵃ) `(,(encode¹ eᶠ) ,(encode¹ eᵃ))]
    [`(,eᶠ) `(,eᶠ null)]
    [`(,eᶠ ,eᵃ₁ ,eᵃ₂ ...) `((,eᶠ ,eᵃ₁) ,@eᵃ₂)]
    [(? symbol? x) x]))

(module+ test
  ;; Smoke test. More thorough tests in ‘ROUNDTRIP TESTS’. 
  (check-match
   (encode
    '(letrec ([factorial (λ (n) (if (zero? n) 1 (* n (factorial (sub1 n)))))])
       (factorial 5)))
   `((λ (factorial) (factorial (λ (f) (λ (x) (f (f (f (f (f x)))))))))
     ((λ (f) ((λ (x) (f (λ (v) ((x x) v)))) (λ (x) (f (λ (v) ((x x) v))))))
      (λ (factorial)
        (λ (n)
          (((((λ (n) ((n (λ (x) (λ (a) (λ (b) b)))) (λ (a) (λ (b) a)))) n)
             (λ (,g2269) (λ (f) (λ (x) (f x)))))
            (λ (,g2270)
              (((λ (m)
                  (λ (n)
                    ((n
                      (λ (a)
                        (((λ (m)
                            (λ (n) ((n (λ (n) (λ (f) (λ (x) (f ((n f) x)))))) m)))
                          a)
                         m)))
                     (λ (f) (λ (x) x)))))
                n)
               (factorial
                ((λ (n)
                   ((λ (p) (p (λ (a) (λ (b) a))))
                    ((n
                      (λ (x)
                        ((λ (p)
                           (((λ (a) (λ (b) (λ (s) ((s a) b)))) p)
                            ((λ (n) (λ (f) (λ (x) (f ((n f) x))))) p)))
                         ((λ (p) (p (λ (a) (λ (b) b)))) x))))
                     (((λ (a) (λ (b) (λ (s) ((s a) b)))) (λ (f) (λ (x) x)))
                      (λ (f) (λ (x) x))))))
                 n)))))
           (λ (s) (λ (a) (λ (b) a))))))))))

;; label : eᶜ⁻ˡ → eᶜ
(define (label e)
  (define current-label 0)
  (define (next-label) (begin0 current-label (set! current-label (add1 current-label))))

  ;; label¹ : eᶜ⁻ˡ → eᶜ
  (define (label¹ e)
    (match e
      [`(λ (,x) ,eᵇ) `((λ (,x) ,(label¹ eᵇ)) . ,(next-label))]
      [`(,eᶠ ,eᵃ) `((,(label¹ eᶠ) ,(label¹ eᵃ)) . ,(next-label))]
      [(? symbol? x) `(,x . ,(next-label))]))

  (label¹ e))

(module+ test
  (check-equal? (label '(λ (x) x)) '((λ (x) (x . 0)) . 1))
  (check-equal? (label '((λ (x) x) (λ (x) x)))
                '((((λ (x) (x . 0)) . 1) ((λ (x) (x . 2)) . 3)) . 4)))

;; ---------------------------------------------------------------------------------------------------
;; DECODERS

;; decoders : Racket Value Encoding → Racket Value Native

(define (decode/boolean e) ((e #t) #f))

(define (decode/number e) ((e add1) 0))

(define ((decode/pair decode/left decode/right) e)
  (cons (decode/left ((eval 'car) e)) (decode/right ((eval 'cdr) e))))

(define ((decode/list decode/element) e)
  (if (decode/boolean ((eval 'null?) e))
      null
      ((decode/pair decode/element (decode/list decode/element)) e)))

;; Tests in ‘ROUNDTRIP TESTS’.

;; ---------------------------------------------------------------------------------------------------
;; EVALUATORS

;; eval : eˢ decoder → Racket Value
(define (eval e [decode identity]) (decode (racket:eval (encode e))))

;; racket:eval : Racket S-Expression → Racket Value
(define (racket:eval e) (raw-eval e namespace))

(define-namespace-anchor namespace-anchor)
(define namespace (namespace-anchor->namespace namespace-anchor))

;; Tests in ‘ROUNDTRIP TESTS’.

;; ---------------------------------------------------------------------------------------------------
;; UTILITIES

(define current-timeout (make-parameter 500))

(define-simple-macro (timeout e:expr ...)
  (let ([the-engine (engine (λ (_) e ...))])
    (if (engine-run (current-timeout) the-engine) (engine-result the-engine) 'timeout)))

(module+ test
  (check-equal? (timeout 'a) 'a)
  (check-equal? (timeout (sleep 10) 'a) 'timeout))

(define (check-incomputable thunk)
  (parameterize ([current-timeout 1000]) (check-equal? (timeout (thunk)) 'timeout)))

(module+ test
  (check-incomputable (thunk ((λ (x) (x x)) (λ (x) (x x))))))

;; ---------------------------------------------------------------------------------------------------
;; ROUNDTRIP TESTS

(module+ test

  ;; BOOLEANS
  (check-equal? (eval '#t decode/boolean) '#t)
  (check-equal? (eval '#f decode/boolean) '#f)
  (check-equal? (eval '(if #t #t #f) decode/boolean) '#t)
  (check-equal? (eval '(if #f #t #f) decode/boolean) '#f)
  (check-equal? (eval '(if #t #t (letrec ([f (λ (x) (f x))]) (f 0))) decode/boolean) '#t)
  (check-equal? (eval '(and) decode/boolean) '#t)
  (check-equal? (eval '(and #t) decode/boolean) '#t)
  (check-equal? (eval '(and #t #t) decode/boolean) '#t)
  (check-equal? (eval '(and #t #f) decode/boolean) '#f)
  (check-equal? (eval '(and #f (letrec ([f (λ (x) (f x))]) (f 0))) decode/boolean) '#f)
  (check-equal? (eval '(and #t #f #t) decode/boolean) '#f)
  (check-equal? (eval '(or) decode/boolean) '#f)
  (check-equal? (eval '(or #t) decode/boolean) '#t)
  (check-equal? (eval '(or #f #f) decode/boolean) '#f)
  (check-equal? (eval '(or #t #f) decode/boolean) '#t)
  (check-equal? (eval '(or #t (letrec ([f (λ (x) (f x))]) (f 0))) decode/boolean) '#t)
  (check-equal? (eval '(or #t #f #t) decode/boolean) '#t)
  (check-equal? (eval '(not #f) decode/boolean) '#t)
  (check-equal? (eval '(not #t) decode/boolean) '#f)
  (check-equal? (eval '(xor #t #f) decode/boolean) '#t)
  (check-equal? (eval '(xor #t #t) decode/boolean) '#f)

  ;; NUMBERS
  (check-equal? (eval '0 decode/number) '0)
  (check-equal? (eval '5 decode/number) '5)
  (check-equal? (eval '(add1 1) decode/number) '2)
  (check-equal? (eval '(sub1 5) decode/number) '4)
  (check-equal? (eval '(+) decode/number) '0)
  (check-equal? (eval '(+ 0) decode/number) '0)
  (check-equal? (eval '(+ 0 1) decode/number) '1)
  (check-equal? (eval '(+ 0 1 2) decode/number) '3)
  (check-equal? (eval '(- 3 2) decode/number) '1)
  (check-equal? (eval '(- 3 2 1) decode/number) '0)
  (check-equal? (eval '(*) decode/number) '1)
  (check-equal? (eval '(* 3) decode/number) '3)
  (check-equal? (eval '(* 3 2) decode/number) '6)
  (check-equal? (eval '(* 3 2 1) decode/number) '6)
  (check-equal? (eval '(quotient 5 2) decode/number) '2)
  (check-equal? (eval '(quotient 5 5) decode/number) '1)
  (check-equal? (eval '(expt 5 2) decode/number) '25)
  (check-equal? (eval '(zero? 0) decode/boolean) '#t)
  (check-equal? (eval '(zero? 5) decode/boolean) '#f)
  (check-equal? (eval '(<= 3) decode/boolean) '#t)
  (check-equal? (eval '(<= 3 2) decode/boolean) '#f)
  (check-equal? (eval '(<= 2 3) decode/boolean) '#t)
  (check-equal? (eval '(<= 3 2 1) decode/boolean) '#f)
  (check-equal? (eval '(>= 3) decode/boolean) '#t)
  (check-equal? (eval '(>= 3 2) decode/boolean) '#t)
  (check-equal? (eval '(>= 2 3) decode/boolean) '#f)
  (check-equal? (eval '(>= 3 2 1) decode/boolean) '#t)
  (check-equal? (eval '(= 3) decode/boolean) '#t)
  (check-equal? (eval '(= 3 2) decode/boolean) '#f)
  (check-equal? (eval '(= 3 3) decode/boolean) '#t)
  (check-equal? (eval '(= 3 2 1) decode/boolean) '#f)
  (check-equal? (eval '(< 3) decode/boolean) '#t)
  (check-equal? (eval '(< 3 2) decode/boolean) '#f)
  (check-equal? (eval '(< 2 3) decode/boolean) '#t)
  (check-equal? (eval '(< 3 2 1) decode/boolean) '#f)
  (check-equal? (eval '(> 3) decode/boolean) '#t)
  (check-equal? (eval '(> 3 2) decode/boolean) '#t)
  (check-equal? (eval '(> 2 3) decode/boolean) '#f)
  (check-equal? (eval '(> 3 2 1) decode/boolean) '#t)

  ;; PAIRS
  (check-equal? (eval '(cons #t 5) (decode/pair decode/boolean decode/number)) '(#t . 5))
  (check-equal? (eval '(car (cons #t 5)) decode/boolean) '#t)
  (check-equal? (eval '(cdr (cons #t 5)) decode/number) '5)

  ;; LISTS
  (check-equal? (eval 'null (decode/list decode/number)) '())
  (check-equal? (eval 'empty (decode/list decode/number)) '())
  (check-equal? (eval '(null? null) decode/boolean) '#t)
  (check-equal? (eval '(null? (cons #t 5)) decode/boolean) '#f)
  (check-equal? (eval '(list) (decode/list decode/number)) '())
  (check-equal? (eval '(list 1) (decode/list decode/number)) '(1))
  (check-equal? (eval '(list 1 2) (decode/list decode/number)) '(1 2))
  (check-equal? (eval '(first (list 1 2)) decode/number) '1)
  (check-equal? (eval '(rest (list 1 2)) (decode/list decode/number)) '(2))
  (check-equal? (eval '(map add1 (list 1 2)) (decode/list decode/number)) '(2 3))

  ;; BINDINGS
  (check-equal? (eval '(let () 5) decode/number) '5)
  (check-equal? (eval '(let ([a 5]) a) decode/number) '5)
  (check-equal? (eval '(let ([a 5] [b 4]) b) decode/number) '4)
  (check-equal? (eval '(let* () 5) decode/number) '5)
  (check-equal? (eval '(let* ([a 5]) a) decode/number) '5)
  (check-equal? (eval '(let* ([a 5] [b a]) b) decode/number) '5)
  (check-equal? (eval
                 '(letrec ([factorial (λ (n) (if (zero? n) 1 (* n (factorial (sub1 n)))))])
                    (factorial 5))
                 decode/number)
                '120)
  (check-equal? (eval '(begin 0) decode/number) '0)
  (check-equal? (eval '(begin 0 1) decode/number) '1)

  ;; FUNCTIONS
  (check-equal? ((eval '(λ (x) x)) 5) '5)
  (check-equal? ((eval '(λ (x) null x)) 5) '5)
  (check-equal? (decode/number ((eval '(λ () 5)) null)) '5)
  (check-equal? (((eval '(λ (x y) x)) 5) null) '5)
  (check-equal? (eval '(identity 5) decode/number) '5)
  (check-equal? (decode/number ((eval '(const 5)) null)) '5)
  (check-equal? (decode/number ((eval '(thunk 5)) null)) '5)
  (check-equal? (eval '((λ (x) x) 5) decode/number) '5)
  (check-equal? (eval '((λ () 5)) decode/number) '5)
  (check-equal? (eval '((λ (a b) a) 5 null) decode/number) '5))
