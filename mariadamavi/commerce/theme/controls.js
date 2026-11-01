/* Progressive enhancement: WooCommerce remains responsible for variations and prices. */
jQuery(function ($) {
  function enhance() {
    document.querySelectorAll('.variations select:not([data-mavi-options])').forEach(select => {
      const options = [...select.options].filter(option => option.value);
      if (!options.length || options.length > 12) return;
      const group = document.createElement('div');
      group.className = 'mavi-options';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', select.closest('tr').querySelector('label')?.textContent || 'Opções');
      const buttons = options.map(option => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'mavi-option';
        button.textContent = option.text;
        button.addEventListener('click', () => {
          select.value = option.value;
          $(select).trigger('change');
          sync();
        });
        group.append(button);
        return {button, value: option.value};
      });
      function sync() {
        buttons.forEach(({button, value}) => {
          const current = [...select.options].find(option => option.value === value);
          button.disabled = !current || current.disabled;
          button.setAttribute('aria-pressed', String(select.value === value));
        });
      }
      select.after(group);
      select.dataset.maviOptions = 'true';
      select.hidden = true;
      $(select).on('change', sync);
      $(select.closest('form')).on('woocommerce_update_variation_values reset_data found_variation', sync);
      sync();
    });
    document.querySelectorAll('.quantity input.qty:not([data-mavi-quantity])').forEach(input => {
      if (input.type === 'hidden') return;
      input.dataset.maviQuantity = 'true';
      input.parentElement.classList.add('mavi-quantity');
      const minus = document.createElement('button');
      const plus = document.createElement('button');
      [[minus, '−', 'Diminuir quantidade', -1], [plus, '+', 'Aumentar quantidade', 1]].forEach(([button, text, label, direction]) => {
        button.type = 'button'; button.textContent = text; button.setAttribute('aria-label', label);
        button.addEventListener('click', () => {
          if (!input.value) input.value = input.min || '1';
          direction < 0 ? input.stepDown() : input.stepUp();
          $(input).trigger('input').trigger('change'); syncQuantity();
        });
      });
      input.before(minus); input.after(plus);
      function syncQuantity() {
        minus.disabled = input.disabled || (input.min !== '' && Number(input.value) <= Number(input.min));
        plus.disabled = input.disabled || (input.max !== '' && Number(input.value) >= Number(input.max));
      }
      input.addEventListener('change', syncQuantity); syncQuantity();
    });
  }
  enhance();
  $(document.body).on('updated_wc_div wc_variation_form', enhance);
});
