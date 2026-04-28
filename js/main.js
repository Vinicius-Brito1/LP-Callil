const lenis = typeof window.Lenis === 'function' ? new window.Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  smoothTouch: false,
  touchMultiplier: 2,
}) : null;

if (lenis) {
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    if (!lenis) return;
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      lenis.scrollTo(target, {
        offset: -100,
        duration: 1.5
      });
      document.getElementById('nl').classList.remove('open');
    }
  });
});

const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  document.body.classList.add('cursor-ready');
  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    follower.style.left = cursorX + 'px';
    follower.style.top = cursorY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  const clickables = document.querySelectorAll('a, button, .faq-trigger, .product-card, input');
  clickables.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
} else {
  cursor.style.display = 'none';
  follower.style.display = 'none';
  document.body.style.cursor = 'auto';
}

document.querySelectorAll('[data-magnetic]').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(0, 0)';
  });
});

function toggleFaq(button) {
  const item = button.parentElement;
  const isActive = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(faq => {
    faq.classList.remove('active');
    faq.querySelector('.faq-content').style.maxHeight = null;
  });
  if (!isActive) {
    item.classList.add('active');
    item.querySelector('.faq-content').style.maxHeight = item.querySelector('.faq-content').scrollHeight + 'px';
  }
}

let lastScroll = 0;
const navbar = document.getElementById('navbar');

if (lenis && navbar) {
  lenis.on('scroll', ({ scroll }) => {
    if (scroll > lastScroll && scroll > 150) {
      navbar.classList.add('hidden');
    } else {
      navbar.classList.remove('hidden');
    }
    lastScroll = scroll;
  });
}

window.addEventListener('load', () => {
  document.getElementById('hero').classList.add('loaded');
});

const modalOverlay = document.getElementById('diagnosticoModal');
const modalClose = document.getElementById('modalClose');
let currentStep = 1;

function openModal() {
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  goStep(1);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

function goStep(n) {
  document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('step' + n) || document.getElementById('stepSuccess');
  if (target) target.classList.add('active');
  currentStep = n;

  const dots = document.querySelectorAll('.modal-progress-dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i < n);
  });

  const box = document.querySelector('.modal-box');
  if (box) box.scrollTop = 0;
}

async function submitForm() {
  const formData = {
    nome: document.getElementById('mf_nome').value,
    telefone: document.getElementById('mf_tel').value,
    email: document.getElementById('mf_email').value,
    cargo: document.getElementById('mf_cargo').value,
    municipio: document.getElementById('mf_municipio').value,
    tempo_cargo: document.getElementById('mf_tempo').value,
    frase_realidade: document.getElementById('mf_frase').value,
    riscos: Array.from(document.querySelectorAll('input[name="risco"]:checked')).map(c => c.value),
    vivenciou: document.getElementById('mf_vivenciou').value,
    impacto: document.getElementById('mf_impacto').value,
    faria_sentido: document.getElementById('mf_metodo').value,
    motivo_diagnostico: document.getElementById('mf_motivo').value,
    situacao_especifica: document.getElementById('mf_situacao').value,
  };

  try {
    const response = await fetch('https://webhook.fluq.com.br/webhook/diagnostico-callil', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const successStep = document.getElementById('stepSuccess');
    const successMessage = successStep.querySelector('p');
    if (successMessage) successMessage.textContent = 'Diagnóstico enviado com sucesso.';

    document.querySelectorAll('.modal-step').forEach(s => s.classList.remove('active'));
    successStep.classList.add('active');
    document.getElementById('modalProgress').style.display = 'none';
    document.querySelector('.modal-disclaimer').style.display = 'none';
  } catch (error) {
    alert('Erro ao enviar. Tente novamente.');
  }
}

document.querySelectorAll('[data-open-diagnostico], .nav-cta, .btn-primary').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const href = this.getAttribute('href') || '';
    if (href === '#contato' || this.classList.contains('btn-primary') || this.dataset.openDiagnostico !== undefined) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    }
  });
});

window.openModal = openModal;
window.closeModal = closeModal;
window.goStep = goStep;
window.submitForm = submitForm;
