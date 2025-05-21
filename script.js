// Remplace ce token par le tien
const token = "74bc07e4d8ee43ad4e23dc671385dc4d9675b7748c8f72a32d6d124715275abc";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("meteo-form");
  const result = document.getElementById("result");
  const historiqueDiv = document.getElementById("historique");

  // Charger historique depuis localStorage
  let historique = JSON.parse(localStorage.getItem("meteoHistorique")) || [];

  // Fonction pour sauvegarder l'historique
  function sauvegarderHistorique(entree) {
    // Evite doublons exacts
    historique = historique.filter(h => !(h.recherche === entree.recherche && h.nbJours === entree.nbJours && JSON.stringify(h.options) === JSON.stringify(entree.options)));
    // Ajouter en début
    historique.unshift(entree);
    // Limite à 5
    if (historique.length > 5) historique.pop();
    localStorage.setItem("meteoHistorique", JSON.stringify(historique));
    afficherHistorique();
  }

  // Fonction d'affichage de l'historique
  function afficherHistorique() {
    if (historique.length === 0) {
      historiqueDiv.innerHTML = "<p>Aucune recherche précédente.</p>";
      return;
    }
    historiqueDiv.innerHTML = "";
    historique.forEach((h, i) => {
      const div = document.createElement("div");
      div.classList.add("carte-historique");
      div.title = `Rechercher ${h.recherche}, ${h.nbJours} jour(s)`;
      div.innerHTML = `
        <strong>${h.recherche}</strong><br>
        <small>${h.nbJours} jour(s)</small>
      `;
      div.addEventListener("click", () => {
        // Remplir le formulaire avec cet historique et lancer la recherche
        document.getElementById("ville").value = h.recherche;
        document.getElementById("nb-jours").value = h.nbJours;
        document.getElementById("latitude").checked = h.options.latitude;
        document.getElementById("longitude").checked = h.options.longitude;
        document.getElementById("pluie").checked = h.options.pluie;
        document.getElementById("vent").checked = h.options.vent;
        document.getElementById("direction").checked = h.options.direction;
        lancerRecherche(h.recherche, h.nbJours, h.options);
      });
      historiqueDiv.appendChild(div);
    });
  }

  // Fonction centrale pour faire la recherche météo
  async function lancerRecherche(ville, nbJours, infos) {
    result.innerHTML = ""; // vide résultat précédent

    if (!ville) {
      result.innerHTML = "<p>Veuillez entrer une ville ou un code postal.</p>";
      return;
    }

    try {
      // Recherche commune
      const resCommune = await fetch(`https://api.meteo-concept.com/api/location/cities?token=${token}&search=${ville}`);
      const dataCommune = await resCommune.json();

      if (!dataCommune.cities || dataCommune.cities.length === 0) {
        result.innerHTML = "<p>Aucune ville trouvée.</p>";
        return;
      }

      const city = dataCommune.cities[0];
      const insee = city.insee;

      // Appel API météo
      const resMeteo = await fetch(`https://api.meteo-concept.com/api/forecast/daily?token=${token}&insee=${insee}`);
      const dataMeteo = await resMeteo.json();

      const forecasts = dataMeteo.forecast.slice(0, nbJours);

      // Construction du HTML affichage
      let html = `
        <div class="carte-ville">
          <h2>${city.name} (${city.cp})</h2>
          <ul>
            ${infos.latitude ? `<li><strong>Latitude :</strong> ${city.latitude}</li>` : ""}
            ${infos.longitude ? `<li><strong>Longitude :</strong> ${city.longitude}</li>` : ""}
          </ul>
        </div>
      `;

      forecasts.forEach((jour, index) => {
        const date = new Date(jour.datetime).toLocaleDateString("fr-FR");
        html += `
          <div class="carte-meteo">
            <h3>Prévision jour ${index + 1} - ${date}</h3>
            <ul>
              <li><strong>Température min :</strong> ${jour.tmin}°C</li>
              <li><strong>Température max :</strong> ${jour.tmax}°C</li>
              ${infos.pluie ? `<li><strong>Pluie :</strong> ${jour.rr10} mm</li>` : ""}
              ${infos.vent ? `<li><strong>Vent moyen :</strong> ${jour.wind10m} km/h</li>` : ""}
              ${infos.direction ? `<li><strong>Direction vent :</strong> ${jour.dirwind10m}°</li>` : ""}
            </ul>
          </div>
        `;
      });

      result.innerHTML = html;

      // Sauvegarder dans historique
      sauvegarderHistorique({ recherche: ville, nbJours, options: infos });

    } catch (error) {
      console.error("Erreur complète :", error);
      result.innerHTML = "<p>Une erreur est survenue lors de la récupération des données météo.</p>";
    }
  }

  // Quand formulaire soumis
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const ville = document.getElementById("ville").value.trim();
    const nbJours = document.getElementById("nb-jours").value;

    const infos = {
      latitude: document.getElementById("latitude").checked,
      longitude: document.getElementById("longitude").checked,
      pluie: document.getElementById("pluie").checked,
      vent: document.getElementById("vent").checked,
      direction: document.getElementById("direction").checked,
    };

    lancerRecherche(ville, nbJours, infos);
  });

  // Afficher l'historique au chargement
  afficherHistorique();

  // DARK MODE (optionnel, si tu veux garder ça)
  const darkToggle = document.getElementById("dark-mode-toggle");
  darkToggle.addEventListener("change", () => {
    document.body.classList.toggle("dark-mode", darkToggle.checked);
  });
});
