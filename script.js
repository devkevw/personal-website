// navbar scrolling 
const navbar = document.querySelector('.bar');

window.addEventListener('scroll', function () {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
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