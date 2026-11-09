(() => {
  const source = document.querySelector('#food-data');
  if (!source) return;
  const { places, previewPlaces, imageRoot } = JSON.parse(source.textContent);
  const list = document.querySelector('[data-food-list]');
  const filter = document.querySelector('[data-food-city]');
  const empty = document.querySelector('[data-food-empty]');
  const preview = document.querySelector('[data-food-preview]');
  const exit = document.querySelector('[data-food-preview-exit]');
  const banner = document.querySelector('[data-food-preview-banner]');
  const count = document.querySelector('[data-food-count]');
  const reset = document.querySelector('[data-map-reset]');
  const hint = document.querySelector('[data-map-hint]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let sample = false;
  let records = places;
  let map;
  let markers;
  const markerById = new Map();
  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };
  const cityKey = place => `${place.city}, ${place.country}`;
  const selectPlace = id => {
    list.querySelectorAll('[data-food-card]').forEach(card => card.classList.toggle('is-selected', card.dataset.foodCard === id));
  };
  const openOnMap = place => {
    if (!map) return;
    selectPlace(place.id);
    map.setView([place.latitude, place.longitude], sample ? 10 : 15, { animate: !reducedMotion.matches });
    markerById.get(place.id)?.openPopup();
    document.querySelector('[data-food-map]').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
  };
  const renderCard = (place, index) => {
    const card = node('article', 'food-card');
    card.id = `food-${place.id}`;
    card.tabIndex = -1;
    card.dataset.foodCard = place.id;
    if (place.photo) {
      const image = node('img', 'food-photo');
      image.src = place.photo.startsWith('https://') ? place.photo : `${imageRoot}${place.photo}`;
      image.alt = place.name;
      image.width = 800;
      image.height = 600;
      image.loading = 'lazy';
      card.append(image);
    }
    const body = node('div', 'food-card-body');
    body.append(node('p', 'eyebrow', `${String(index + 1).padStart(2, '0')} / ${place.city} · ${place.country}`));
    body.append(node('h3', '', place.name));
    if (place.address) body.append(node('p', 'food-note', place.address));
    if (place.order) {
      const order = node('p', 'food-order');
      order.append(node('span', '', 'What to order'), document.createTextNode(place.order));
      body.append(order);
    }
    if (place.note) body.append(node('p', 'food-note', place.note));
    const actions = node('div', 'food-card-actions');
    if (map) {
      const button = node('button', 'text-link', 'Show on map');
      button.type = 'button';
      button.addEventListener('click', () => openOnMap(place));
      actions.append(button);
    }
    if (!sample) {
      const link = node('a', 'text-link', 'Find it on Google Maps');
      link.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.name, place.address, place.city, place.country].filter(Boolean).join(', '))}`;
      actions.append(link);
    } else actions.append(node('span', 'food-sample-label', 'Sample entry'));
    body.append(actions);
    card.append(body);
    return card;
  };
  const worldView = () => map?.setView([25, 12], map.getSize().x < 400 ? 0 : 2, { animate: false });
  if (window.L) {
    map = L.map('food-map', { scrollWheelZoom: false, minZoom: 0, maxZoom: 18, worldCopyJump: true, zoomAnimation: !reducedMotion.matches, fadeAnimation: !reducedMotion.matches, markerZoomAnimation: !reducedMotion.matches, inertia: !reducedMotion.matches });
    document.querySelector('.food-map-fallback')?.remove();
    worldView();
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    tiles.on('tileerror', () => { hint.textContent = 'Map imagery is unavailable. You can still browse the list and select pins.'; });
    markers = L.layerGroup().addTo(map);
    reset.hidden = false;
    reset.addEventListener('click', worldView);
    reducedMotion.addEventListener('change', () => {
      map.stop();
      map.options.zoomAnimation = !reducedMotion.matches;
      map.options.fadeAnimation = !reducedMotion.matches;
      map.options.markerZoomAnimation = !reducedMotion.matches;
      map.options.inertia = !reducedMotion.matches;
    });
  } else hint.textContent = 'The map could not load. All the places are available in the list below.';
  const render = () => {
    const visible = records.filter(place => !filter.value || cityKey(place) === filter.value);
    list.replaceChildren(...visible.map(renderCard));
    empty.hidden = records.length > 0;
    banner.hidden = !sample;
    exit.hidden = !sample;
    document.querySelector('[data-food-filter]').hidden = records.length === 0;
    count.textContent = sample ? `${visible.length} sample ${visible.length === 1 ? 'place' : 'places'} · preview only` : records.length ? `${visible.length} ${visible.length === 1 ? 'place' : 'places'}, and counting.` : 'A collection in the making.';
    markers?.clearLayers();
    markerById.clear();
    if (!map) return;
    visible.forEach((place, index) => {
      const marker = L.marker([place.latitude, place.longitude], {
        icon: L.divIcon({ className: 'food-pin', html: `<span>${index + 1}</span>`, iconSize: [36, 44], iconAnchor: [18, 42], popupAnchor: [0, -36] }),
        title: `${sample ? 'Sample: ' : ''}${place.name}, ${place.city}`, alt: `${place.name}, ${place.city}`
      }).addTo(markers);
      const popup = node('div', 'food-popup');
      popup.append(node('strong', '', place.name), node('p', '', `${place.city} · ${place.country}`));
      if (place.address) popup.append(node('p', '', place.address));
      if (place.order) popup.append(node('p', '', place.order));
      const button = node('button', 'text-link', place.note ? 'Read the note' : 'View spot');
      button.type = 'button';
      button.addEventListener('click', () => {
        const card = document.getElementById(`food-${place.id}`);
        card.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
        card.focus({ preventScroll: true });
      });
      popup.append(button);
      marker.bindPopup(popup).on('click', () => selectPlace(place.id));
      markerById.set(place.id, marker);
    });
    if (visible.length) map.fitBounds(visible.map(place => [place.latitude, place.longitude]), { padding: [50, 50], maxZoom: filter.value ? (sample ? 10 : visible.length === 1 ? 15 : 18) : (sample ? 2 : 5), animate: false });
    else worldView();
  };
  const updateCities = () => {
    filter.replaceChildren(new Option('All cities', ''));
    [...new Set(records.map(cityKey))].sort().forEach(city => filter.add(new Option(city, city)));
    filter.value = '';
  };
  preview.hidden = places.length > 0 || previewPlaces.length === 0;
  preview.addEventListener('click', () => { sample = true; records = previewPlaces; updateCities(); render(); filter.focus({ preventScroll: true }); });
  exit.addEventListener('click', () => { sample = false; records = places; updateCities(); render(); preview.focus(); });
  filter.addEventListener('change', render);
  updateCities();
  render();
})();
