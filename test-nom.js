const addressStr = "Av Paulista, 1000, Bela Vista, São Paulo, SP, 01310-100";
fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}`, {
  headers: {
    'User-Agent': 'AdegaHub/1.0'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
