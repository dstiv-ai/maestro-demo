(function () {
  'use strict';

  var CRITERIA = ['Some particles have enough energy to leave the surface', 'Evaporation can happen below boiling point', 'The liquid changes into a gas'];

  var MODEL = 'Some particles have enough energy to escape from the liquid surface into the air. Evaporation can occur below boiling. The liquid changes to a gas.';

  var SAMPLE = 'A few particles at the surface gain enough energy to leave the liquid. They go into the air as a gas. The puddle can dry up even though it never boils.';

  var SAMPLE_MARK = { score: 3, feedback: 'Complete. You included energy at the surface, the change from liquid to gas, and evaporation below boiling.', criteria: [true, true, true] };

  var PREPARED = [
    mark(3, [true, true, true], 'Some particles at the surface have enough energy to escape the liquid and enter the air as a gas. Evaporation can happen below boiling point, so the water does not need to boil.', 'Clear and complete. You named energy at the surface, evaporation below boiling, and the change from liquid to gas.'),
    mark(1, [false, false, true], 'The water on the surface turns into a gas and goes into the air.', 'You are right that the liquid becomes a gas in the air. Add that only some particles have enough energy, and that this can happen without boiling.'),
    mark(0, [false, false, false], 'It disappears because the water boils in the sun.', 'Boiling is not required. Some surface particles leave the liquid below boiling point and become a gas.'),
    mark(2, [true, false, true], 'Particles with enough energy leave the liquid surface and become a gas. I am not sure whether the water has to be boiling.', 'Energy and the change to a gas are right. Evaporation can happen below boiling point.'),
    mark(2, [false, true, true], 'It can evaporate without boiling. Some of the water turns into gas, but I did not mention particles.', 'You separated evaporation from boiling and named the change to gas. Add that some particles have enough energy to escape the surface.'),
    mark(0, [false, false, false], 'The sun gives the water energy, so it vanishes from the dish.', 'The water does not vanish. Some particles escape the surface into the air as a gas, and this can happen below boiling.'),
    mark(3, [true, true, true], 'Not every particle leaves. Some have enough energy to escape from the liquid surface into the air. The liquid becomes a gas, and this can occur below the boiling point.', 'Accurate on all three points: energy to escape, a change below boiling, and liquid becoming gas.'),
    mark(1, [true, false, false], 'Some particles have enough energy to leave the surface. I am unsure what happens to them next.', 'You identified particles escaping from the surface. Add that they become a gas, and that boiling is not required.'),
    mark(2, [true, true, false], 'Some particles at the surface have enough energy to escape. This happens below boiling point.', 'Energy at the surface and evaporation below boiling are sound. Name the new state: the liquid becomes a gas.'),
    mark(0, [false, false, false], 'The water is soaked up by the air and is gone for ever.', 'Air does not soak the water up, and it is not gone for ever. Some particles leave the surface as a gas.'),
    mark(2, [true, false, true], 'Some particles get enough energy to leave the surface as a gas. I think this only happens when the water is close to boiling.', 'You have the escape from the surface and the change to a gas. Evaporation can happen well below boiling point.')
  ];

  var TITLES = { overview: 'Overview', deck: 'Lesson deck', grid: 'Thinking grid', projector: 'Projector' };
  var state, dialog, lastFocus, toastTimer, restoreFocus = true, reviewN = 0, pending = null, editingStudent = false;

  function mark(score, criteria, text, feedback) {
    return { score: score, criteria: criteria, text: text, feedback: feedback };
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function label(n) { return 'Learner ' + (n < 10 ? '0' : '') + n; }

  function blankResponses() {
    var list = [];
    for (var n = 1; n <= 12; n += 1) list.push({ n: n, text: '', status: 'waiting', suggestion: null, score: null, feedback: '' });
    return list;
  }

  function pack(item) { return { score: item.score, criteria: item.criteria.slice(), feedback: item.feedback }; }

  function seedExplain() {
    var list = blankResponses();
    PREPARED.slice(0, 10).forEach(function (item, index) {
      list[index].text = item.text;
      list[index].status = 'review';
      list[index].suggestion = pack(item);
    });
    return list;
  }

  function makeCard(id, title, kind, typeLabel, prompt, model, builtin, responses) {
    return { id: id, title: title, kind: kind, typeLabel: typeLabel, prompt: prompt, model: model, builtin: builtin, saved: true, responses: responses };
  }

  function freshState() {
    var explainPrompt = 'Why can a puddle dry up without boiling? Explain what happens to the water particles.';
    return {
      filter: 'all', activeId: 'explain', selectedId: 'explain', joined: false, spotlight: null, nextId: 1, explainPrompt: explainPrompt,
      cards: [
        makeCard('notice', 'Notice the change', 'notice', 'Notice', 'Look at the dish of water that has been standing in the room. What do you notice about the water level, and what do you think is happening?', 'The water level has fallen even though nobody poured it out. The missing water has entered the air. This card asks learners to notice before they explain.', true, blankResponses()),
        makeCard('explain', 'Explain evaporation', 'explain', 'Explain', explainPrompt, MODEL, true, seedExplain()),
        makeCard('check', 'Check a misconception', 'check', 'Check', 'A classmate says, "The water boiled away in the sun." What would you say to help them?', 'The water did not need to boil. Evaporation can happen below boiling point when some surface particles escape into the air as a gas.', true, blankResponses()),
        makeCard('reflect', 'Exit reflection', 'reflect', 'Reflect', 'What is one idea about evaporation you want to remember, and what is one question you still have?', 'A useful reflection names a correct idea, such as liquid becoming gas below boiling, and asks a real follow-up. There is no single required sentence.', true, blankResponses())
      ]
    };
  }

  function cardById(id) {
    return state.cards.filter(function (card) { return card.id === id; })[0];
  }
  function selected() { return cardById(state.selectedId); }
  function active() { return cardById(state.activeId); }
  function pristine(card) {
    return card.kind === 'explain' && card.prompt === state.explainPrompt && card.model === MODEL;
  }

  function formData() {
    return { title: document.getElementById('card-title').value.trim(), prompt: document.getElementById('card-prompt').value.trim(), model: document.getElementById('card-model').value.trim() };
  }

  function isDirty() {
    var card = selected();
    var data = formData();
    return data.title !== card.title || data.prompt !== card.prompt || data.model !== card.model;
  }

  function toast(message) {
    var node = document.getElementById('toast');
    clearTimeout(toastTimer);
    node.hidden = false;
    node.textContent = message;
    toastTimer = setTimeout(function () { node.hidden = true; }, 4200);
  }

  function counts(card) {
    var submitted = 0, review = 0, reviewed = 0;
    card.responses.forEach(function (row) {
      if (row.status !== 'waiting') submitted += 1;
      if (row.status === 'review') review += 1;
      if (row.status === 'reviewed') reviewed += 1;
    });
    return { submitted: submitted, review: review, reviewed: reviewed };
  }

  function showView(name) {
    ['overview', 'deck', 'grid', 'projector'].forEach(function (view) {
      var section = document.getElementById('view-' + view);
      if (section) section.hidden = view !== name;
    });
    document.getElementById('view-title').textContent = TITLES[name];
    document.querySelectorAll('aside [data-view]').forEach(function (button) {
      if (button.getAttribute('data-view') === name) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (name === 'deck') paintDeck(false);
    if (name === 'grid') paintGrid();
    if (name === 'projector') {
      clearTimeout(toastTimer);
      document.getElementById('toast').hidden = true;
      paintProjector();
    }
    window.scrollTo(0, 0);
  }

  function fillForm(card) {
    document.getElementById('card-title').value = card.title;
    document.getElementById('card-prompt').value = card.prompt;
    document.getElementById('card-model').value = card.model;
    document.getElementById('deck-message').textContent = '';
  }

  function paintDeck(fill) {
    var card = selected();
    var html = state.cards.map(function (item, index) {
      return '<button type="button" class="deck-card' + (item.id === card.id ? ' selected' : '') + '" data-card="' + escapeHTML(item.id) + '" aria-pressed="' + (item.id === card.id ? 'true' : 'false') + '"><span class="eyebrow">' + (index + 1) + ' · ' + escapeHTML(item.typeLabel) + '</span><strong>' + escapeHTML(item.title || 'Untitled card') + '</strong></button>';
    }).join('');
    document.getElementById('deck-list').innerHTML = html;
    var index = state.cards.indexOf(card);
    document.getElementById('move-up').disabled = index === 0;
    document.getElementById('move-down').disabled = index === state.cards.length - 1;
    var remove = document.getElementById('delete-card');
    remove.disabled = card.builtin;
    remove.title = card.builtin ? 'The four original cards stay in this demo' : 'Delete this custom card';
    if (fill) fillForm(card);
  }

  function paintGrid() {
    var card = active();
    var tally = counts(card);
    document.getElementById('live-question').textContent = card.prompt;
    document.getElementById('live-type').textContent = 'Short answer · ' + card.typeLabel;
    document.getElementById('count-total').textContent = '12';
    document.getElementById('count-responses').textContent = String(tally.submitted);
    document.getElementById('count-review').textContent = String(tally.review);
    document.getElementById('count-reviewed').textContent = String(tally.reviewed);
    document.querySelectorAll('[data-filter]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-filter') === state.filter ? 'true' : 'false');
    });
    var sim = document.getElementById('simulate-button');
    var ready = pristine(card);
    var remaining = card.responses.some(function (row) { return row.n < 12 && row.status === 'waiting'; });
    sim.disabled = !ready || !remaining;
    sim.textContent = ready && !remaining ? 'Sample responses complete' : 'Simulate responses';
    sim.title = ready ? 'Add the next prepared response for a waiting learner' : 'No prepared responses for this card';
    sim.setAttribute('aria-label', ready ? 'Simulate responses' : 'Simulate responses unavailable. This card has no prepared responses.');
    var rows = card.responses.filter(function (row) {
      return state.filter === 'all' || row.status === state.filter;
    });
    document.getElementById('student-grid').innerHTML = rows.length ? rows.map(cardHtml).join('') : '<p class="empty-state">Nothing in this filter yet.</p>';
  }

  function cardHtml(row) {
    var badge = row.status === 'reviewed' ? 'badge badge-mint' : row.status === 'review' ? 'badge badge-amber' : 'badge';
    var status = row.status === 'reviewed' ? 'Reviewed' : row.status === 'review' ? 'Needs review' : 'Waiting';
    var body = row.status === 'waiting' ? 'Waiting for a response' : escapeHTML(row.text);
    var foot = '';
    if (row.status === 'review' && row.suggestion) foot = 'Simulated AI suggestion: ' + row.suggestion.score + '/3';
    if (row.status === 'review' && !row.suggestion) foot = 'Awaiting your mark';
    if (row.status === 'reviewed') foot = 'Teacher score: ' + row.score + '/3';
    return '<button type="button" class="student-card" data-learner="' + row.n + '"><span class="student-card-head"><span>' + label(row.n) + '</span><span class="' + badge + '">' + status + '</span></span><span class="student-answer">' + body + '</span>' + (foot ? '<span class="card-bottom">' + foot + '</span>' : '') + '</button>';
  }

  function paintProjector() {
    var card = active();
    var tally = counts(card);
    document.getElementById('projector-question').textContent = card.prompt;
    document.getElementById('projector-count').textContent = tally.submitted + ' of 12 learners have responded';
    var box = document.getElementById('projector-exemplar');
    var show = state.spotlight && state.spotlight.cardId === card.id;
    box.hidden = !show;
    box.innerHTML = show ? '<p class="eyebrow">One anonymous response</p><p>' + escapeHTML(state.spotlight.text) + '</p>' : '';
  }

  function openDialog(html, opener) {
    lastFocus = opener && opener.focus ? opener : lastFocus;
    restoreFocus = false;
    if (dialog.open) dialog.close();
    restoreFocus = true;
    document.getElementById('dialog-content').innerHTML = html;
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    dialog.showModal();
    var focusable = dialog.querySelector('[autofocus], textarea, input, select, button');
    if (focusable) focusable.focus();
  }

  function shell(title, body, actions) {
    return '<div class="dialog-head"><h2 id="dialog-title">' + title + '</h2></div><div class="dialog-body">' + body + '</div><div class="dialog-actions">' + actions + '</div>';
  }

  function closeBtn(text) {
    return '<button type="button" class="btn btn-quiet" data-action="close-dialog">' + text + '</button>';
  }

  function chooseCard(id) {
    if (id === state.selectedId) return;
    if (isDirty()) {
      pending = { type: 'select', id: id };
      openDialog(shell('Save changes to this card?', '<p>This card has edits that are not saved. Save them, or discard them before switching.</p>', '<button type="button" class="btn btn-primary" data-action="save-switch">Save changes</button><button type="button" class="btn btn-secondary" data-action="discard-switch">Discard changes</button>' + closeBtn('Keep editing')), document.activeElement);
      return;
    }
    state.selectedId = id;
    paintDeck(true);
  }

  function saveCard() {
    var card = selected();
    var data = formData();
    var message = document.getElementById('deck-message');
    if (!data.title || !data.prompt || !data.model) {
      message.textContent = 'Enter a title, a question, and a teacher-only model answer before saving.';
      return false;
    }
    var changed = data.prompt !== card.prompt || data.model !== card.model;
    card.title = data.title;
    card.prompt = data.prompt;
    card.model = data.model;
    card.saved = true;
    if (changed) {
      if (pristine(card)) card.responses = seedExplain();
      else card.responses = blankResponses();
      if (state.spotlight && state.spotlight.cardId === card.id) state.spotlight = null;
      message.textContent = pristine(card) ? 'Saved. Prepared responses are restored for the original Explain card.' : 'Saved. Older responses were cleared so marks are not reused on changed wording.';
    } else message.textContent = 'Card saved in this browser session.';
    paintDeck(false);
    if (card.id === state.activeId) paintGrid();
    return true;
  }

  function launchCard() {
    if (isDirty() && !saveCard()) return;
    var card = selected();
    if (!card.saved || !card.title || !card.prompt || !card.model) {
      document.getElementById('deck-message').textContent = 'Save a title, question, and model answer before launching.';
      return;
    }
    state.activeId = card.id;
    state.filter = 'all';
    toast(card.title + ' is now the live question.');
    showView('grid');
  }

  function addCard() {
    if (isDirty()) {
      pending = { type: 'add' };
      openDialog(shell('Save changes to this card?', '<p>Save or discard the open edits before adding a card.</p>', '<button type="button" class="btn btn-primary" data-action="save-switch">Save changes</button><button type="button" class="btn btn-secondary" data-action="discard-switch">Discard changes</button>' + closeBtn('Keep editing')), document.activeElement);
      return;
    }
    var id = 'custom-' + state.nextId;
    state.nextId += 1;
    state.cards.push(makeCard(id, '', 'custom', 'Custom', '', '', false, blankResponses()));
    state.cards[state.cards.length - 1].saved = false;
    state.selectedId = id;
    paintDeck(true);
    document.getElementById('deck-message').textContent = 'New card added. Enter a title, question, and model answer, then save it.';
    document.getElementById('card-title').focus();
  }

  function moveCard(step) {
    var index = state.cards.indexOf(selected());
    var next = index + step;
    if (next < 0 || next >= state.cards.length) return;
    var item = state.cards.splice(index, 1)[0];
    state.cards.splice(next, 0, item);
    paintDeck(false);
  }

  function deleteCard() {
    var card = selected();
    if (card.builtin) return;
    var index = state.cards.indexOf(card);
    state.cards.splice(index, 1);
    if (state.activeId === card.id) state.activeId = state.cards[0].id;
    if (state.spotlight && state.spotlight.cardId === card.id) state.spotlight = null;
    state.selectedId = state.cards[Math.max(0, index - 1)].id;
    paintDeck(true);
    toast('Custom card deleted.');
  }

  function simulate() {
    var card = active();
    if (!pristine(card)) { toast('Simulation stays off. Only the original Explain evaporation card has prepared responses.'); return; }
    var row = card.responses.filter(function (item) { return item.n < 12 && item.status === 'waiting'; })[0];
    if (!row) { toast('Learners 01 to 11 have already responded. Learner 12 is reserved for you.'); return; }
    var used = {};
    card.responses.forEach(function (item) { if (item.text) used[item.text] = true; });
    var item = PREPARED.filter(function (entry) { return !used[entry.text]; })[0];
    if (!item) { toast('No prepared responses are left for this card.'); return; }
    row.text = item.text;
    row.status = 'review';
    row.suggestion = pack(item);
    row.score = null;
    row.feedback = '';
    paintGrid();
    toast(label(row.n) + ' submitted a prepared response. It is waiting for your review.');
  }

  function waitingCopy(row) {
    if (row.n === 12) return 'You have not answered as Learner 12 yet. Choose Try student view, join with the code DEMO, and submit a response.';
    if (pristine(active())) return label(row.n) + ' has not responded yet. Simulate responses adds the next prepared answer. It never writes over Learner 12.';
    return label(row.n) + ' is waiting. This card has no prepared responses, so there is nothing to mark yet. Try student view answers only as Learner 12.';
  }

  function openReview(n, opener) {
    var row = active().responses[n - 1];
    if (row.status === 'waiting') {
      openDialog(shell(label(n) + ' is waiting', '<p>' + escapeHTML(waitingCopy(row)) + '</p>', closeBtn('Back to the grid')), opener);
      return;
    }
    reviewN = n;
    var suggestion = row.suggestion;
    var manual = !suggestion;
    var criteria = manual ? '' : '<p class="suggested-score"><strong>' + suggestion.score + '</strong><span>/ 3 suggested</span></p><ul>' + CRITERIA.map(function (text, index) {
      return '<li class="criterion"><span class="badge ' + (suggestion.criteria[index] ? 'badge-mint' : 'badge-amber') + '">' + (suggestion.criteria[index] ? 'Met' : 'Not met') + '</span><span>' + escapeHTML(text) + '</span></li>';
    }).join('') + '</ul><p>' + escapeHTML(suggestion.feedback) + '</p>';
    var panel = manual
      ? '<div class="ai-panel"><p class="eyebrow">Manual teacher review</p><p>No prepared suggestion matches this response. Choose the score and feedback yourself. Nothing is marked automatically.</p></div>'
      : '<div class="ai-panel"><p class="eyebrow">Simulated AI suggestion</p><p class="muted">Prepared example — no AI call</p>' + criteria + '</div>';
    var options = '<option value="">Select a score</option>' + [0, 1, 2, 3].map(function (score) {
      var picked = !manual && row.score === null ? suggestion.score === score : row.score === score;
      return '<option value="' + score + '"' + (picked ? ' selected' : '') + '>' + score + '</option>';
    }).join('');
    var feedback = row.score === null && suggestion ? suggestion.feedback : row.feedback;
    var button = manual ? 'Save teacher feedback' : 'Approve feedback';
    var modelPanel = '<div class="answer-panel model-panel"><p class="eyebrow">Teacher-only model answer</p><p>' + escapeHTML(active().model) + '</p></div>';
    var body = '<div class="review-columns"><div class="response-reference"><div class="answer-panel"><p class="eyebrow">Learner response</p><p>' + escapeHTML(row.text) + '</p></div>' + modelPanel + '</div>' + panel + '</div>'
      + '<form id="review-form"><div class="teacher-decision"><div class="form-field"><label for="review-score">Your mark, out of 3</label><select id="review-score">' + options + '</select></div>'
      + '<div class="form-field"><label for="review-feedback">Feedback to the learner</label><textarea id="review-feedback" maxlength="1200">' + escapeHTML(feedback) + '</textarea></div></div>'
      + '<p id="review-error" class="muted" aria-live="polite"></p><div class="dialog-actions"><button type="submit" class="btn btn-primary" id="approve-btn">' + button + '</button><button type="button" class="btn btn-secondary" data-action="spotlight">Show answer on projector</button>' + closeBtn('Close') + '</div></form>';
    openDialog('<div class="dialog-head"><h2 id="dialog-title">Review ' + label(n) + '</h2><p class="muted">You decide the mark. Prepared suggestions are not approved until you save them.</p></div><div class="dialog-body">' + body + '</div>', opener);
    updateReviewLabel();
  }

  function updateReviewLabel() {
    var button = document.getElementById('approve-btn');
    var score = document.getElementById('review-score');
    var feedback = document.getElementById('review-feedback');
    var row = reviewN ? active().responses[reviewN - 1] : null;
    if (!button || !row || !row.suggestion || !score || !feedback) return;
    var same = String(row.suggestion.score) === score.value && feedback.value.trim() === row.suggestion.feedback;
    button.textContent = same ? 'Approve feedback' : 'Save teacher override';
  }

  function saveReview() {
    var row = active().responses[reviewN - 1];
    var score = document.getElementById('review-score').value;
    var feedback = document.getElementById('review-feedback').value.trim();
    if (score === '' || !feedback) {
      document.getElementById('review-error').textContent = 'Choose a score from 0 to 3 and write feedback before saving.';
      return;
    }
    row.score = Number(score);
    row.feedback = feedback;
    row.status = 'reviewed';
    paintGrid();
    toast(label(row.n) + ' is reviewed. Needs review has been updated.');
    dialog.close();
  }

  function studentBody() {
    var card = active();
    var row = card.responses[11];
    if (!state.joined) {
      return shell('Join as Learner 12', '<p class="muted">This demo uses one browser for both roles. Nothing is sent to a class server.</p><form id="student-form"><div class="form-field"><label for="join-code">Class code</label><input id="join-code" maxlength="12" value="DEMO" autocomplete="off"></div><p id="join-error" class="muted"></p><div class="dialog-actions"><button type="submit" class="btn btn-primary">Join demo class</button>' + closeBtn('Close') + '</div></form>', '');
    }
    var sample = pristine(card) ? '<button type="button" class="btn btn-secondary" data-action="use-sample">Use sample answer</button>' : '';
    if (!editingStudent && row.status !== 'waiting') {
      var result = row.status === 'reviewed'
        ? '<p class="badge badge-mint">Teacher score: ' + row.score + '/3</p><p>' + escapeHTML(row.feedback) + '</p>'
        : '<p class="badge badge-amber">Awaiting review</p><p class="muted">Your teacher has not saved feedback yet.</p>';
      return shell('Your response', '<p class="eyebrow">Question</p><p>' + escapeHTML(card.prompt) + '</p><div class="answer-panel"><p>' + escapeHTML(row.text) + '</p></div>' + result, '<button type="button" class="btn btn-primary" data-action="edit-response">Edit response</button>' + closeBtn('Close'));
    }
    var current = row.text || '';
    return shell('Answer the live question', '<p class="eyebrow">Question</p><p>' + escapeHTML(card.prompt) + '</p><p class="muted">You are Learner 12. The teacher model answer stays hidden.</p><form id="student-form"><div class="form-field"><label for="student-answer">Your answer</label><textarea id="student-answer" maxlength="1000">' + escapeHTML(current) + '</textarea></div><p id="student-error" class="muted"></p><div class="dialog-actions"><button type="submit" class="btn btn-primary">Submit response</button>' + sample + closeBtn('Close') + '</div></form>', '');
  }

  function openStudent(opener) {
    var row = active().responses[11];
    editingStudent = state.joined && row.status === 'waiting';
    openDialog(studentBody(), opener);
  }

  function submitStudent(event) {
    var card = active();
    if (!state.joined) {
      var code = document.getElementById('join-code').value.trim();
      if (code !== 'DEMO') {
        document.getElementById('join-error').textContent = 'That code is not recognised. Use DEMO for this local class.';
        return;
      }
      state.joined = true;
      editingStudent = card.responses[11].status === 'waiting';
      document.getElementById('dialog-content').innerHTML = studentBody();
      toast('Joined as Learner 12 in this browser.');
      var next = dialog.querySelector('textarea, button');
      if (next) next.focus();
      return;
    }
    var text = document.getElementById('student-answer').value.trim();
    if (!text) {
      document.getElementById('student-error').textContent = 'Write a response before submitting.';
      return;
    }
    var row = card.responses[11];
    row.text = text;
    row.status = 'review';
    row.score = null;
    row.feedback = '';
    row.suggestion = pristine(card) && text === SAMPLE ? pack(SAMPLE_MARK) : null;
    editingStudent = false;
    paintGrid();
    document.getElementById('dialog-content').innerHTML = studentBody();
    toast(row.suggestion ? 'Response submitted with a prepared suggestion still to approve.' : 'Response submitted for manual teacher review.');
  }

  function aboutHtml() {
    return shell('About this demo', '<p>Every learner, answer, and mark is fictional. The class is Learner 01 to Learner 12 only.</p><p>Anything labelled Simulated AI suggestion is a prepared example stored in this page. The demo does not call an AI service and does not invent a confidence score.</p><p>Both roles share this browser. There is no live link to other devices, and no answer is uploaded.</p><p>A suggestion is not a mark until you approve it or write your own. Teacher judgment stays in charge.</p><p>Reset demo, or reload the page, clears the lesson, responses, join, filters, projector choice, custom cards, and unsaved edits. Nothing is kept after a reload.</p>', closeBtn('Close'));
  }

  function finishPending(save) {
    var action = pending;
    pending = null;
    if (save && !saveCard()) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!save) {
      fillForm(selected());
      document.getElementById('deck-message').textContent = 'Edits discarded.';
    }
    if (dialog.open) dialog.close();
    if (action.type === 'select') {
      state.selectedId = action.id;
      paintDeck(true);
    } else addCard();
  }

  function resetAll() {
    state = freshState();
    editingStudent = false;
    reviewN = 0;
    pending = null;
    fillForm(selected());
    showView('overview');
    toast('Demo reset. The original lesson is back on Overview.');
    if (dialog.open) dialog.close();
  }

  function onClick(event) {
    var view = event.target.closest('[data-view]');
    var filter = event.target.closest('[data-filter]');
    var deck = event.target.closest('[data-card]');
    var learner = event.target.closest('[data-learner]');
    var action = event.target.closest('[data-action]');
    if (event.target.closest('#start-demo')) { showView('grid'); return; }
    if (view) { showView(view.getAttribute('data-view')); return; }
    if (event.target.closest('#add-card')) { addCard(); return; }
    if (event.target.closest('#launch-card')) { launchCard(); return; }
    if (event.target.closest('#move-up')) { moveCard(-1); return; }
    if (event.target.closest('#move-down')) { moveCard(1); return; }
    if (event.target.closest('#delete-card')) { deleteCard(); return; }
    if (event.target.closest('#simulate-button')) { simulate(); return; }
    if (event.target.closest('#student-button')) { openStudent(document.activeElement); return; }
    if (event.target.closest('#about-button')) { openDialog(aboutHtml(), document.activeElement); return; }
    if (event.target.closest('#reset-button')) {
      pending = { type: 'reset' };
      openDialog(shell('Reset the whole demo?', '<p>This clears every card, response, join, filter, projector choice, and draft, then returns to Overview.</p>', '<button type="button" class="btn btn-primary" data-action="confirm-reset">Reset demo</button>' + closeBtn('Cancel')), document.activeElement);
      return;
    }
    if (filter) {
      state.filter = filter.getAttribute('data-filter');
      paintGrid();
      return;
    }
    if (deck) { chooseCard(deck.getAttribute('data-card')); return; }
    if (learner) { openReview(Number(learner.getAttribute('data-learner')), learner); return; }
    if (!action) return;
    var name = action.getAttribute('data-action');
    if (name === 'close-dialog') dialog.close();
    if (name === 'save-switch') finishPending(true);
    if (name === 'discard-switch') finishPending(false);
    if (name === 'confirm-reset') resetAll();
    if (name === 'spotlight') {
      state.spotlight = { cardId: state.activeId, text: active().responses[reviewN - 1].text };
      paintProjector();
      toast('That answer is on the projector. The name, score, and model answer stay hidden.');
    }
    if (name === 'use-sample' && document.getElementById('student-answer')) document.getElementById('student-answer').value = SAMPLE;
    if (name === 'edit-response') {
      var mine = active().responses[11];
      mine.status = 'review';
      mine.score = null;
      mine.feedback = '';
      mine.suggestion = null;
      editingStudent = true;
      paintGrid();
      document.getElementById('dialog-content').innerHTML = studentBody();
      toast('Previous feedback is cleared. Submit the revised response for a new review.');
      var box = document.getElementById('student-answer');
      if (box) box.focus();
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    if (event.target.id === 'card-form') saveCard();
    if (event.target.id === 'review-form') saveReview();
    if (event.target.id === 'student-form') submitStudent(event);
  }

  function init() {
    dialog = document.getElementById('demo-dialog');
    if (!dialog || !document.getElementById('student-grid') || !document.getElementById('card-form')) return;
    state = freshState();
    dialog.addEventListener('close', function () {
      if (!restoreFocus || !lastFocus) return;
      var target = lastFocus.isConnected ? lastFocus : null;
      if (!target && lastFocus.dataset.learner) target = document.querySelector('[data-learner="' + lastFocus.dataset.learner + '"]');
      if (!target) target = document.querySelector('[data-filter][aria-pressed="true"]');
      if (target) target.focus();
    });
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab') return;
      var controls = Array.from(dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(function (node) { return node.getClientRects().length; });
      if (!controls.length) return;
      var first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('input', function (event) {
      if (event.target.closest('#card-form')) document.getElementById('deck-message').textContent = '';
      updateReviewLabel();
    });
    document.addEventListener('change', updateReviewLabel);
    fillForm(selected());
    paintDeck(false);
    paintGrid();
    paintProjector();
    showView('overview');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
