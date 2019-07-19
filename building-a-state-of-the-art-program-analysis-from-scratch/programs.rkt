#lang racket
(provide (all-defined-out))

;; Immediate value
(define identity '(λ (x) x))

;; Simplest function application
(define application '((λ (x) x) #t))

;; Heap-allocated variables (non-local variables)
(define const '(((λ (a) (λ (b) a)) #t) #f))

;; Context-sensitivity · Requires 1CFA
(define identity-called-twice
  '(let ([I (λ (a) a)])
     (I #f)
     (I #t)))

;; Flow-sensitivity · Requires 1CFA?
(define identity-called-twice/first
  '(let* ([I (λ (a) a)]
          [t (I #t)]
          [f (I #f)])
     t))

;; Function as an argument · Even harder context-sensitivity · Requires 2CFA
;; Source: CFA2
(define identity-called-twice/apply
  '(let ([A (λ (f e) (f e))]
         [I (λ (a) a)])
     (A I #f)
     (A I #t)))

;; A simple syntactic transformation that pollutes k-CFA context model
;; Source: CFA2
(define identity-called-twice/η-expanded
  '(let ([I (λ (a) ((λ (b) b) a))])
     (I #f)
     (I #t)))

;; Immediately Invoked Function Expression (IIFE)
;; A common JavaScript idiom that introduces heap-allocated variables, diverting CFA2
(define identity-called-twice/iife
  '(let ([I (λ (a) ((λ () a)))])
     (I #f)
     (I #t)))

;; Interrupted by an unrelated function call
;; Source: m-CFA
(define identity-called-twice/gratuitous-function-call
  '(let* ([do-something (λ () (λ (void) void))]
          [I (λ (a) (do-something) a)])
     (I #f)
     (I #t)))

;; Call-only sensitivity beats call+return sensitivity
;; Source: Allocation Characterizes Polyvariance
(define thaw
  '(let ([I (λ (a) a)]
         [thaw (λ (t) (let ([v (t)]) v))])
     (thaw (λ () (I #f)))
     (thaw (λ () (I #t)))))

;; McCarthy’s ‘amb’ (erratic nondeterminism)
(define amb '(amb #t #f))

;; Tests that a decision holds in subexpressions · Should return either ‘0’ or ‘3’
;; Shallow path-sensitivy
;; Source: ADI (implementation · ‘dd’)
(define conditionals/nested
  '(let ([b (amb #t #f)])
     (if b (if b 0 1) (if b 2 3))))

;; Tests that a decision holds for the remainer of the program · Should return ‘#t’
;; Deep path-sensitivity · DRSF
;; Source: ADI (implementation · ‘dd’)
(define conditionals/parallel
  '(let* ([b (amb #t #f)]
          [x (if b #t #f)]
          [y (if b #f #t)])
     (xor x y)))

;; A program that might make an analysis think there’s recursion where there isn’t
;; Shows the importance of call-return alignment · Confuses 0CFA, but not our analysis (?)
;; Source: ADI (implementation · ‘abiall’)
(define non-recursive-self-application '((λ (f) ((f f) #t)) (λ (x) x)))

;; A very indirect identity function that causes the analysis to revisit a state, so a naïve cycle
;; detection gives an unsound answer.
(define identity&apply-with-self-passing
  '(let ([A (λ (f) (λ (e) ((f (f f)) e)))]
         [I (λ (a) a)])
     ((A (A I)) #t)))

;; Visits same call sites, but in different orders · Inspired by ‘sat’
;; Shows that the lists-of-unique-call-sites context model is more precise than sets-of-call-sites
;; Contains some amount of self-application in how ‘try’ is mentioned in the λ passed to ‘try’,
;; but still typechecks in the simply-typed λ-calculus
(define try
  '(let ([try (λ (f) (or (f #t) (f #f)))]) (try (λ (_) (try (λ (x) (and x (not x))))))))

;; Simplest non-terminating program
(define Ω '(let ([U (λ (f) (f f))]) (U U)))

;; A non-terminating program that allocates infinitely many closures with non-local variables
;; Source: ADI (implementation · ‘potential-count’)
(define Ω/creating-closures '(let ([Uᶜ (λ (f) (λ () f) (f f))]) (Uᶜ Uᶜ)))

;; A non-tail-recursive non-determinating program · Pushes new stack frames
;; Source: ADI (implementation · ‘omega-push’)
(define Ω/pushing-stack-frames '(let ([Uᵖ (λ (f) (f (f f)))]) (Uᵖ Uᵖ)))

(define recurse-once '(let ([f (λ (f b) (if b b ((f f) #t)))]) ((f f) #f)))

(define generic-recursion
  '(let ([predicate? zero?]
         [base-case (const 1)]
         [pre-processing sub1]
         [post-processing *]
         [initial-value 5])
     (letrec ([f (λ (x)
                   (if (predicate? x)
                       (base-case x)
                       (post-processing x (f (pre-processing x)))))])
       (f initial-value))))

;; A recursive function on numbers · The analysis loses precision
(define countdown '(letrec ([countdown (λ (n) (if (zero? n) n (countdown (sub1 n))))]) (countdown 3)))

(define fuzz '(letrec ([fuzz (λ (n) (if (zero? n) n (add1 (fuzz (sub1 n)))))]) (fuzz 3)))

(define black-hole '(letrec ([black-hole (thunk black-hole)]) ((((((((black-hole))))))))))

;; Recurse once · Requires fixed-point calculation
;; Source: ADI (implementation · ‘tricky012’)
(define ambiguous-recursion
  #;'(letrec ([f (λ (n) (if (zero? n) 0 (if (zero? (f (sub1 n))) 1 2)))])
       (f 3))
  '(letrec ([f (λ (b) (if b 0 (if (zero? (f (amb #t #f))) 1 2)))])
     (f (amb #t #f))))

;; I believe this may be an example of why you’d want stack/heap separation *even if* you
;; already have a context model that is precise enough (for example, sets-of-call-sites).
;; Source: CFA2
(define fake-rebinding
  '(let ([compose-same (λ (f x) (f (f x)))]) ___ compose-same ___))

;; Source: CFA2
(define environment-problem
  '(let ([f (λ (x thunk) (if (number? x) (thunk) (λ () x)))]) (f 0 (f "foo" "bar"))))

;; Source: ADI (implementation · ‘abiall’)
(define church-arithmetic '(* 4 4))

(define distributivity-of-multiplication-over-addition '(= (* 2 (+ 1 3)) (+ (* 2 1) (* 2 3))))

(define division-by-zero '(quotient 5 0))

(define traverse-a-literal-list
  '(letrec ([consumer (λ (l) (if (null? l) l (consumer (cdr l))))])
     (consumer (list 1 2 3))))

(define traverse-a-programmatically-generated-list
  '(letrec ([producer (λ (n) (if (zero? n) null (cons #f (producer (sub1 n)))))])
     (letrec ([consumer (λ (l) (if (null? l) l (consumer (cdr l))))])
       (consumer (producer 3)))))

(define (recursion/one-call-site-per-recursive-call n)
  (match-define a* (build-list (add1 n) (λ (i) (string->symbol (~a "a" i)))))
  `(let ([f (λ (p selector)
              ((selector
                (λ () selector)
                ,@(for/list ([a (in-list (drop-right a* 1))])
                    `(λ () (p p (λ (,@a*) ,a)))))))])
     (f f (λ (,@a*) ,(last a*)))))

(define (recursion/single-call-site/one-value-per-recursive-call n)
  (define selector/base '(λ (a0 a1) a0))
  (define selector/recurse '(λ (a0 a1) a1))
  (define selector* (build-list n (λ (i) (string->symbol (~a "selector-" (add1 i))))))
  `(let ([f (λ (p selector-0 ,@selector*)
              ((selector-0
                (λ () selector-0)
                (λ () (p p ,@selector* selector-0)))))])
     (f f ,@(make-list n selector/recurse) ,selector/base)))

(define (recursion/single-call-site/one-value-per-recursive-call/factored n)
  (define selector* (build-list n (λ (i) (string->symbol (~a "selector-" (add1 i))))))
  `(let ([selector/base (λ (a0 a1) a0)]
         [selector/recurse (λ (a0 a1) a1)]
         [f (λ (p selector-0 ,@selector*)
              ((selector-0
                (λ () selector-0)
                (λ () (p p ,@selector* selector-0)))))])
     (f f ,@(make-list n 'selector/recurse) selector/base)))

(define (recursion/single-call-site/single-value n)
  `(let* ([selector/base (λ (a0 a1) a0)]
          [selector/recurse (λ (a0 a1) a1)]
          [cons (λ (x y) (λ (z) (z x y)))]
          [head (λ (p) (p (λ (x y) x)))]
          [tail (λ (p) (p (λ (x y) y)))]
          [traverse (λ (recurse list)
                      (((head list)
                        (λ () list)
                        (λ () (recurse recurse (tail list))))))])
     (traverse traverse
               ,(for/fold ([tail `(cons selector/base selector/base)])
                          ([_ (in-range n)])
                  `(cons selector/recurse ,tail)))))

;; Causes exponential behavior in k-CFA
;; Source: m-CFA
(define (k-cfa-worst-case k)
  (define x* (build-list k (λ (i) (string->symbol (~a "x" (add1 i))))))
  (define y* (build-list k (λ (i) (string->symbol (~a "y" (add1 i))))))
  (for/fold ([e `((λ (z) (z ,@x*)) (λ (,@y*) y1))])
            ([i (in-range k 0 -1)])
    (define fⁱ (string->symbol (~a "f" i)))
    (define xⁱ (string->symbol (~a "x" i)))
    `((λ (,fⁱ) (,fⁱ #f) (,fⁱ #t)) (λ (,xⁱ) ,e))))

;; The classic example of recursion
(define factorial
  '(letrec ([factorial (λ (n) (if (zero? n) 1 (* n (factorial (sub1 n)))))]) (factorial 5)))

;; A brute-force SAT solver
(define sat
  '(let* ([ϕ (λ (x1 x2 x3 x4)
               (and (or x1 (not x2) (not x3))
                    (or (not x2) (not x3))
                    (or x4 x2)))]
          [try (λ (f) (or (f #t) (f #f)))]
          [sat-solve-4
           (λ (p) (try (λ (n1) (try (λ (n2) (try (λ (n3) (try (λ (n4) (p n1 n2 n3 n4))))))))))])
     (sat-solve-4 ϕ)))

(define (recursive-amb size) `(letrec ([f (λ (x) (amb ,@(make-list size '(f f))))]) (f f)))
