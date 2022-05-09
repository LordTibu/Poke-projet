/* ******************************************************************
 * Constantes de configuration
 * ****************************************************************** */
const serverUrl = "https://lifap5.univ-lyon1.fr";
/* ******************************************************************
 * Gestion de la boîte de dialogue (a.k.a. modal) d'affichage de
 * l'utilisateur.
 * ****************************************************************** */
/**
 * Fait une requête GET authentifiée sur /whoami
 * @param {string} keyapi la clé api
 * @returns une promesse du login utilisateur ou du message d'erreur
 */
function fetchWhoami(keyapi) {
  if(keyapi !== undefined){
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
}

/**
 * Fait une requête GET authentifiée sur /deck/:id
 * @param {Etat} etatCourant l'état courant
 * @returns promesse d'un array avec les ids dans le deck de l'utilisateurs ou du message d'erreur
 */
function getDeck(etatCourant){
  if(etatCourant.login !== undefined){
    return fetch(serverUrl + "/deck/" + etatCourant.login, { 
      headers: { "Api-Key": etatCourant.apiKey } 
    }).then((req) => {
      if (req.status === 200) {
        return req.json();
      } else if (req.status === 401) {
        return Promise.reject("Unknown key, unauthorized");
      } else {
        return Promise.reject("Unexpected status :" + req.status);
      }
    });
  }else {
    return Promise.reject("API key not set");
  }
}

/**
 * Fait une requête POST authentifiée sur /deck
 * @param {Etat} etatCourant l'état courant
 * @param {object} content tableau int des ids
 * @returns promesse d'un array avec les ids dans le deck de l'utilisateurs ou du message d'erreur
 */
function addDeck(etatCourant, content){
  if(etatCourant.login !== undefined){
    return fetch(serverUrl + "/deck", {
      headers: {"Api-Key": etatCourant.apiKey , "Content-Type" : "application/json" },
      body: JSON.stringify(content),
      method: "POST"
    }).then((req) => {
      if (req.status === 200) {
        return req.json();
      } else if (req.status === 401) {
        return Promise.reject("Unknown key, unauthorized");
      } else {
        return Promise.reject("Unexpected status :" + req.status);
      }
    });
  }else {
    return Promise.reject("API key not set");
  }
}

/**
 * Fait une requête GET sur /pokemon
 * @returns promesse d'un tableau contenant les pokemons connus par le serveur avec des détails sur chaque pokemon.
 */
const fetchPokemon = () => {
  return fetch(serverUrl + "/pokemon").then((response) => {return response.json()});
}

/**
 * Iteration a travers la table des pokemons
 */
function iterateAllPokemon(){
  fetchPokemon().then((pokeArray) => {
    pokeArray.forEach(pokemon => {console.log(pokemon.PokedexNumber);})
  })
}
/**
 * Génère le code HTML d'une partie de la table
 * @param {object} pokemon 
 * @returns le code HTML 
 */
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

/**
 * Genere une callback de la pokeListe dependant du pokemon 
 * @param {Etat} etatActuel l'etat actuel
 * @param {object} pokemon pokemon selon lequel faire la callback
 * @returns un objet contenant le callback dependant du pokemon 
 */
function generePokemonCallbacks(etatActuel, pokemon){
  return {[pokemon.Name] : {onclick : () => {
    console.log(`Clicked on ${pokemon.Name}`);
    if(document.getElementById("Liste").getElementsByClassName("is-selected")[0] !== undefined){
    document.getElementById("tbl-pokemons").
    getElementsByClassName("is-selected")[0].
    classList.toggle("is-selected");}
    document.getElementById(pokemon.Name).classList.toggle("is-selected");
    etatActuel.selectedPokemon = pokemon;
    document.getElementById("PokeCard").innerHTML = generePokeCardChimbo(pokemon);
    enregistreCallbacks({"addindeck": {onclick : () => {
      console.log("add " + pokemon.PokedexNumber);
      etatActuel.deckadd.push(pokemon.PokedexNumber);
      addDeck(etatActuel, etatActuel.deckadd);
    }}});
    }}
  };
}

/**
 * Genere le code HTML des abilities d'un pokemon, utilisé
 * pour afficher le pokemon dans la pokeListe
 * @param {object} pokemon pokemon selon lequel faire le HTML
 * @returns une string contenant le code HTML
 */
function generePokeAbilities(pokemon){
  const t = pokemon.Abilities.map(type => `<li>${type}</li>`);
  return `<td><ul>` + t.join("\n") +`</ul></td>`;
}

/**
 * Genere le code HTML des types d'un pokemon
 * @param {object} pokemon pokemon selon lequel faire le HTML
 * @returns une string contenant le code HTML
 */
function generePokeTypes(pokemon){
  const t = pokemon.Types.map(type => `<li>${type}</li>`);
  return `<td><ul>` + t.join("\n") +`</ul></td>`;
}

/**
 * Genere le code HTML des abilities d'un pokemon, utilisé
 * pour afficher la pokeCard (cf. "generePokeCard")
 * @param {object} pokemon pokemon selon lequel le HTML
 * @returns une string contenant le code HTML
 */
function generePokeAbilitiesCard(pokemon){
  const t = pokemon.Abilities.map(type => `<li>${type}</li>`);
  return t.join("\n");
}

/**
 * Genere le code HTML des resistances d'un pokemon, utilisé
 * pour afficher la pokeCard (cf. "generePokeCard")
 * @param {object} pokemon pokemon selon lequel faire les resistances
 * @returns un objet contenant le code HTML des resistances d'un poke
 * dans le champ strong et weak dependant de la valeur de la resistance
 */
function generePokeResistances(pokemon){
  const against = Object.entries(pokemon.Against);
  const strong = against.filter(pair => pair[1] < 1).map(pair => `<li>${pair[0]}</li>`).join("\n");
  const weak = against.filter(pair => pair[1] > 1).map(pair => `<li>${pair[0]}</li>`).join("\n");
  return {
    strong : strong,
    weak : weak
  }
}

/**
 * genere le code HTML de l'entree de la liste pokedex (pokeListe) d'un pokemon
 * @param {object} pokemon pokemon selon lequel genere le code HTML
 * @returns une string contenant le code HTML de l'entree du pokemon dans la liste
 * pokedex
 */
function generePokemonHTML(pokemon){
  const name = generePokeName(pokemon);
  const abilt = generePokeAbilities(pokemon);
  const types = generePokeTypes(pokemon);
  return name + abilt + types + `</tr>`;
}

/**
 * recupere la valeur de l'input search
 * @returns une string contenant la valeur ecrit dans search ou "" 
 */
function getvalsearch (){
  if(document.getElementById("search") !== null){ 
    return document.getElementById("search").value;
  } else {return ""}
}

/**
 * Genere le code HTML du header de la liste de pokemons
 *  a afficher selon le etatCourant
 * où on garde le array de pokemons, le type de sort, le nb de pokes a afficher
 * etc...
 * @returns une string contenant le code HTML du header de la liste
 */
function generePokeListeHead(){
  return `
  <section class="section">
      <div class="columns">
        <div class="column">
          <div class="tabs is-centered">
            <ul>
              <li class="is-active" id="tab-all-pokemons">
                <a>Tous les pokemons</a>
              </li>
              <li id="tab-tout"><a>Mes pokemons</a></li>
            </ul>
          </div>
          <div id="tbl-pokemons">
          <table class="table" id ="Liste">
            <thead>
              <tr>
                <th><span>Image</span></th>
                <th id="pokeListeNumber">
                  <span>#</span>
                  <span class="icon"><i class="fas fa-angle-up"></i></span>
                </th>
                <th id="pokeListeName"><span>Name</span></th>
                <th id="pokeListeAbilt"><span>Abilities</span></th>
                <th id="pokeListeTypes"><span>Types</span></th>
              </tr>
            </thead>
            <tbody id="PokeListe">`
}

/**
 * Genere une liste de callbacks qui correspond a chaque bouton  
 * @param {Etat} etatActuel l'etat actuel
 * @returns un objet contenant les callbacks 
 */
function genereListeCallbacks(etatActuel){
  return {
    "tab-tout" : {onclick : () => {
      console.log("clicked on deck show");
      
    }},
    "lessButton" : {onclick : () => {
      console.log("clicked on less");
      majEtatEtPage(etatActuel, {seenPokemon : etatActuel.seenPokemon - 10})
    }},
    "pokeListeNumber" : {onclick : () => {
      if(etatActuel.click === "numberDESC"){
        console.log(`Clicked on pokeListeNumber`);
        majEtatEtPage(etatActuel, {sort: pokeNumberCompareAsc, click :undefined})
      } else {
        majEtatEtPage(etatActuel, {sort: pokeNumberCompareDesc, click : "numberDESC"})
      }
    }},
    "pokeListeName" : {onclick : () => {
      if(etatActuel.click === "nameDESC"){
        console.log(`Clicked on pokeListeName`);
        majEtatEtPage(etatActuel, {sort: pokeNameCompareAsc, click :undefined})
      } else {
        majEtatEtPage(etatActuel, {sort: pokeNameCompareDesc, click : "nameDESC"})
      }
    }},
    "pokeListeAbilt" : {onclick : () => {
      if(etatActuel.click === "abilDESC"){
        console.log(`Clicked on pokeListeTypes`);
        majEtatEtPage(etatActuel, {sort: pokeAbilitiesCompareAsc, click :undefined})
      } else {
        console.log(`Clicked on pokeListeTypesDESC`);
        majEtatEtPage(etatActuel, {sort: pokeAbilitiesCompareDesc, click : "abilDESC"})
      }
    }},
    "pokeListeTypes" : {onclick : () => {
      if(etatActuel.click === "typeDESC"){
        console.log(`Clicked on pokeListeTypes`);
        majEtatEtPage(etatActuel, {sort: pokeTypeCompareAsc, click :undefined})
      } else {
        console.log(`Clicked on pokeListeTypesDESC`);
        majEtatEtPage(etatActuel, {sort: pokeTypeCompareDesc, click : "typeDESC"})
      }
    }},
    "search" : {
      oninput: () => {
          majEtatEtPage(etatActuel, {filter: filterName, sort: pokeNameCompareAsc, searchID : document.getElementById("search").value})
      
      }},
      "tab-tout" : {
        onclick: () => {
            getDeck(etatActuel).then(pokemons => {
                majEtatEtPage(etatActuel, { deckadd: pokemons });
              });
            console.log(etatActuel.deckadd);
        }}
  };
}

/**
 * Genere le code HTML du footer de la liste de pokemons
 *  a afficher selon le etatCourant
 * où on garde le array de pokemons, le type de sort, le nb de pokes a afficher
 * etc...
 * @param {Etat} etatCourant Etat Actuel du site web
 * @returns un objet contenant le code HTML de la liste dans le champ html
 * et les callbacks dans le champs callbacks
 */
function generePokeListeFooter(etatCourant){
  return {
    html: `</tbody>
    </table>
    <button class="button" id="lessButton" tabindex="0">Less</button>
    <button class="button" id="moreButton" tabindex="0">More</button>
    </div>
    </div>`,
    callbacks : {"moreButton" : {onclick : () => {
      console.log("Clicked on more");
      document.getElementById("PokeListe").insertAdjacentHTML("beforeend",
      etatCourant.pokemon.
      filter(etatCourant.filter).
      sort(etatCourant.sort).
      slice(etatCourant.seenPokemon, etatCourant.seenPokemon + 10).
      map(pokemon => generePokemonHTML(pokemon)).join("\n"));
      etatCourant.seenPokemon += 10;
      enregistreCallbacks(Object.assign({}, ...etatCourant.pokemon.
        filter(etatCourant.filter).sort(etatCourant.sort).
        slice(0, etatCourant.seenPokemon).
        map( pokemon => generePokemonCallbacks(etatCourant, pokemon))))
      }
    }}
  }
}

/**
 * Genere le code HTML de la liste de pokemons (pokeListe) a afficher selon le etatCourant
 * où on garde le array de pokemons, le type de sort, le nb de pokes a afficher
 * etc...
 * @param {Etat} etatCourant Etat Actuel du site web
 * @returns un objet contenant le code HTML de la liste dans le champ html
 * et les callbacks dans le champs callbacks
 */
function genereListePokemon(etatCourant){
  const htmlArray = etatCourant.pokemon.filter(etatCourant.filter).
  sort(etatCourant.sort).
  slice(0, etatCourant.seenPokemon).
  map(pokemon => generePokemonHTML(pokemon));
  const callb = Object.assign({}, ...etatCourant.pokemon.
    filter(etatCourant.filter).
    sort(etatCourant.sort).
    slice(0, etatCourant.seenPokemon).
    map( pokemon => generePokemonCallbacks(etatCourant, pokemon)));
  console.log(callb);
  const callb2 = genereListeCallbacks(etatCourant);
  return {html:generePokeListeHead() + htmlArray.join("\n") +
  generePokeListeFooter(etatCourant).html + 
  generePokeCard(etatCourant.selectedPokemon) +
  `</div>
  </div>
  </section>`,
  callbacks: {...callb, ...generePokeListeFooter(etatCourant).callbacks, ...callb2}};
}

/**
 * Fonction pour comparer deux pokemons selon le numero dans la pokedex
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
 const pokeNumberCompareDesc =(poke1, poke2)=> {
  return poke2.PokedexNumber - poke1.PokedexNumber;
}

/**
 * Fonction pour comparer deux pokemons selon le numero dans la pokedex
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
const pokeNumberCompareAsc =(poke1, poke2)=> {
  return poke1.PokedexNumber - poke2.PokedexNumber;
}

/**
 * Fonction pour comparer deux pokemons selon leur nom
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
const pokeNameCompareAsc = (poke1, poke2) =>{
  return poke1.Name > poke2.Name;
}

/**
 * Fonction pour comparer deux pokemons selon leur nom
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
 const pokeNameCompareDesc = (poke1, poke2) =>{
  return poke1.Name < poke2.Name;
}

/**
 * Fonction pour comparer deux pokemons selon leur type
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
const pokeTypeCompareAsc = (poke1, poke2)=>{
  return poke1.Types < poke2.Types;
}

/**
 * Fonction pour comparer deux pokemons selon leur type
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
 const pokeTypeCompareDesc = (poke1, poke2)=>{
  return poke1.Types > poke2.Types;
}

/**
 * Fonction pour comparer deux pokemons selon leurs abilities
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
 const pokeAbilitiesCompareAsc = (poke1, poke2)=>{
  return poke1.Abilities > poke2.Abilities;
}

/**
 * Fonction pour comparer deux pokemons selon leurs abilities
 * pour faire le sort du array avec les pokemons
 * @param {object} poke1 Pokemon numero 1
 * @param {object} poke2 Pokemon numero 2
 * @returns -1, 0, 1 dependant de quel pokemon est "superieur" 
 */
const pokeAbilitiesCompareDesc = (poke1, poke2)=>{
  return poke1.Abilities < poke2.Abilities;
}

/**
 * Fonction pour comparer un le nom d'un pokemon par rapport 
 * a la valeur de l'input search
 * @param {object} poke1 Pokemon 
 * @returns -1, 1 dependant si le nom comporte le input de search
 */
 const filterName = (poke1) => {
  if(document.getElementById("search") !== null){ 
  document.getElementById("search").value = document.getElementById("search").value;
  return poke1.Name.toLowerCase().indexOf(document.getElementById("search").value.toLowerCase()) >= 0;
  }
  return true;
}


/**
 * Génère le code HTML du header de la card avec les details du pokemon (pokeCard)
 * @param {object} pokemon le pokemon selon lequel produire la pokeCard
 * @returns une string contenant le code html du header de pokeCard
 */
function generePokeCardHead(pokemon){
  return`
  <div class="column">
  <div id="PokeCard" class="card">
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

/**
 * Génère le code HTML du header modifie de la card avec les details du pokemon (pokeCard)
 * @param {object} pokemon
 * @returns une string contenant le code html du header de pokeCard
 */
function generePokeCardHeadChimbo(pokemon){
  return`
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

/**
 * Génère le code HTML du corps de la card avec les details du pokemon (pokeCard)
 * @param {object} pokemon
 * @returns une string contenant le code html du corps de pokeCard
 */
function generePokeCardBody(pokemon){
  const abilt = generePokeAbilitiesCard(pokemon);
  const against = generePokeResistances(pokemon);
  return `
    <h3>Abilities</h3>
    <ul>
    ${abilt}
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

/**
 * Génère le code HTML du footer de la card avec les details du pokemon (pokeCard)
 * @param {object} pokemon
 * @returns une string contenant le code html du footer de pokeCard
 */
function generePokeCardFoot(pokemon){
  return`
  <figure class="image is-475x475">
            <img
              class=""
              src="${pokemon.Images.Full}"
              alt="${pokemon.Name}"
            />
          </figure>
        </figure>
      </article>
    </div>
    <div class="card-footer">
      <article class="media">
          <a id="addindeck" class="is-success button" >
            Ajouter à mon deck
          </a>
      </article>
    </div>
  </div>
  </div>`
}

/**
 * Génère le code HTML de la card avec les details du pokemon (pokeCard)
 * @param {object} pokemon
 * @returns une string contenant le code html de pokeCard
 */
function generePokeCard(pokemon){
  console.log("Card generated");
  const head = generePokeCardHead(pokemon);
  const body = generePokeCardBody(pokemon);
  const foot = generePokeCardFoot(pokemon);
  return head + body + foot;
}

/**
 * Meme fonction q la precedente mais avec quelques lignes de moins
 * pour faciliter l'insertion de la pokeCard
 * @param {object} pokemon
 * @returns une string contenant le code html de pokeCard
 */
function generePokeCardChimbo(pokemon){
  console.log("Card generated");
  const head = generePokeCardHeadChimbo(pokemon);
  const body = generePokeCardBody(pokemon);
  const foot = generePokeCardFoot(pokemon);
  return head + body + foot;
}

/**
 * Fait une requête sur le serveur et insère le login dans la modale d'affichage
 * de l'utilisateur puis déclenche l'affichage de cette modale.
 *
 * @param {object} etatCourant l'état courant
 * @param {string} keyapi clé api
 * @returns Une promesse de mise à jour
 */
function lanceWhoamiEtInsereLogin(etatCourant,keyapi) {
  return fetchWhoami(keyapi).then((data) => {
    majEtatEtPage(etatCourant, {
      login: data.user, // qui vaut undefined en cas d'erreur
      errLogin: data.err, // qui vaut undefined si tout va bien
      loginModal: true, // on affiche la modale
      apiKey: keyapi,
    });
  });
}

/**
 * Génère le code HTML du corps de la modale de login. On renvoie en plus un
 * objet callbacks 
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et les callbacks
 * pour le login
 */
function genereModaleLoginBody(etatCourant) {
  const html = `
  <section class="modal-card-body">
  <label for="keyapi">Api-Key:</label>
  <input type="password" id="keyapi" name="keyapi"><br><br>
  </section>
  <footer class="modal-card-foot" style="justify-content: flex-end">
  <a id="validateConnect" class="button"> Validate </a>
  <button id="btn-close-login-modal2" class="button">Fermer</button>
  </footer>
  `;
  return {
    html: html,
    callbacks: {
      "validateConnect": {
        onclick: () =>(afficheModaleConnexion(etatCourant, document.getElementById('keyapi').value),
        majEtatEtPage(etatCourant, { loginModal: false })),
      },"btn-close-login-modal2": {
        onclick: () => majEtatEtPage(etatCourant, { loginModal: false }),
      },
    },
  };
}

/**
 * Génère le code HTML du titre de la modale de login et les callbacks associés.
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
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereModaleLoginFooter(etatCourant) {

  if(etatCourant.loginModal && etatCourant.login !== undefined 
    && etatCourant.errLogin === undefined){
    majEtatEtPage(etatCourant, { loginModal: false });
  } else {
      return {
        callbacks: {
          "btn-close-login-modal2": {
            onclick: () => majEtatEtPage(etatCourant, { loginModal: false }),
          },
        },
      };
    }
  
}

/**
 * Génère le code HTML de la modale de login et les callbacks associés.
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

/**
 * Déclenche la mise à jour de la page en changeant l'état courant pour que la
 * modale de login soit affichée
 * @param {Etat} etatCourant l'etat courant
 * @param {string} keyapi clé api
 */
function afficheModaleConnexion(etatCourant,keyapi) {
  lanceWhoamiEtInsereLogin(etatCourant,keyapi);
}

/**
 * Génère le code HTML et les callbacks pour la partie gauche de la barre de
 * navigation qui contient le bouton de login.
 * @param {Etat} etatCourant
 * @returns un objet contenant le code HTML dans le champ html et la description
 * des callbacks à enregistrer dans le champ callbacks
 */
function genereBoutonConnexion(etatCourant) {
  const text =
    etatCourant.errLogin !== undefined
      ? etatCourant.errLogin
      : etatCourant.login;
  const htmlConnexion = `<a id="btn-open-login-modal" class="button is-light"> Connexion </a>`;
  const htmlDeconnexion = `<p>${text}</p><a id="btn-open-login-modal" class="button is-light"> Deconnexion </a>`;
  console.log("este es el estado");
  console.log(etatCourant);
  if(etatCourant.login !== undefined){
    return {
    html: htmlDeconnexion,
    callbacks: {
      "btn-open-login-modal": {
        onclick: () => majEtatEtPage(etatCourant, { loginModal: false , login: undefined, apiKey: undefined }),
      },
    },
  };
  } else if(etatCourant.errLogin === undefined){
    return {
      html: htmlConnexion,
      callbacks: {
        "btn-open-login-modal": {
          onclick: () => majEtatEtPage(etatCourant, { loginModal: true }),
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
  <nav class="navbar-start" role="navigation" aria-label="main navigation">
    <div class="navbar">
      <div class="navbar-item">
        <div class="buttons">
          <input type="text" id="search" placeholder="Search for pokemon.." value=${etatCourant.searchID}>
            <a id="btn-pokedex" class="button is-light"> Pokedex </a>
            <a id="btn-combat" class="button is-light"> Combat </a>
        </div>
      </div>
    </div>
  </nav>
  <nav class="navbar-end" role="navigation" aria-label="main navigation">
      <div class="navbar">
      <div class=navbar-item">
      <div class=buttons">
      ${connexion.html}
      </div></div></div>
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
  const pokemon = genereListePokemon(etatCourant)
  const modaleLogin = genereModaleLogin(etatCourant);
  // remarquer l'usage de la notation ... ci-dessous qui permet de "fusionner"
  // les dictionnaires de callbacks qui viennent de la barre et de la modale.
  // Attention, les callbacks définis dans modaleLogin.callbacks vont écraser
  // ceux définis sur les mêmes éléments dans barredeNavigation.callbacks. En
  // pratique ce cas ne doit pas se produire car barreDeNavigation et
  // modaleLogin portent sur des zone différentes de la page et n'ont pas
  // d'éléments en commun.
  return {
    html: barredeNavigation.html + pokemon.html +modaleLogin.html,
    callbacks: {...barredeNavigation.callbacks,
      ...pokemon.callbacks,
      ...modaleLogin.callbacks},
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
function majPage(etatCourant) {
  console.log("CALL majPage");
  const page = generePage(etatCourant);
  document.getElementById("pagina").innerHTML = page.html;
  enregistreCallbacks(page.callbacks);
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
  fetchPokemon().then(pokeArray => {
    majEtatEtPage(etatInitial, {
      pokemon : pokeArray,
      selectedPokemon: pokeArray[18],
      sort: pokeNumberCompareAsc,
      filter : filterName,
      seenPokemon : 10,
      click : undefined,
      deckadd: [],
      searchID: ""
    })
  })
}

/** 
 * Appel de la fonction init_client_duels au après chargement de la page
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("Exécution du code après chargement de la page");
  //iterateAllPokemon();
  initClientPokemons();
});
