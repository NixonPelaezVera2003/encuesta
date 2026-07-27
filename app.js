// ===== CONFIGURACIÓN EMAILJS =====
const EMAILJS_PUBLIC_KEY = "qoQ8H1CxNqzUmihFW";
const EMAILJS_SERVICE_ID = "service_wl58pms";
const EMAILJS_TEMPLATE_ID = "template_ddxuw8z";

// ===== CONFIGURACIÓN JSONBIN (NUBE) =====
const JSONBIN_BIN_ID = "6a67db2bf5f4af5e29ca33d3";
const JSONBIN_MASTER_KEY = "$2a$10$jeatA89HqzJB/Co/naO1Z.7peyWb/OURz.26nLWmIkzXA.PrvtCay";

// Inicializar EmailJS
(function() {
  if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
})();

// Clave para el Panel Administrador
const ADMIN_PASSWORD = "1234";

let questions = [];

// Cargar preguntas desde la Nube al abrir la página
document.addEventListener('DOMContentLoaded', () => {
  fetchQuestionsFromCloud();
});

function fetchQuestionsFromCloud() {
  const container = document.getElementById('questions-container');
  if (container) {
    container.innerHTML = '<p class="subtitle" style="text-align:center;">Cargando encuesta...</p>';
  }

  fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
    headers: {
      'X-Master-Key': JSONBIN_MASTER_KEY
    }
  })
  .then(res => res.json())
  .then(data => {
    questions = data.record || [];
    renderStudentQuestions();
  })
  .catch(err => {
    console.error("Error al cargar preguntas de la nube:", err);
    if (container) {
      container.innerHTML = '<p class="subtitle" style="text-align:center; color: red;">Error al cargar preguntas. Revisa la conexión.</p>';
    }
  });
}

// Guardar/Actualizar preguntas en la Nube
function saveQuestionsToCloud(updatedQuestions, callback) {
  fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_MASTER_KEY
    },
    body: JSON.stringify(updatedQuestions)
  })
  .then(res => res.json())
  .then(data => {
    questions = updatedQuestions;
    if (callback) callback();
  })
  .catch(err => {
    console.error("Error al guardar en la nube:", err);
    alert("Error al sincronizar con la nube.");
  });
}

// Cambiar entre Vista Estudiante y Vista Administrador
function switchView(view) {
  const studentSec = document.getElementById('view-estudiante');
  const adminSec = document.getElementById('view-admin');
  const btnStudent = document.getElementById('btn-view-student');
  const btnAdmin = document.getElementById('btn-view-admin');

  if (view === 'estudiante') {
    studentSec.classList.remove('hidden');
    adminSec.classList.add('hidden');
    btnStudent.classList.add('active');
    btnAdmin.classList.remove('active');
    fetchQuestionsFromCloud();
  } else {
    studentSec.classList.add('hidden');
    adminSec.classList.remove('hidden');
    btnStudent.classList.remove('active');
    btnAdmin.classList.add('active');
  }
}

// ===== LÓGICA DE ADMINISTRADOR =====
function loginAdmin() {
  const pass = document.getElementById('admin-pass').value;
  if (pass === ADMIN_PASSWORD) {
    document.getElementById('admin-auth').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    renderAdminQuestions();
  } else {
    alert('Contraseña de administrador incorrecta.');
  }
}

function toggleOptionsInput() {
  const type = document.getElementById('q-type').value;
  const optionsGroup = document.getElementById('options-group');
  if (type === 'seleccion') {
    optionsGroup.classList.remove('hidden');
  } else {
    optionsGroup.classList.add('hidden');
  }
}

function addQuestion() {
  const text = document.getElementById('q-text').value.trim();
  const type = document.getElementById('q-type').value;
  const optionsRaw = document.getElementById('q-options').value;

  if (!text) {
    alert('Por favor, escribe el texto de la pregunta.');
    return;
  }

  let options = [];
  if (type === 'seleccion') {
    options = optionsRaw.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
    if (options.length === 0) {
      alert('Ingresa al menos una opción para la selección múltiple.');
      return;
    }
  }

  const newQuestion = { id: Date.now(), text, type, options };
  const updatedList = [...questions, newQuestion];

  saveQuestionsToCloud(updatedList, () => {
    document.getElementById('q-text').value = '';
    document.getElementById('q-options').value = '';
    renderAdminQuestions();
    alert('Pregunta guardada y sincronizada en la nube con éxito.');
  });
}

function deleteQuestion(id) {
  const updatedList = questions.filter(q => q.id !== id);
  saveQuestionsToCloud(updatedList, () => {
    renderAdminQuestions();
  });
}

function renderAdminQuestions() {
  const list = document.getElementById('admin-questions-list');
  list.innerHTML = '';

  if (questions.length === 0) {
    list.innerHTML = '<li>No hay preguntas registradas en la nube.</li>';
    return;
  }

  questions.forEach((q, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span><strong>${index + 1}.</strong> ${q.text} <em>(${q.type === 'abierta' ? 'Abierta' : 'Múltiple'})</em></span>
      <button class="btn-delete-item" onclick="deleteQuestion(${q.id})">Eliminar</button>
    `;
    list.appendChild(li);
  });
}

function clearAllQuestions() {
  if (confirm('¿Seguro que deseas eliminar TODAS las preguntas de la nube?')) {
    saveQuestionsToCloud([], () => {
      renderAdminQuestions();
    });
  }
}

// ===== LÓGICA DE ESTUDIANTE Y RENDERIZADO =====
function renderStudentQuestions() {
  const container = document.getElementById('questions-container');
  container.innerHTML = '';

  if (questions.length === 0) {
    container.innerHTML = '<p class="subtitle" style="text-align:center; margin: 1rem 0;">No hay preguntas activas en la encuesta en este momento.</p>';
    return;
  }

  questions.forEach((q, index) => {
    const block = document.createElement('div');
    block.className = 'question-block';

    const label = document.createElement('div');
    label.className = 'question-title';
    label.textContent = `${index + 1}. ${q.text}`;
    block.appendChild(label);

    if (q.type === 'abierta') {
      const textarea = document.createElement('textarea');
      textarea.name = `question_${q.id}`;
      textarea.required = true;
      textarea.placeholder = 'Escribe tu respuesta aquí...';
      block.appendChild(textarea);
    } else if (q.type === 'seleccion') {
      q.options.forEach(opt => {
        const optWrapper = document.createElement('label');
        optWrapper.className = 'radio-option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `question_${q.id}`;
        radio.value = opt;
        radio.required = true;

        const span = document.createElement('span');
        span.textContent = opt;

        optWrapper.appendChild(radio);
        optWrapper.appendChild(span);
        block.appendChild(optWrapper);
      });
    }

    container.appendChild(block);
  });
}

// ===== ENVÍO DE FORMULARIO A EMAILJS =====
document.getElementById('poll-form').addEventListener('submit', function(e) {
  e.preventDefault();

  if (questions.length === 0) {
    alert('No hay preguntas activas para enviar.');
    return;
  }

  const submitBtn = document.getElementById('btn-submit');
  const name = document.getElementById('student-name').value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando respuestas...';

  let answersHTML = '';
  questions.forEach((q, index) => {
    let answerVal = '';
    if (q.type === 'abierta') {
      const el = document.querySelector(`[name="question_${q.id}"]`);
      answerVal = el ? el.value.trim() : 'Sin respuesta';
    } else {
      const selected = document.querySelector(`[name="question_${q.id}"]:checked`);
      answerVal = selected ? selected.value : 'Sin respuesta';
    }

    answersHTML += `
      <div style="margin-bottom: 12px; padding: 12px; background-color: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #1e3a8a;">
          ${index + 1}. ${q.text}
        </p>
        <p style="margin: 0; font-size: 14px; color: #334155;">
          ${answerVal}
        </p>
      </div>
    `;
  });

  const templateParams = {
    estudiante_nombre: name,
    respuestas: answersHTML
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
    .then(() => {
      document.getElementById('poll-form').classList.add('hidden');
      const thankYouMsg = document.getElementById('thank-you-message');
      thankYouMsg.classList.remove('hidden');

      const audioElement = document.getElementById('survey-audio');
      if (audioElement) {
        audioElement.play().catch(err => {
          console.log("El navegador requiere interacción previa para reproducir audio:", err);
        });
      }
    }, (error) => {
      console.error('FAILED...', error);
      alert('Hubo un inconveniente al enviar tus respuestas. Por favor, intenta de nuevo.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrar Respuestas';
    });
});
