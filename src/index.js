import axios from 'axios';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from "simplelightbox";
import 'simplelightbox/dist/simple-lightbox.min.css';

const apiUrl = 'https://pixabay.com/api/';
const apiKey = '33854036-e2c3e435af7eca513d71bcd22';

const refs = {
  form: document.querySelector('.search-form'),
  gallery: document.querySelector('.gallery'),
};

const gallery = new SimpleLightbox('.gallery a');

class PhotosApi {
  query = '';
  page = 1;
  perPage = 40;
  total = 0;
  loading = false;

  async get(query) {
    if (query) {
      this.query = query;
    }

    this.loading = true;

    const response = await axios.get(apiUrl, {
      params: {
        key: apiKey,
        q: query || this.query,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
        page: this.page,
        per_page: this.perPage,
      },
    });

    if (this.page === 1 && response.data.totalHits > 0) {
      Notify.success(`Hooray! We found ${response.data.totalHits} images.`);
    }

    this.page += 1;
    this.loading = false;
    this.total = response.data.totalHits;

    return response;
  }

  hasMorePages() {
    const startIndex = (this.page - 1) * this.perPage + 1;
    return this.total === 0 || startIndex < this.total;
  }

  reset() {
    this.page = 1;
    this.total = 0;
  }
}

const photosApi = new PhotosApi();

async function onSearch(event) {
  event.preventDefault();
  const value = event.currentTarget.elements.searchQuery.value.trim();

  if (value === '') {
    return;
  }

  try {
    photosApi.reset();
    const response = await photosApi.get(value);

    if (response.data.hits.length === 0) {
      Notify.info(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    refs.gallery.innerHTML = renderGallery(response.data.hits);
    gallery.refresh();
  } catch (error) {
    console.error(error);
  }
}

async function handleInfiniteScroll() {
  const endOfPage =
    window.innerHeight + window.pageYOffset >= document.body.offsetHeight;

  if (endOfPage && photosApi.hasMorePages() && !photosApi.loading) {
    const response = await photosApi.get();
    refs.gallery.insertAdjacentHTML('beforeend', renderGallery(response.data.hits));
    gallery.refresh();
  }

  if (endOfPage && !photosApi.hasMorePages()) {
    Notify.info('We are sorry, but you have reached the end of search results.');
  }
}

async function onScroll() {
  await handleInfiniteScroll();
}

refs.form.addEventListener('submit', onSearch);
window.addEventListener('scroll', onScroll, { passive: true });

function renderGallery(images) {
  return images.map(createMarkupForImage).join('');
}

function createMarkupForImage({
  webformatURL,
  largeImageURL,
  tags,
  likes,
  views,
  comments,
  downloads,
}) {
  return `
    <div class="photo-card">
      <a href="${largeImageURL}" data-title="${tags}">
        <img class="photo-image" src="${webformatURL}" alt="${tags}" loading="lazy" />
      </a>
      <div class="info">
        <div class="info-item">
          <b>Likes</b>
          <p class="info-value">${likes}</p>
        </div>
        <div class="info-item">
          <b>Views</b>
          <p class="info-value">${views}</p>
        </div>
        <div class="info-item">
          <b>Comments</b>
          <p class="info-value">${comments}</p>
        </div>
        <div class="info-item">
          <b>Downloads</b>
          <p class="info-value">${downloads}</p>
        </div>
      </div>
    </div>
  `;
}