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
// previous slide
document.querySelector('.carousel-control.prev').addEventListener('click', function() {
  const checked = document.querySelector('input[name="slider"]:checked');
  if (checked) {
    const allSliders = document.querySelectorAll('input[name="slider"]');
    const index = Array.from(allSliders).indexOf(checked);
    const prevIndex = (index - 1 + allSliders.length) % allSliders.length;
    allSliders[prevIndex].checked = true;
  } else { // log error
    console.error('No checked input found.');
  }

});

// next slide
document.querySelector('.carousel-control.next').addEventListener('click', function() {
  const checked = document.querySelector('input[name="slider"]:checked');
  if (checked) {
    const allSliders = document.querySelectorAll('input[name="slider"]');
    const index = Array.from(allSliders).indexOf(checked);
    const nextIndex = (index + 1) % allSliders.length;
    allSliders[nextIndex].checked = true;
  } else { //log error
    console.error('No checked input found.');
  }
});


// pick travel image size from Imgur
function updateImageSources() {
  const imagesLarge = document.querySelectorAll('.large-img');
  const imagesSmall = document.querySelectorAll('.small-img');
  const screenWidth = window.innerWidth;

  imagesLarge.forEach(img => {
    const baseSrc = img.getAttribute('data-base-src');
    const extension = baseSrc.split('.').pop(); // Get the file extension
    const baseName = baseSrc.replace(`.${extension}`, ''); // Get the base filename without extension
    let suffix = '';

    if (screenWidth > 335){
      suffix = 'h'; // Imgur uses a suffix of h to indicate huge image (longest dimension of 1024px)
    } else if (screenWidth <= 335) {
      suffix = 'l'; // suffix l to indicate medium
    }

    img.src = `${baseName}${suffix}.${extension}`;
  });

  imagesSmall.forEach(img => {
      const baseSrc = img.getAttribute('data-base-src');
      const extension = baseSrc.split('.').pop(); // Get the file extension
      const baseName = baseSrc.replace(`.${extension}`, ''); // Get the base filename without extension
      let suffix = '';

      if (screenWidth > 768) {
        suffix = 'h'; 
      } else if (screenWidth <= 768) {
        img.src = '';
        return;
      }

      img.src = `${baseName}${suffix}.${extension}`;
  });
}

// update img source
window.addEventListener('load', updateImageSources);
window.addEventListener('resize', updateImageSources);


// shuffle travel imgs at load
document.addEventListener("DOMContentLoaded", function() {
  // function to shuffle an array
  function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  // get all slider containers
  const sliders = document.querySelectorAll('[data-slider]');

  sliders.forEach(slider => {
      const slides = Array.from(slider.querySelectorAll('ul[data-slides] > li.slide'));

      // shuffle slides
      shuffle(slides);

      // clear existing slides in the container
      const slidesContainer = slider.querySelector('ul[data-slides]');
      slidesContainer.innerHTML = '';

      // append shuffled slides back to the container
      slides.forEach((slide, index) => {
          if (index === 0) {
              slide.setAttribute('data-active', ''); // add data-active to the first slide
          }
          slidesContainer.appendChild(slide);
      });
  });
});


// travel images slider
const buttons = document.querySelectorAll("[data-slider-button]")

buttons.forEach(button => {
  button.addEventListener("click", () => {
    const offset = button.dataset.sliderButton === "next" ? 1 : -1
    const slides = button
      .closest("[data-slider]")
      .querySelector("[data-slides]")

    const activeSlide = slides.querySelector("[data-active]")
    let newIndex = [...slides.children].indexOf(activeSlide) + offset
    if (newIndex < 0) newIndex = slides.children.length - 1
    if (newIndex >= slides.children.length) newIndex = 0

    slides.children[newIndex].dataset.active = true
    delete activeSlide.dataset.active
  })
})


// figcaption of images = alt text
document.querySelectorAll('.slide').forEach(slide => {
  const img = slide.querySelector('img'); // find the image within the current slide

  if (img && img.alt) { // check if the image exists and has an alt attribute
      // create a figcaption element
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = img.alt;
      slide.appendChild(figcaption);
  }
});


// slides change automatically if not hovered over
// slide intervals
const LARGE_SLIDER_INTERVAL_TIME = 12000; // 12 seconds
const SMALL_SLIDER_INTERVAL_TIME = 10000; // 10 seconds

document.addEventListener('DOMContentLoaded', () => {
  const largeSlider = document.querySelector('.slider-container.large');
  const smallSlider = document.querySelector('.slider-container.small');
  
  let largeSliderInterval;
  let smallSliderInterval;
  
  function startAutoSlide(slider, intervalTime) {
      return setInterval(() => {
          const activeSlide = slider.querySelector('[data-active]');
          const nextSlide = activeSlide.nextElementSibling || slider.querySelector('.slide:first-child');
          activeSlide.removeAttribute('data-active');
          nextSlide.setAttribute('data-active', true);
      }, intervalTime);
  }
  
  function stopAutoSlide(interval) {
      clearInterval(interval);
  }
  
  // initialize auto slides
  largeSliderInterval = startAutoSlide(largeSlider, LARGE_SLIDER_INTERVAL_TIME);
  smallSliderInterval = startAutoSlide(smallSlider, SMALL_SLIDER_INTERVAL_TIME);
  
  // add event listeners to stop auto-slide on hover
  largeSlider.addEventListener('mouseover', () => {
      stopAutoSlide(largeSliderInterval);
  });
  largeSlider.addEventListener('mouseout', () => {
      largeSliderInterval = startAutoSlide(largeSlider, LARGE_SLIDER_INTERVAL_TIME);
  });
  
  smallSlider.addEventListener('mouseover', () => {
      stopAutoSlide(smallSliderInterval);
  });
  smallSlider.addEventListener('mouseout', () => {
      smallSliderInterval = startAutoSlide(smallSlider, SMALL_SLIDER_INTERVAL_TIME);
  });
});


// loading page
document.addEventListener('DOMContentLoaded', () => {
  // get elements
  const hiKevin = document.querySelector('#about .title');
  const introduction = document.querySelector('#about .introduction');
  const restOfContent = document.querySelectorAll('.page-section:not(#about)');

  // function to reveal elements
  const revealElements = () => {
      hiKevin.classList.add('visible'); // add 'visible' class to first section
      setTimeout(() => {
          introduction.classList.add('visible'); // add 'visible' class to introduction
          setTimeout(() => {
              restOfContent.forEach(section => section.classList.add('visible')); // add 'visible' class to rest of sections
          }, 50); // 50ms between last two parts
      }, 200); 
  };

  // trigger the reveal function
  revealElements();
});


// change title according to screen size
document.addEventListener('DOMContentLoaded', () => {
  const titleElement = document.querySelector('.title');

  function updateTitleText() {
      if (window.innerWidth <= 900) {
          titleElement.textContent = "I'm Kevin.";
      } else {
          titleElement.textContent = "Hi, I'm Kevin.";
      }
  }

  window.addEventListener('resize', updateTitleText);
  updateTitleText(); 
});

