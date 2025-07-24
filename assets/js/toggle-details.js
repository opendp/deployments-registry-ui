function toggleDetails(id) {
    const el = document.getElementById(id);
    const prev = el.className
    el.className = prev === 'show' ? 'hide' : 'show';
}