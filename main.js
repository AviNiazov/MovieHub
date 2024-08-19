const API_KEY = '838de4c0e475f5ca9a770fc119f53ccc';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

let allMovies = []; // משתנה שיחזיק את כל הסרטים
let currentPage = 1; // דף נוכחי של הסרטים

// גישה לסרטים הפופולריים
async function fetchMovies(page = 1) {
    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=he-IL&page=${page}`);
        const data = await response.json();
        allMovies = allMovies.concat(data.results);  
        const moviesWithTrailers = await Promise.all(
            allMovies.map(async (movie) => {
                const trailer = await fetchTrailer(movie.id);
                return { ...movie, trailer };
            })
        );

        displayMovies(moviesWithTrailers);
    } catch (error) {
        console.error('Error fetching movies:', error);
    }
}

async function fetchTrailer(movieId) {
    try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=he-IL`);
        const data = await response.json();
        const trailer = data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
        return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    } catch (error) {
        console.error('Error fetching trailer:', error);
        return null;
    }
}

function displayMovies(movies) {
    const moviesContainer = document.getElementById('movie-list');
    moviesContainer.innerHTML = '';

    movies.forEach(movie => {
        const movieDiv = document.createElement('div');
        movieDiv.classList.add('movie-item');
        movieDiv.innerHTML = `
            <img src="${IMAGE_BASE_URL + movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-release-date">${movie.release_date.split('-')[0]}</p>
                ${movie.trailer ? `<a href="${movie.trailer}" target="_blank" class="trailer-link">צפה בטריילר</a>` : ''}
            </div>
        `;

        movieDiv.addEventListener('click', () => {
            openModal(movie.title, movie.release_date.split('-')[0], movie.overview, movie);
        });

        moviesContainer.appendChild(movieDiv);
    });
}

function openModal(title, releaseDate, description, movie) {
    const modal = document.getElementById('movie-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalReleaseDate = document.getElementById('modal-release-date');
    const modalDescription = document.getElementById('modal-description');
    const saveMovieBtn = document.getElementById('save-movie-btn');

    modal.style.display = 'block';
    modalTitle.textContent = title;
    modalReleaseDate.textContent = `שחרור: ${releaseDate}`;
    modalDescription.textContent = description;

    saveMovieBtn.classList.toggle('saved', isMovieSaved(movie.id));
    saveMovieBtn.classList.remove('fa-heart');  
    saveMovieBtn.classList.add('fas', 'fa-heart');  
    saveMovieBtn.style.color = isMovieSaved(movie.id) ? 'red' : 'black'; 
    saveMovieBtn.onclick = () => {
        toggleSaveMovie(movie);
        saveMovieBtn.classList.toggle('saved');
        saveMovieBtn.style.color = isMovieSaved(movie.id) ? 'red' : 'black';
    };

    const closeButton = modal.querySelector('.close');
    closeButton.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// חיפוש בזמן אמת
document.querySelector("input[type='search']").addEventListener('input', function () {
    const query = this.value.toLowerCase();
    const filteredMovies = allMovies.filter(movie => {
        const title = movie.title.toLowerCase();
        const releaseYear = movie.release_date.split('-')[0];
        const overview = movie.overview.toLowerCase();

        return title.includes(query) || releaseYear.includes(query) || overview.includes(query);
    });
    displayMovies(filteredMovies);
});

// גלילה אינסופית לטעינת סרטים נוספים
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        currentPage++;
        fetchMovies(currentPage);
    }
});

function toggleSaveMovie(movie) {
    let savedMovies = JSON.parse(localStorage.getItem('savedMovies')) || [];
    const movieIndex = savedMovies.findIndex(savedMovie => savedMovie.id === movie.id);

    if (movieIndex === -1) {
        savedMovies.push(movie);
        localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
        alert('הסרט נשמר בהצלחה!');
    } else {
        savedMovies.splice(movieIndex, 1);
        localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
        alert('הסרט הוסר מהשמורים.');
    }
}
function isMovieSaved(movieId) {
    const savedMovies = JSON.parse(localStorage.getItem('savedMovies')) || [];
    return savedMovies.some(movie => movie.id === movieId);
}

function displaySavedMovies() {
    const savedMovies = JSON.parse(localStorage.getItem('savedMovies')) || [];
    const savedMoviesList = document.getElementById('saved-movies-list');
    savedMoviesList.innerHTML = '';

    savedMovies.forEach(movie => {
        const movieDiv = document.createElement('div');
        movieDiv.classList.add('movie-item');
        movieDiv.innerHTML = `
            <img src="${IMAGE_BASE_URL + movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-release-date">${movie.release_date.split('-')[0]}</p>
                ${movie.trailer ? `<a href="${movie.trailer}" target="_blank" class="trailer-link">צפה בטריילר</a>` : ''}
                <i id="remove-movie-${movie.id}" class="fas fa-trash remove-movie-btn"></i>
            </div>
        `;

        movieDiv.addEventListener('click', () => {
            openModal(movie.title, movie.release_date.split('-')[0], movie.overview, movie);
        });

        const removeButton = movieDiv.querySelector('.remove-movie-btn');
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation();  
            toggleSaveMovie(movie); 
            displaySavedMovies();  
        });

        savedMoviesList.appendChild(movieDiv);
    });

    const savedMoviesModal = document.getElementById('saved-movies-modal');
    savedMoviesModal.style.display = 'block';

    const closeButton = savedMoviesModal.querySelector('.close');
    closeButton.onclick = () => {
        savedMoviesModal.style.display = 'none';
    };
    window.onclick = function(event) {
        if (event.target == savedMoviesModal) {
            savedMoviesModal.style.display = 'none';
        }
    }
}
document.getElementById('saved-movies-link').addEventListener('click', displaySavedMovies);
document.addEventListener('DOMContentLoaded', () => fetchMovies(currentPage));
