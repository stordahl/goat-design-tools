(function() {
  const searchInput = document.getElementById('search-input');
  const toolItems = document.querySelectorAll('.tool-item');
  const noResults = document.getElementById('no-results');

  function filterTools() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    toolItems.forEach(item => {
      const name = item.getAttribute('data-name') || '';
      const description = item.getAttribute('data-description') || '';
      const tags = item.getAttribute('data-tags') || '';
                
      const isMatch = searchTerm === '' || 
        name.includes(searchTerm) || 
        description.includes(searchTerm) || 
        tags.includes(searchTerm);

        if (isMatch) {
          item.style.display = 'block';
          visibleCount++;
        } else {
          item.style.display = 'none';
        }
    });

    noResults.style.display = visibleCount === 0 && searchTerm !== '' ? 'block' : 'none';
  }

  searchInput.addEventListener('input', filterTools);
  searchInput.addEventListener('keyup', filterTools);
})();

