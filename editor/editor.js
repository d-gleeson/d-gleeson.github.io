document.addEventListener('DOMContentLoaded', async () => {
  const formFieldsContainer = document.getElementById('form-fields');
  const form = document.getElementById('record-form');

  let fieldNames = [];

  // Load existing data to determine structure
  const res = await fetch(`/questions.json?_=${Date.now()}`);
  const data = await res.json();
  const template = data[0];
  fieldNames = Object.keys(template).filter(key => key !== 'id');

  // Build form
  fieldNames.forEach((field, index) => {
    const label = document.createElement('label');
    label.textContent = field;
    label.setAttribute('for', field);

    const input = document.createElement('input');
    input.type = 'text';
    input.name = field;
    input.id = field;

    // Listen for Enter on last field
    if (index === fieldNames.length - 1) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          document.getElementById('submit-button').focus();
          document.getElementById('submit-button').click();
        }
      });
    }

    const wrapper = document.createElement('div');
    wrapper.appendChild(label);
    wrapper.appendChild(input);

    formFieldsContainer.appendChild(wrapper);
  });

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newRecord = {};
    fieldNames.forEach(field => {
      const val = document.getElementById(field).value;
      newRecord[field] = val === '' ? null : val;
    });

    const res = await fetch('/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });

    if (res.ok) {
      // Clear inputs
      fieldNames.forEach(field => {
        document.getElementById(field).value = '';
      });

      // Focus first field
      document.getElementById(fieldNames[0]).focus();
    } else {
      alert('Failed to submit record.');
    }
  });

  // Autofocus first field on load
  document.getElementById(fieldNames[0])?.focus();
});
