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


// projects slider
let currentIndex = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

document.getElementById('next').addEventListener('click', function() {
    goToSlide(currentIndex + 1);
});

document.getElementById('prev').addEventListener('click', function() {
    goToSlide(currentIndex - 1);
});

function goToSlide(index) {
    if (index < 0) {
        currentIndex = totalSlides - 1;
    } else if (index >= totalSlides) {
        currentIndex = 0;
    } else {
        currentIndex = index;
    }
    updateSlides();
}

function updateSlides() {
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === currentIndex) {
            slide.classList.add('active');
        }
    });
    const offset = -currentIndex * 100;
    document.querySelector('.slider').style.transform = `translateX(${offset}%)`;
}

// Initialize the first slide as active
updateSlides();

// let items = document.querySelectorAll('.slider .item');
//     let next = document.getElementById('next');
//     let prev = document.getElementById('prev');
    
//     let active = 3;
//     function loadShow(){
//         let stt = 0;
//         items[active].style.transform = `none`;
//         items[active].style.zIndex = 1;
//         items[active].style.filter = 'none';
//         items[active].style.opacity = 1;
//         for(var i = active + 1; i < items.length; i++){
//             stt++;
//             items[i].style.transform = `translateX(${120*stt}px) scale(${1 - 0.2*stt}) perspective(16px) rotateY(-1deg)`;
//             items[i].style.zIndex = -stt;
//             items[i].style.filter = 'blur(5px)';
//             items[i].style.opacity = stt > 2 ? 0 : 0.6;
//         }
//         stt = 0;
//         for(var i = active - 1; i >= 0; i--){
//             stt++;
//             items[i].style.transform = `translateX(${-120*stt}px) scale(${1 - 0.2*stt}) perspective(16px) rotateY(1deg)`;
//             items[i].style.zIndex = -stt;
//             items[i].style.filter = 'blur(5px)';
//             items[i].style.opacity = stt > 2 ? 0 : 0.6;
//         }
//     }
//     loadShow();
//     next.onclick = function(){
//         active = active + 1 < items.length ? active + 1 : active;
//         loadShow();
//     }
//     prev.onclick = function(){
//         active = active - 1 >= 0 ? active - 1 : active;
//         loadShow();
//     }


// TODO
// - Maybe some animation for the title "Hi, I'm Kevin", and possibly other sections
// - Add image scroll for travel images
// - Possibly maybe more things to do ... 
