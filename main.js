/* ============================================================
   main.js — Trigonometrie Clasa a IX-a
   Script unificat: global (navbar, hero, quiz, etc.) +
   calculator-unghiuri + cerc-trigonometric.
   Fiecare modul de pagină este izolat într-un IIFE și verifică
   existența elementelor proprii înainte de a rula.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ====================================================
    // HELPERS PARTAJAȚI (calculator + cerc trigonometric)
    // ====================================================
    function fmt(v, decimals = 4) {
        if (!Number.isFinite(v)) return String(v);
        const rounded = Number(v.toFixed(decimals));
        if (Object.is(rounded, -0)) return '0';
        if (Number.isInteger(rounded)) return String(rounded);
        return rounded.toFixed(decimals);
    }

    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

    function radAsPi(deg) {
        const normDeg = ((deg % 360) + 360) % 360;
        if (Math.abs(normDeg) < 1e-6) return '0';
        for (let q = 1; q <= 12; q++) {
            const p = (normDeg * q) / 180;
            const pRound = Math.round(p);
            if (Math.abs(p - pRound) < 1e-4 && pRound > 0) {
                const g = gcd(pRound, q);
                const num = pRound / g;
                const den = q / g;
                const numStr = num === 1 ? 'π' : `${num}π`;
                return den === 1 ? numStr : `${numStr}/${den}`;
            }
        }
        return null;
    }

    const EXACT_SIN = {
        0: '0', 30: '1/2', 45: '√2/2', 60: '√3/2', 90: '1',
        120: '√3/2', 135: '√2/2', 150: '1/2', 180: '0',
        210: '-1/2', 225: '-√2/2', 240: '-√3/2', 270: '-1',
        300: '-√3/2', 315: '-√2/2', 330: '-1/2'
    };
    const EXACT_COS = {
        0: '1', 30: '√3/2', 45: '√2/2', 60: '1/2', 90: '0',
        120: '-1/2', 135: '-√2/2', 150: '-√3/2', 180: '-1',
        210: '-√3/2', 225: '-√2/2', 240: '-1/2', 270: '0',
        300: '1/2', 315: '√2/2', 330: '√3/2'
    };
    const EXACT_TAN = {
        0: '0', 30: '√3/3', 45: '1', 60: '√3',
        120: '-√3', 135: '-1', 150: '-√3/3', 180: '0',
        210: '√3/3', 225: '1', 240: '√3',
        300: '-√3', 315: '-1', 330: '-√3/3'
    };
    const EXACT_COT = {
        30: '√3', 45: '1', 60: '√3/3', 90: '0',
        120: '-√3/3', 135: '-1', 150: '-√3',
        210: '√3', 225: '1', 240: '√3/3', 270: '0',
        300: '-√3/3', 315: '-1', 330: '-√3'
    };

    function getExact(table, deg) {
        const normDeg = ((deg % 360) + 360) % 360;
        for (const key of Object.keys(table)) {
            if (Math.abs(normDeg - Number(key)) < 1e-4) return table[key];
        }
        return null;
    }

    function withExact(exact, decimalStr) {
        if (exact === null) return decimalStr;
        if (/^-?\d+$/.test(exact)) return exact;
        return `${exact} (${decimalStr})`;
    }


    // ====================================================
    // 1. NAVBAR — Scroll effect & active link highlight
    // ====================================================
    const header = document.getElementById('mainHeader');

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // Auto-highlight current page link
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav ul li a').forEach(link => {
        const linkFile = link.getAttribute('href').split('/').pop();
        if (linkFile === currentFile) {
            link.classList.add('active');
        }
    });


    // ====================================================
    // 2. MOBILE MENU TOGGLE
    // ====================================================
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = mainNav.classList.toggle('is-open');
            menuToggle.setAttribute('aria-expanded', isOpen);
            menuToggle.textContent = isOpen ? '✕' : '☰';
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
                mainNav.classList.remove('is-open');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.textContent = '☰';
            }
        });

        // Close on nav link click (mobile)
        mainNav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                mainNav.classList.remove('is-open');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.textContent = '☰';
            });
        });
    }


    // ====================================================
    // 3. HERO PARTICLE CANVAS
    // ====================================================
    const particleCanvas = document.getElementById('particleCanvas');
    if (particleCanvas) {
        const ctx = particleCanvas.getContext('2d');

        const resize = () => {
            particleCanvas.width = particleCanvas.parentElement.clientWidth;
            particleCanvas.height = particleCanvas.parentElement.clientHeight;
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        // Math symbols for floating particles
        const SYMBOLS = ['sin', 'cos', 'tg', 'ctg', 'π', 'α', 'β', 'θ', '∫', '∑', '√', '∞', '°', '≈'];

        const NUM_PARTICLES = 50;
        const particles = Array.from({ length: NUM_PARTICLES }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            symbol: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
            size: 10 + Math.random() * 14,
            alpha: 0.1 + Math.random() * 0.3,
            color: Math.random() > 0.5 ? '#3b82f6' : '#06b6d4',
        }));

        let animId;
        const animate = () => {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges
                if (p.x < -40) p.x = particleCanvas.width + 40;
                if (p.x > particleCanvas.width + 40) p.x = -40;
                if (p.y < -40) p.y = particleCanvas.height + 40;
                if (p.y > particleCanvas.height + 40) p.y = -40;

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.font = `${p.size}px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(p.symbol, p.x, p.y);
                ctx.restore();
            });

            animId = requestAnimationFrame(animate);
        };

        animate();

        // Pause when tab is hidden (performance)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cancelAnimationFrame(animId);
            else animate();
        });
    }


    // ====================================================
    // 4. SCROLL-TO-TOP BUTTON
    // ====================================================
    const scrollBtn = document.getElementById('scrollToTopBtn');

    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollBtn.classList.add('show');
                scrollBtn.style.display = 'flex';
            } else {
                scrollBtn.classList.remove('show');
                setTimeout(() => {
                    if (!scrollBtn.classList.contains('show')) scrollBtn.style.display = 'none';
                }, 350);
            }
        }, { passive: true });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // ====================================================
    // 5. FADE-SLIDE-IN FOR SECTIONS (Intersection Observer)
    // ====================================================
    const fadeEls = document.querySelectorAll('.fade-slide-in');

    if (fadeEls.length > 0) {
        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        fadeEls.forEach(el => io.observe(el));
    }

    // Also apply to sections dynamically
    document.querySelectorAll('main section:not(.fade-slide-in)').forEach(section => {
        section.classList.add('fade-slide-in');
        if (section.getBoundingClientRect().top < window.innerHeight) {
            section.classList.add('visible');
        }
    });


    // ====================================================
    // 6. RIPPLE EFFECT ON BUTTONS
    // ====================================================
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button, .btn, .button');
        if (!btn) return;

        const circle = document.createElement('span');
        const diameter = Math.max(btn.clientWidth, btn.clientHeight);
        const radius = diameter / 2;
        const rect = btn.getBoundingClientRect();

        circle.style.cssText = `
            width: ${diameter}px;
            height: ${diameter}px;
            left: ${e.clientX - rect.left - radius}px;
            top: ${e.clientY - rect.top - radius}px;
        `;
        circle.classList.add('ripple');

        btn.querySelector('.ripple')?.remove();
        btn.appendChild(circle);
    });


    // ====================================================
    // 7. CURIOZITĂȚI — Facts Rotator
    // ====================================================
    const facts = [
        "Cuvântul '<strong>trigonometrie</strong>' vine din greacă: <em>tri</em> (trei) + <em>gonia</em> (unghi) + <em>metron</em> (măsură) — adică <strong>măsurarea celor trei unghiuri ale triunghiului</strong>.",
        "Trigonometria a fost inițial dezvoltată pentru a rezolva probleme de <strong>astronomie și navigație</strong>.",
        "Matematicianul grec <strong>Hiparh din Niceea</strong> (aprox. 190–120 î.e.n.) este considerat <strong>părintele trigonometriei</strong>.",
        "Cuvântul '<strong>sinus</strong>' provine dintr-o eroare de traducere a termenului sanscrit <em>jyā</em>, prin arabă (<em>jaib</em>) și latină (<em>sinus</em>).",
        "Denumirea '<strong>cosinus</strong>' înseamnă literal <em>sinusul complementului</em>: \\(\\cos\\alpha = \\sin(90° - \\alpha)\\).",
        "Identitatea fundamentală \\(\\sin^2\\alpha + \\cos^2\\alpha = 1\\) nu este altceva decât <strong>teorema lui Pitagora</strong> aplicată pe cercul trigonometric de rază 1.",
    ];

    const curiosityList = document.getElementById('curiosityList');
    if (curiosityList) {
        curiosityList.innerHTML = facts.map(f => `<li>${f}</li>`).join('');
        if (window.MathJax && window.MathJax.typesetPromise) MathJax.typesetPromise([curiosityList]);
    }


    // ====================================================
    // 8. APLICAȚII PRACTICE — Dynamic List
    // ====================================================
    const applications = [
        "<strong>🔭 Astronomie:</strong> Calcul poziții stelare, distanțe în spațiu, orbite planetare.",
        "<strong>🧭 Navigație:</strong> GPS, triangulație, navigație maritimă și aeriană.",
        "<strong>🏗️ Arhitectură & Inginerie:</strong> Pante, înclinații, calculul structurilor.",
        "<strong>🎵 Muzică:</strong> Analiza și sinteza undelor sonore (sintetiratoare, MP3).",
        "<strong>🎮 Grafică & Jocuri:</strong> Rotații 3D, perspective, animații cinematice.",
        "<strong>🏥 Medicină:</strong> Imagistică RMN și CT, semnale EKG.",
    ];

    const appList = document.getElementById('applicationList');
    if (appList) {
        appList.innerHTML = applications.map(app => `<li>${app}</li>`).join('');
    }


    // ====================================================
    // 9. QUIZ LOGIC
    // ====================================================
    const quizContainer = document.getElementById('trigonometricQuiz');
    const submitBtn = document.getElementById('submitQuiz');
    const quizResult = document.getElementById('quizResult');
    const restartBtn = document.getElementById('restartQuiz');
    const quizScore = document.getElementById('quizScore');

    const questions = [
        {
            question: "Cine este considerat \"părintele trigonometriei\"?",
            answers: { a: "Pitagora", b: "Hiparh din Niceea", c: "Euclid" },
            correct: "b"
        },
        {
            question: "Trigonometria a fost inițial dezvoltată pentru rezolvarea de probleme din domeniile:",
            answers: { a: "Comerț și economie", b: "Astronomie și navigație", c: "Agricultură și irigații" },
            correct: "b"
        },
        {
            question: "Din ce limbă provine termenul sanscrit 'jyā' care a generat cuvântul 'sinus'?",
            answers: { a: "Greacă", b: "Latină", c: "Arabă" },
            correct: "c"
        },
        {
            question: "Trigonometria este utilizată în muzică pentru:",
            answers: { a: "Compunerea armoniilor", b: "Analiza undelor sinusoidale", c: "Notarea muzicală" },
            correct: "b"
        },
        {
            question: "Care este relația fundamentală dintre \\(\\sin\\) și \\(\\cos\\)?",
            answers: {
                a: "\\(\\sin^2\\alpha + \\cos^2\\alpha = 1\\)",
                b: "\\(\\sin\\alpha \\cdot \\cos\\alpha = 1\\)",
                c: "\\(\\sin\\alpha + \\cos\\alpha = 1\\)"
            },
            correct: "a"
        }
    ];

    let quizScore_ = 0;

    function loadQuiz() {
        if (!quizContainer) return;
        quizContainer.innerHTML = '';
        questions.forEach((q, i) => {
            const answersHtml = Object.entries(q.answers).map(([key, val]) =>
                `<label>
                    <input type="radio" name="q${i}" value="${key}">
                    ${val}
                </label>`
            ).join('');

            quizContainer.insertAdjacentHTML('beforeend', `
                <div class="question-item" data-qi="${i}">
                    <h3>${i + 1}. ${q.question}</h3>
                    <div class="answers">${answersHtml}</div>
                </div>
            `);
        });

        if (quizResult) quizResult.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'block';
        if (window.MathJax && window.MathJax.typesetPromise) MathJax.typesetPromise([quizContainer]);
    }

    function checkAnswers() {
        if (!quizContainer) return;
        quizScore_ = 0;
        let allAnswered = true;

        questions.forEach((q, i) => {
            const item = quizContainer.querySelector(`[data-qi="${i}"]`);
            const selected = quizContainer.querySelector(`input[name="q${i}"]:checked`);

            if (!item) return;
            item.classList.remove('correct', 'incorrect', 'missing-answer');
            item.querySelector('.answer-feedback')?.remove();

            if (selected) {
                if (selected.value === q.correct) {
                    quizScore_++;
                    item.classList.add('correct');
                } else {
                    item.classList.add('incorrect');
                    const fb = document.createElement('div');
                    fb.className = 'answer-feedback';
                    fb.style.cssText = 'margin-top:8px; font-size:0.85rem; color:#fd79a8; font-style:italic;';
                    fb.innerHTML = `✖ Răspuns corect: <strong>${q.answers[q.correct]}</strong>`;
                    item.appendChild(fb);
                }
            } else {
                allAnswered = false;
                item.classList.add('missing-answer');
                item.style.borderColor = 'rgba(253,121,168,0.4)';
            }
        });

        if (!allAnswered) {
            if (quizResult && quizScore) {
                quizResult.style.display = 'block';
                quizResult.className = 'quiz-results';
                quizScore.textContent = '⚠ Răspunde la toate întrebările înainte de a verifica!';
                quizScore.style.cssText = 'font-size:1rem; color: var(--clr-accent); background: none; -webkit-text-fill-color: unset;';
            }
            return;
        }

        displayResult();
    }

    function displayResult() {
        if (!quizResult || !quizScore) return;
        const pct = Math.round((quizScore_ / questions.length) * 100);
        const emoji = quizScore_ === questions.length ? '🏆' : quizScore_ >= questions.length / 2 ? '👍' : '📚';
        quizResult.style.display = 'block';
        quizResult.className = 'quiz-results';
        quizScore.innerHTML = `${emoji} ${quizScore_} / ${questions.length} puncte — ${pct}%`;
        quizScore.style.cssText = '';
        if (submitBtn) submitBtn.style.display = 'none';
    }

    if (submitBtn) submitBtn.addEventListener('click', checkAnswers);
    if (restartBtn) restartBtn.addEventListener('click', loadQuiz);

    if (quizContainer) loadQuiz();

    // ====================================================
    // 10. FEATURE CARD — Apply .fade-slide-in automatically
    // ====================================================
    document.querySelectorAll('.feature-card, .stat-item').forEach((card, i) => {
        card.classList.add('fade-slide-in');
        card.style.transitionDelay = `${i * 0.07}s`;
        if (card.getBoundingClientRect().top < window.innerHeight) {
            card.classList.add('visible');
        }
    });

    // Re-observe cards with IO
    const cardIO = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05 });

    document.querySelectorAll('.feature-card, .stat-item, .function-card').forEach(el => cardIO.observe(el));


    // ====================================================
    // 11. CALCULATOR UNGHIURI (rulează doar pe pagina calculator)
    // ====================================================
    (function initCalculatorUnghiuri() {
        const angleInput = document.getElementById('angleInputCalc');
        const angleUnit = document.getElementById('angleUnit');
        const calculateBtn = document.getElementById('calculateBtn');
        if (!calculateBtn || !angleInput || !angleUnit) return;

        const displayAngleRad = document.getElementById('displayAngleRad');
        const displayAngleDeg = document.getElementById('displayAngleDeg');
        const resultSin = document.getElementById('resultSin');
        const resultCos = document.getElementById('resultCos');
        const resultTg = document.getElementById('resultTg');
        const resultCtg = document.getElementById('resultCtg');
        const calculatorError = document.getElementById('calculatorError');

        function updateInputHint() {
            const unit = angleUnit.value;
            if (unit === 'degrees') {
                angleInput.placeholder = 'ex: 30';
            } else if (unit === 'radians') {
                angleInput.placeholder = 'ex: 1.5708';
            } else {
                angleInput.placeholder = 'ex: 0.5  (= π/2)';
            }
        }

        function resetResults() {
            displayAngleDeg.textContent = '';
            displayAngleRad.textContent = '';
            resultSin.textContent = '';
            resultCos.textContent = '';
            resultTg.textContent = '';
            resultCtg.textContent = '';
        }

        function calculateTrigonometricValues() {
            let angleValue = parseFloat(angleInput.value);
            const unit = angleUnit.value;
            let angleInRadians;
            let angleInDegrees;

            if (isNaN(angleValue)) {
                calculatorError.textContent = "Introduceți un număr valid pentru unghi!";
                calculatorError.style.display = 'block';
                resetResults();
                return;
            } else {
                calculatorError.style.display = 'none';
            }

            if (unit === 'degrees') {
                angleInDegrees = angleValue;
                angleInRadians = angleValue * Math.PI / 180;
            } else if (unit === 'radians') {
                angleInRadians = angleValue;
                angleInDegrees = angleValue * 180 / Math.PI;
            } else { // pi: input este multiplicator de π
                angleInRadians = angleValue * Math.PI;
                angleInDegrees = angleValue * 180;
            }

            const piStr = radAsPi(angleInDegrees);
            const radDec = fmt(angleInRadians);
            displayAngleDeg.textContent = `${fmt(angleInDegrees)} °`;
            displayAngleRad.textContent = (piStr && piStr !== radDec)
                ? `${piStr} (${radDec}) rad`
                : `${radDec} rad`;

            resultSin.textContent = withExact(getExact(EXACT_SIN, angleInDegrees), fmt(Math.sin(angleInRadians), 6));
            resultCos.textContent = withExact(getExact(EXACT_COS, angleInDegrees), fmt(Math.cos(angleInRadians), 6));

            if (Math.abs(Math.cos(angleInRadians)) < 1e-9) {
                resultTg.textContent = "Nedefinit";
            } else {
                resultTg.textContent = withExact(getExact(EXACT_TAN, angleInDegrees), fmt(Math.tan(angleInRadians), 6));
            }

            if (Math.abs(Math.sin(angleInRadians)) < 1e-9) {
                resultCtg.textContent = "Nedefinit";
            } else {
                resultCtg.textContent = withExact(getExact(EXACT_COT, angleInDegrees), fmt(1 / Math.tan(angleInRadians), 6));
            }

            if (window.MathJax && window.MathJax.typesetPromise) {
                MathJax.typesetPromise();
            }
        }

        calculateBtn.addEventListener('click', calculateTrigonometricValues);
        angleUnit.addEventListener('change', updateInputHint);
        updateInputHint();
    })();


    // ====================================================
    // 12. CERC TRIGONOMETRIC (rulează doar pe pagina cerc)
    // ====================================================
    (function initCercTrigonometric() {
        const canvas = document.getElementById('trigonometricCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const R = Math.min(W, H) * 0.38; // responsive radius

        // Dark palette matching CSS design system
        const CLR = {
            bg: '#020617',
            grid: 'rgba(59, 130, 246, 0.08)',
            axis: 'rgba(59, 130, 246, 0.25)',
            axisLabel: 'rgba(148, 163, 184, 0.6)',
            circle: 'rgba(59, 130, 246, 0.3)',
            radius: '#3b82f6',
            point: '#ffffff',
            pointStroke: '#60a5fa',
            sinLine: '#06b6d4',
            cosLine: '#3b82f6',
            arcColor: '#60a5fa',
            projection: 'rgba(59, 130, 246, 0.2)',
            sinLabel: '#06b6d4',
            cosLabel: '#3b82f6',
            text: 'rgba(248, 250, 252, 0.8)',
        };

        let angleRad = 0;
        let angleDeg = 0;
        let isDrag = false;

        // DOM spans
        const $ = id => document.getElementById(id);
        const spans = {
            deg: $('angleDeg'), rad: $('angleRad'),
            x: $('coordX'), y: $('coordY'),
            sin: $('sinValue'), cos: $('cosValue'),
            tan: $('tanValue'), cot: $('cotValue'),
            quad: $('quadrant'),
        };

        // ── Draw ──────────────────────────────────────────────
        function draw() {
            // Background
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = CLR.bg;
            ctx.fillRect(0, 0, W, H);

            // Subtle grid circles
            [0.25, 0.5, 0.75, 1].forEach(f => {
                ctx.beginPath();
                ctx.arc(cx, cy, R * f, 0, 2 * Math.PI);
                ctx.strokeStyle = CLR.grid;
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Axes
            ctx.strokeStyle = CLR.axis;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(20, cy); ctx.lineTo(W - 20, cy);  // X
            ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20);  // Y
            ctx.stroke();

            // Arrow heads
            const arrowSize = 8;
            ctx.fillStyle = CLR.axis;
            // X →
            ctx.beginPath();
            ctx.moveTo(W - 20, cy);
            ctx.lineTo(W - 20 - arrowSize, cy - arrowSize / 2);
            ctx.lineTo(W - 20 - arrowSize, cy + arrowSize / 2);
            ctx.closePath(); ctx.fill();
            // Y ↑
            ctx.beginPath();
            ctx.moveTo(cx, 20);
            ctx.lineTo(cx - arrowSize / 2, 20 + arrowSize);
            ctx.lineTo(cx + arrowSize / 2, 20 + arrowSize);
            ctx.closePath(); ctx.fill();

            // Axis labels
            ctx.fillStyle = CLR.axisLabel;
            ctx.font = 'bold 13px InterJetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('x', W - 12, cy - 8);
            ctx.fillText('y', cx + 14, 18);
            ctx.fillText('O', cx - 14, cy + 16);

            // Quadrant labels
            ctx.font = '11px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillText('I', cx + R * 0.62, cy - R * 0.62);
            ctx.fillText('II', cx - R * 0.65, cy - R * 0.62);
            ctx.fillText('III', cx - R * 0.68, cy + R * 0.65);
            ctx.fillText('IV', cx + R * 0.62, cy + R * 0.65);

            // Main circle
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, 2 * Math.PI);
            ctx.strokeStyle = CLR.circle;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Cardinal π labels (0, π/2, π, 3π/2)
            ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
            ctx.font = 'bold 13px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('0', cx + R + 10, cy - 10);
            ctx.textAlign = 'center';
            ctx.fillText('π/2', cx, cy - R - 12);
            ctx.textAlign = 'right';
            ctx.fillText('π', cx - R - 10, cy - 10);
            ctx.textAlign = 'center';
            ctx.fillText('3π/2', cx, cy + R + 18);
            ctx.textBaseline = 'alphabetic';

            // Point on circle
            const px = cx + R * Math.cos(angleRad);
            const py = cy - R * Math.sin(angleRad);

            // Radius line
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = CLR.radius;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Cosine projection (horizontal — yellow)
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px, cy);
            ctx.strokeStyle = CLR.cosLine;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Sine projection (vertical — cyan)
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(cx, py);
            ctx.strokeStyle = CLR.sinLine;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);

            // Angle arc
            ctx.beginPath();
            ctx.arc(cx, cy, R * 0.18, 0, -angleRad, angleRad >= 0 ? true : false);
            ctx.strokeStyle = CLR.arcColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Sine/Cosine labels near projections
            ctx.font = '12px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            if (Math.abs(Math.sin(angleRad)) > 0.05) {
                ctx.fillStyle = CLR.sinLabel;
                ctx.fillText('sin', cx + 4, (py + cy) / 2 + 4);
            }
            ctx.textAlign = 'center';
            if (Math.abs(Math.cos(angleRad)) > 0.05) {
                ctx.fillStyle = CLR.cosLabel;
                ctx.fillText('cos', (px + cx) / 2, cy + 14);
            }

            // Point circle (glow effect)
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, 2 * Math.PI);
            ctx.fillStyle = CLR.point;
            ctx.fill();
            ctx.strokeStyle = CLR.pointStroke;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Update info panel
            updatePanel();
        }

        function updatePanel() {
            const sinV = Math.sin(angleRad);
            const cosV = Math.cos(angleRad);
            const tanV = Math.abs(cosV) < 1e-9
                ? 'Nedefinit'
                : withExact(getExact(EXACT_TAN, angleDeg), fmt(sinV / cosV));
            const cotV = Math.abs(sinV) < 1e-9
                ? 'Nedefinit'
                : withExact(getExact(EXACT_COT, angleDeg), fmt(cosV / sinV));

            const normDeg = ((angleDeg % 360) + 360) % 360;
            let quad;
            if (Math.abs(normDeg - 0) < 1e-6 || Math.abs(normDeg - 360) < 1e-6) quad = 'Ox⁺';
            else if (Math.abs(normDeg - 90) < 1e-6) quad = 'Oy⁺';
            else if (Math.abs(normDeg - 180) < 1e-6) quad = 'Ox⁻';
            else if (Math.abs(normDeg - 270) < 1e-6) quad = 'Oy⁻';
            else if (normDeg < 90) quad = 'I';
            else if (normDeg < 180) quad = 'II';
            else if (normDeg < 270) quad = 'III';
            else quad = 'IV';

            if (spans.deg) spans.deg.textContent = fmt(angleDeg, 1);
            if (spans.rad) {
                const piStr = radAsPi(angleDeg);
                const decStr = fmt(angleRad);
                if (!piStr || piStr === decStr) {
                    spans.rad.textContent = decStr;
                } else {
                    spans.rad.textContent = `${piStr} (${decStr})`;
                }
            }
            if (spans.x) spans.x.textContent = fmt(cosV);
            if (spans.y) spans.y.textContent = fmt(sinV);
            if (spans.sin) spans.sin.textContent = withExact(getExact(EXACT_SIN, angleDeg), fmt(sinV));
            if (spans.cos) spans.cos.textContent = withExact(getExact(EXACT_COS, angleDeg), fmt(cosV));
            if (spans.tan) spans.tan.textContent = tanV;
            if (spans.cot) spans.cot.textContent = cotV;
            if (spans.quad) spans.quad.textContent = quad;
        }

        // ── Mouse / Touch ─────────────────────────────────────
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const src = e.touches ? e.touches[0] : e;
            return {
                x: (src.clientX - rect.left) * scaleX,
                y: (src.clientY - rect.top) * scaleY,
            };
        }

        function onStart(e) {
            const { x, y } = getPos(e);
            const dx = x - cx, dy = y - cy;
            if (Math.sqrt(dx * dx + dy * dy) <= R + 20) isDrag = true;
        }

        const snapToggle = document.getElementById('snapAxesToggle');
        const SNAP_ANGLES_DEG = [0, 90, 180, 270, 360];
        const SNAP_THRESHOLD_DEG = 7;

        function applySnap(deg) {
            if (!snapToggle || !snapToggle.checked) return deg;
            for (const target of SNAP_ANGLES_DEG) {
                if (Math.abs(deg - target) <= SNAP_THRESHOLD_DEG) {
                    return target % 360;
                }
            }
            return deg;
        }

        function onMove(e) {
            if (!isDrag) return;
            e.preventDefault();
            const { x, y } = getPos(e);
            const dx = x - cx, dy = y - cy;
            let a = Math.atan2(-dy, dx);
            if (a < 0) a += 2 * Math.PI;
            let deg = a * 180 / Math.PI;
            deg = applySnap(deg);
            angleDeg = deg;
            angleRad = deg * Math.PI / 180;
            draw();
        }

        function onEnd() { isDrag = false; }

        canvas.addEventListener('mousedown', onStart);
        canvas.addEventListener('mousemove', onMove, { passive: false });
        canvas.addEventListener('mouseup', onEnd);
        canvas.addEventListener('mouseleave', onEnd);
        canvas.addEventListener('touchstart', onStart, { passive: true });
        canvas.addEventListener('touchmove', onMove, { passive: false });
        canvas.addEventListener('touchend', onEnd);

        // Reset button
        const resetBtn = document.getElementById('resetCircleBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                angleRad = 0;
                angleDeg = 0;
                draw();
            });
        }

        // Initial draw
        draw();
    })();

}); // END DOMContentLoaded
