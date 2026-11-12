/* JK Kuntoilee — pieni käyttöliittymäkoodi */
(function () {
  'use strict';

  var vuosi = document.getElementById('vuosi');
  if (vuosi) vuosi.textContent = String(new Date().getFullYear());

  var form = document.getElementById('yhteydenotto');
  var note = document.getElementById('form-note');
  if (form && note) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      note.className = 'form-note';

      var nimi = form.elements.nimi.value.trim();
      var yhteys = form.elements.yhteys.value.trim();

      if (!nimi || !yhteys) {
        note.textContent = 'Täytä nimi ja yhteystieto, niin hoidan loput.';
        note.classList.add('err');
        return;
      }
      note.textContent = 'Kiitos ' + nimi + '! Viestisi on valmis lähetettäväksi — vastaan ' +
        'tyypillisesti muutaman arkipäivän kuluessa.';
      note.classList.add('ok');
      form.reset();
    });
  }
})();
