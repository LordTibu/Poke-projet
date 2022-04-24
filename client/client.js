/* ******************************************************************
 * Constantes de configuration
 * ****************************************************************** */
//const apiKey = "bafae61a-54b5-4977-94d4-d8159bec8262";
const serverUrl = "https://lifap5.univ-lyon1.fr";
//const allPokemon = fetch(serverUrl + "/pokemon").then((response) => {return response.json()});

/* ******************************************************************
 * Gestion de la boîte de dialogue (a.k.a. modal) d'affichage de
 * l'utilisateur.
 * ****************************************************************** */
/**
 * Fait une requête GET authentifiée sur /whoami
 * @returns une promesse du login utilisateur ou du message d'erreur
 */
function fetchWhoami(keyapi) {
  return fetch(serverUrl + "/whoami", { headers: { "Api-Key": keyapi } })
    .then((response) => {
      if (response.status === 401) {
        return response.json().then((json) => {
          console.log(json);
          return { err: json.message };
        });
      } else {
        return response.json();
      }
    })
    .catch((erreur) => ({ err: erreur }));
}

// Get all pokemons from server
function fetchPokemon() {
  return fetch(serverUrl + "/pokemon").then((response) => {return response.json()});
}

// Funcion ejemplo de como iterar a traves del tab de pokemones
function iterateAllPokemon(){
  fetchPokemon().then((pokeArray) => {
    pokeArray.forEach(pokemon => {console.log(pokemon.PokedexNumber);})
  })
}

function generePokeName(pokemon){
    return`
    <tr id="${pokemon.Name}" class="">
    <td>
      <img
        alt="${pokemon.Name}"
        src="${pokemon.Images.Detail}"
        width="64"
      />
    </td>
    <td><div class="content">${pokemon.PokedexNumber}</div></td>
    <td><div class="content">${pokemon.Name}</div></td>`;
}

function generePokemonCallbacks(pokemon){
  return {[pokemon.Name] : {onclick : () => {console.log(`Clicked on ${pokemon.Name}`);
    document.getElementById(pokemon.Name).classList.toggle("is-selected");}
  }};
}

function generePokeAbilities(pokemon){
  const t = pokemon.Abilities.map(type => `<li>${type}</li>`);
  return `<td><ul>` + t.join("\n") +`</ul></td>`;
}

function generePokeTypes(pokemon){
  const t = pokemon.Types.map(type => `<li>${type}</li>`);
  return `<td><ul>` + t.join("\n") +`</ul></td>`;
}

function generePokeTypesCard(pokemon){
  const t = pokemon.Abilities.map(type => `<li>${type}</li>`);
  return t.join("\n");
}

function generePokeResistances(pokemon){
  const against = Object.entries(pokemon.Against);
  const strong = against.filter(pair => pair[1] < 1).map(pair => `<li>${pair[0]}</li>`).join("\n");
  const weak = against.filter(pair => pair[1] > 1).map(pair => `<li>${pair[0]}</li>`).join("\n");
  return {
    strong : strong,
    weak : weak
  }
}

// Genera la entrada de un pokemon en la lista de la izquierda
function generePokemonHTML(pokemon){
  const name = generePokeName(pokemon);
  const abilt = generePokeAbilities(pokemon);
  const types = generePokeTypes(pokemon);
  return name + abilt + types + `</tr>`;
}

function generePokeListeHead(){
  return `<div id="tbl-pokemons">
  <table class="table">
    <thead>
      <tr>
        <th><span>Image</span></th>
        <th>
          <span>#</span
          ><span class="icon"><i class="fas fa-angle-up"></i></span>
        </th>
        <th><span>Name</span></th>
        <th><span>Abilities</span></th>
        <th><span>Types</span></th>
      </tr>
    </thead>
    <tbody>`
}

function generePokeListeFooter(){
  return `</tbody>
  </table>
  </div>`
}

function genereListePokemon(etatCourant){
  return fetchPokemon().then(pokeArray => {
    const htmlArray = pokeArray.map(pokemon => generePokemonHTML(pokemon));
    const callb = Object.assign({}, ...pokeArray.map(
      pokemon => generePokemonCallbacks(pokemon)))
    majPage(etatCourant, {html:generePokeListeHead() + htmlArray.join("\n") +
    generePokeListeFooter() + generePokeCard(pokeArray[0]),
    callbacks: callb});
  });
}

function generePokeCardHead(pokemon){
  return`
  <div class="column">
  <div class="card">
    <div class="card-header">
      <div class="card-header-title">${pokemon.JapaneseName}</div>
    </div>
    <div class="card-content">
      <article class="media">
        <div class="media-content">
          <h1 class="title">${pokemon.Name}</h1>
        </div>
      </article>
    </div>
    <div class="card-content">
      <article class="media">
        <div class="media-content">
          <div class="content has-text-left">
            <p>Hit points: ${pokemon.Hp}</p>`
}

function generePokeCardBody(pokemon){
  const types = generePokeTypesCard(pokemon);
  const against = generePokeResistances(pokemon);
  return `
  <h3>Abilities</h3>
  <ul>
   ${types}
  </ul>
  <h3>Resistant against</h3>
  <ul>
    ${against.strong}
  </ul>
  <h3>Weak against</h3>
  <ul>
    ${against.weak}
  </ul>
</div>
</div>
<figure class="media-right">`
}

function generePokeCardFoot(pokemon){
  return`
  <figure class="image is-475x475">
            <img
              class=""
              src="${pokemon.Images.Detail}"
              alt="${pokemon.Name}"
            />
          </figure>
        </figure>
      </article>
    </div>
    <div class="card-footer">
      <article class="media">
        <div class="media-content">
          <button class="is-success button" tabindex="0">
            Ajouter à mon deck
          </button>
        </div>
      </article>
    </div>
  </div>
  </div>`
}

function generePokeCard(pokemon){
  console.log("se genero carta");
  const head = generePokeCardHead(pokemon);
  const body = generePokeCardBody(pokemon);
  const foot = generePokeCardFoot(pokemon);
  return head + body + foot;
}

/**
 * Fait une requête sur le serveur et insère le login dans la modale d'affichage
 * de l'utilisateur puis déclenche l'affichage de cette modale.
 *
 * @param {Etat} etatCourant l'état courant
 * @returns Une promesse de mise à jour
 */
function lanceWhoamiEtInsereLogin(etatCourant,keyapi) {
  return fetchWhoami(keyapi).then((data) => {
    majEtatEtPage(etatCourant, {
      login: data.user, // qui vaut undefined en cas d'erreur
      errLogin: data.err, // qui vaut undefined si tout va bien
      loginModal: true, // on affiche la modale
    });
  });
}

/**
 * Génère le code HTML du corps de la modale de login. On renvoie en plus un
 * objet callbacks vide pour faire comme les autres fonctions de génération,
 * mais ce n'est pas obligatoire ici.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et un objet vide
 * dans le champ callbacks
 */
function genereModaleLoginBody(etatCourant) {
  const text =
    etatCourant.errLogin !== undefined
      ? etatCourant.errLogin
      : etatCourant.login;
  return {
    html: `
  <section class="modal-card-body">
    <p>${text}</p>
  </section>
  `,
    callbacks: {},
  };
}

/**
 * Génère le code HTML du titre de la modale de login et les callbacks associés.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereModaleLoginHeader(etatCourant) {
  return {
    html: `
<header class="modal-card-head  is-back">
  <p class="modal-card-title">Utilisateur</p>
  <button
    id="btn-close-login-modal1"
    class="delete"
    aria-label="close"
    ></button>
</header>`,
    callbacks: {
      "btn-close-login-modal1": {
        onclick: () => majEtatEtPage(etatCourant, { loginModal: false }),
      },
    },
  };
}

/**
 * Génère le code HTML du base de page de la modale de login et les callbacks associés.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereModaleLoginFooter(etatCourant) {
  return {
    html: `
  <footer class="modal-card-foot" style="justify-content: flex-end">
    <button id="btn-close-login-modal2" class="button">Fermer</button>
  </footer>
  `,
    callbacks: {
      "btn-close-login-modal2": {
        onclick: () => majEtatEtPage(etatCourant, { loginModal: false }),
      },
    },
  };
}

/**
 * Génère le code HTML de la modale de login et les callbacks associés.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereModaleLogin(etatCourant) {
  const header = genereModaleLoginHeader(etatCourant);
  const footer = genereModaleLoginFooter(etatCourant);
  const body = genereModaleLoginBody(etatCourant);
  const activeClass = etatCourant.loginModal ? "is-active" : "is-inactive";
  return {
    html: `
      <div id="mdl-login" class="modal ${activeClass}">
        <div class="modal-background"></div>
        <div class="modal-card">
          ${header.html}
          ${body.html}
          ${footer.html}
        </div>
      </div>`,
    callbacks: { ...header.callbacks, ...footer.callbacks, ...body.callbacks },
  };
}

/* ************************************************************************
 * Gestion de barre de navigation contenant en particulier les bouton Pokedex,
 * Combat et Connexion.
 * ****************************************************************** */

/**
 * Déclenche la mise à jour de la page en changeant l'état courant pour que la
 * modale de login soit affichée
 * @param {Etat} etatCourant
 */
function afficheModaleConnexion(etatCourant,keyapi) {
  lanceWhoamiEtInsereLogin(etatCourant,keyapi);
}

/**
 * Génère le code HTML et les callbacks pour la partie droite de la barre de
 * navigation qui contient le bouton de login.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereBoutonConnexion(etatCourant) {
  const html = `
  <div class="navbar-end">
    <div class="navbar-item">
      <div class="buttons">
        <a id="btn-open-login-modal" class="button is-light"> Connexion </a>
        <label for="keyapi">Api-Key:</label>
        <input type="password" id="keyapi" name="keyapi"><br><br>
      </div>
    </div>
  </div>`;
  const html2 = `
  <div class="navbar-end">
    <div class="navbar-item">
      <div class="buttons">
        <a id="btn-open-login-modal" class="button is-light"> Deconnexion </a>
      </div>
    </div>
  </div>`;
  if(etatCourant.errLogin === undefined){
    return {
    html: html,
    callbacks: {
      "btn-open-login-modal": {
        onclick: () => afficheModaleConnexion(etatCourant,document.getElementById("keyapi").value),
      },
    },
  };
  } else {
    return {html: html2,
      callbacks: {
        "btn-open-login-modal": {
          onclick: () => afficheModaleConnexion(etatCourant,document.getElementById("keyapi").value),
        },
      },
    };
  }
}

/**
 * Génère le code HTML de la barre de navigation et les callbacks associés.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereBarreNavigation(etatCourant) {
  const connexion = genereBoutonConnexion(etatCourant);
  return {
    html: `
  <nav class="navbar" role="navigation" aria-label="main navigation">
    <div class="navbar">
      <div class="navbar-item"><div class="buttons">
          <a id="btn-pokedex" class="button is-light"> Pokedex </a>
          <a id="btn-combat" class="button is-light"> Combat </a>
      </div></div>
      ${connexion.html}
    </div>
  </nav>`,
    callbacks: {
      ...connexion.callbacks,
      "btn-pokedex": { onclick: () => console.log("click bouton pokedex") },
    },
  };
}

/**
 * Génére le code HTML de la page ainsi que l'ensemble des callbacks à
 * enregistrer sur les éléments de cette page.
 *
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function generePage(etatCourant) {
  const barredeNavigation = genereBarreNavigation(etatCourant);
  const modaleLogin = genereModaleLogin(etatCourant);
  // remarquer l'usage de la notation ... ci-dessous qui permet de "fusionner"
  // les dictionnaires de callbacks qui viennent de la barre et de la modale.
  // Attention, les callbacks définis dans modaleLogin.callbacks vont écraser
  // ceux définis sur les mêmes éléments dans barredeNavigation.callbacks. En
  // pratique ce cas ne doit pas se produire car barreDeNavigation et
  // modaleLogin portent sur des zone différentes de la page et n'ont pas
  // d'éléments en commun.
  return {
    html: barredeNavigation.html + modaleLogin.html,
    callbacks: { ...barredeNavigation.callbacks, ...modaleLogin.callbacks },
  };
}

/* ******************************************************************
 * Initialisation de la page et fonction de mise à jour
 * globale de la page.
 * ****************************************************************** */

/**
 * Créée un nouvel état basé sur les champs de l'ancien état, mais en prenant en
 * compte les nouvelles valeurs indiquées dans champsMisAJour, puis déclenche la
 * mise à jour de la page et des événements avec le nouvel état.
 *
 * @param {Etat} etatCourant etat avant la mise à jour
 * @param {*} champsMisAJour objet contenant les champs à mettre à jour, ainsi
 * que leur (nouvelle) valeur.
 */
function majEtatEtPage(etatCourant, champsMisAJour) {
  const nouvelEtat = { ...etatCourant, ...champsMisAJour };
  majPage(nouvelEtat);
}

/**
 * Prend une structure décrivant les callbacks à enregistrer et effectue les
 * affectation sur les bon champs "on...". Par exemple si callbacks contient la
 * structure suivante où f1, f2 et f3 sont des callbacks:
 *
 * { "btn-pokedex": { "onclick": f1 },
 *   "input-search": { "onchange": f2,
 *                     "oninput": f3 }
 * }
 *
 * alors cette fonction rangera f1 dans le champ "onclick" de l'élément dont
 * l'id est "btn-pokedex", rangera f2 dans le champ "onchange" de l'élément dont
 * l'id est "input-search" et rangera f3 dans le champ "oninput" de ce même
 * élément. Cela aura, entre autres, pour effet de délclencher un appel à f1
 * lorsque l'on cliquera sur le bouton "btn-pokedex".
 *
 * @param {Object} callbacks dictionnaire associant les id d'éléments à un
 * dictionnaire qui associe des champs "on..." aux callbacks désirés.
 */
function enregistreCallbacks(callbacks) {
  Object.keys(callbacks).forEach((id) => {
    const elt = document.getElementById(id);
    if (elt === undefined || elt === null) {
      console.log(
        `Élément inconnu: ${id}, impossible d'enregistrer de callback sur cet id`
      );
    } else {
      Object.keys(callbacks[id]).forEach((onAction) => {
        elt[onAction] = callbacks[id][onAction];
      });
    }
  });
}

/**
 * Mets à jour la page (contenu et événements) en fonction d'un nouvel état.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majPage(etatCourant, listePokemon = "") {
  console.log("CALL majPage");
  const page = generePage(etatCourant);
  document.getElementById("root").innerHTML = page.html + listePokemon.html;
  enregistreCallbacks({...page.callbacks, ...listePokemon.callbacks});
}

/**
 * Appelé après le chargement de la page.
 * Met en place la mécanique de gestion des événements
 * en lançant la mise à jour de la page à partir d'un état initial.
 */
function initClientPokemons() {
  console.log("CALL initClientPokemons");
  const etatInitial = {
    loginModal: false,
    login: undefined,
    errLogin: undefined,
  };
  genereListePokemon(etatInitial);
}

// Appel de la fonction init_client_duels au après chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Exécution du code après chargement de la page");
  //iterateAllPokemon();
  initClientPokemons();
});
