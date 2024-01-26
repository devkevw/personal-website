const navbar = document.querySelector('.bar');

window.addEventListener('scroll', function () {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// TODO
// - Make navbar clicks work (scroll to correct section)
// - Make a hover over item navbar for which section currently is in view
// - Maybe some animation for the title "Hi, I'm Kevin", and possibly other sections
// - Add image scroll for travel images
// - Possibly maybe more things to do ... 