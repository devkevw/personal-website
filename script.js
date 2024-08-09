// navbar scrolling 
const navbar = document.querySelector('.bar');
const navbarLinks = document.querySelectorAll('.bar a');

window.addEventListener('scroll', function () {
  // change navbar color once scrolled down
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // for highlighting each section in navbar
  let current = '';

  // loop through each section with the class `page-section`
  document.querySelectorAll('.page-section').forEach(section => {
    const sectionTop = section.offsetTop;
    if (window.scrollY >= sectionTop - 50) { 
      current = section.getAttribute('id');
    }
  });

  // remove active class from all links
  navbarLinks.forEach(link => {
    link.parentElement.classList.remove('active');
  });

  // check if user scrolled to the bottom
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) { // add active class to mailto link
    document.querySelector('.bar a[href^="mailto:"]').parentElement.classList.add('active');
  } else { // add active class to current link
    document.querySelector(`.bar a[href*="${current}"]`).parentElement.classList.add('active');
  }
});


// for weather in description
document.addEventListener('DOMContentLoaded', function() {
  const apiKey = 'd03e81b7e6e7449d91a103336242507'; 
  const city = 'Montreal';
  const apiUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const weatherElement = document.querySelector('.weather');
      const temperature = data.current.temp_c;
      weatherElement.textContent = `${temperature}°C`;
    })
    .catch(error => { // if error, log to console
      console.error('Error fetching weather data:', error);
    });
});



// TODO
// - Make navbar clicks work (scroll to correct section)
// - Make a hover over item navbar for which section currently is in view
// - Maybe some animation for the title "Hi, I'm Kevin", and possibly other sections
// - Add image scroll for travel images
// - Possibly maybe more things to do ... 
//test