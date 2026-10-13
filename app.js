
// v5: Android Web Share Target receiver
function getSharedInput(){const p=new URLSearchParams(location.search);const url=p.get("url")||"",text=p.get("text")||"",title=p.get("title")||"";if(!url&&!text&&!title)return null;return{url,text,title};}
function showSharedImport(){const d=getSharedInput();if(!d)return;const value=d.url||d.text||"";window.__sharedRecipe=d;window.dispatchEvent(new CustomEvent("shared-recipe",{detail:d}));try{history.replaceState({},document.title,location.pathname)}catch(e){}}
window.addEventListener("DOMContentLoaded",()=>setTimeout(showSharedImport,300));

const { createClient } = window.supabase;
const cfg = window.SUPABASE_CONFIG || {};
const supabaseReady = cfg.url && cfg.anonKey && !cfg.url.includes("JOUW-PROJECT") && !cfg.anonKey.includes("JOUW-PUBLIEKE");
const sb = supabaseReady ? createClient(cfg.url, cfg.anonKey) : null;

const KEY="mijn-kookboek-v2";
const DAYS=["Ma","Di","Wo","Do","Vr","Za","Zo"];
const demo=[
{id:crypto.randomUUID(),title:"Romige kip met spinazie",category:"Avondeten",servings:4,time:30,source:"",ingredients:["500 g kipfilet","200 ml room","150 g spinazie","2 teentjes knoflook","1 el olijfolie"],steps:["Snijd de kip in stukken.","Bak de kip goudbruin in olijfolie.","Voeg knoflook en spinazie toe.","Roer de room erdoor en laat 8 minuten zacht koken."],notes:"Lekker met rijst.",favorite:true,done:false},
{id:crypto.randomUUID(),title:"Citroenpasta",category:"Avondeten",servings:2,time:20,source:"",ingredients:["200 g pasta","1 citroen","50 g Parmezaan","100 ml room","Peper en zout"],steps:["Kook de pasta.","Rasp citroenschil en pers het sap.","Meng room, citroen en Parmezaan.","Schep de pasta door de saus."],notes:"Ook goed met courgette.",favorite:false,done:false}
];
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{recipes:demo,shopping:[],plan:{}};
let currentUser=null, syncTimer=null, realtimeChannel=null;

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function localSave(){localStorage.setItem(KEY,JSON.stringify(state));}
function setStatus(t){const e=$("#syncStatus");if(e)e.textContent=t;}
function showAuth(show){document.body.classList.toggle("loggedout",show);$("#auth").classList.toggle("active",show);}
function nav(view){if(!currentUser)return;$$(".view").forEach(x=>x.classList.toggle("active",x.id===view));$$(".bottomnav button").forEach(b=>b.classList.toggle("navactive",b.dataset.nav===view)); if(view==="home")renderHome(); if(view==="shopping")renderShopping(); if(view==="planner")renderPlanner(); if(view==="add")resetForm(); window.scrollTo(0,0)}
$$("[data-nav]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.nav)));
$("#addTop").onclick=()=>nav("add");

function cats(){return [...new Set(state.recipes.map(r=>r.category).filter(Boolean))].sort()}
function renderCats(){const s=$("#categoryFilter"),v=s.value;s.innerHTML='<option value="">Alle categorieën</option>'+cats().map(c=>`<option>${esc(c)}</option>`).join("");s.value=v;$("#quickFilters").innerHTML=cats().map(c=>`<button class="chip" data-cat="${esc(c)}">${esc(c)}</button>`).join("");$$(".chip").forEach(b=>b.onclick=()=>{s.value=b.dataset.cat;renderHome()})}
function renderHome(){renderCats();const q=$("#search").value.toLowerCase(),c=$("#categoryFilter").value;const rs=state.recipes.filter(r=>(!c||r.category===c)&&(!q||[r.title,r.category,...r.ingredients].join(" ").toLowerCase().includes(q)));$("#recipeGrid").innerHTML=rs.length?rs.map(card).join(""):`<div class="panel"><h3>Nog geen recepten</h3><p>Voeg je eerste recept toe via de knop hierboven.</p></div>`;$$(".card").forEach(x=>x.onclick=e=>{if(e.target.closest(".star"))return;openDetail(x.dataset.id)});$$(".star").forEach(x=>x.onclick=e=>{e.stopPropagation();toggleFav(x.dataset.id)})}
function card(r){return `<article class="card" data-id="${r.id}"><div class="cover">${r.image_url?`<img src="${esc(r.image_url)}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block';"><span style="display:none">${emoji(r.category)}</span>`:`<span>${emoji(r.category)}</span>`}<button class="star" data-id="${r.id}">${r.favorite?"★":"☆"}</button></div><div class="cardbody"><h3>${esc(r.title)}</h3><div class="meta">${r.time||"?"} min · ${r.servings||"?"} porties · ${esc(r.category||"Andere")}</div><div class="tags"><span class="tag">${r.done?"✓ Gemaakt":"Nog te maken"}</span></div></div></article>`}
function openDetail(id){const r=state.recipes.find(x=>x.id===id);if(!r)return;$("#detailContent").innerHTML=`<div class="detailhero">${r.image_url?`<img class="detailphoto" src="${esc(r.image_url)}" alt="" onerror="this.style.display='none'">`:""}<div class="eyebrow" style="color:#d9e5da">${esc(r.category)}</div><h2>${esc(r.title)}</h2><div>${r.time||"?"} min · ${r.servings||"?"} porties</div><div class="detailactions"><button class="primary" onclick="toggleFav('${r.id}')">${r.favorite?"★ Favoriet":"☆ Favoriet"}</button><button class="ghost" onclick="editRecipe('${r.id}')">✎ Bewerken</button><button class="ghost" onclick="markDone('${r.id}')">${r.done?"✓ Al gemaakt":"✓ Markeer als gemaakt"}</button></div></div><div class="detailgrid"><div class="panel"><h3>Ingrediënten</h3><ul class="ingredients">${r.ingredients.map((x,i)=>`<li>${esc(x)} <button class="ghost" style="float:right;padding:0" onclick="addShop('${r.id}',${i})">＋</button></li>`).join("")}</ul></div><div class="panel"><h3>Bereiding</h3><ol class="steps">${(r.steps||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol>${r.notes?`<h3>Notities</h3><p>${esc(r.notes)}</p>`:""}${r.source?`<p><a href="${esc(r.source)}" target="_blank" rel="noopener">Originele bron ↗</a></p>`:""}</div></div><div class="panel" style="margin-top:18px"><h3>Receptbeheer</h3><button class="ghost danger" onclick="deleteRecipe('${r.id}')">Verwijder recept</button></div>`;nav("detail");}
function toggleFav(id){const r=state.recipes.find(x=>x.id===id);if(r){r.favorite=!r.favorite;saveAndSync();renderHome();if($("#detail").classList.contains("active"))openDetail(id)}}
function markDone(id){const r=state.recipes.find(x=>x.id===id);if(r){r.done=!r.done;saveAndSync();openDetail(id)}}
function deleteRecipe(id){if(confirm("Recept verwijderen?")){state.recipes=state.recipes.filter(r=>r.id!==id);Object.keys(state.plan).forEach(k=>state.plan[k]=(state.plan[k]||[]).filter(x=>x!==id));saveAndSync();nav("home")}}
function addShop(id,i){const r=state.recipes.find(x=>x.id===id);if(r){state.shopping.push({id:crypto.randomUUID(),text:r.ingredients[i],done:false});saveAndSync();alert("Toegevoegd aan boodschappenlijst.")}}
function editRecipe(id){const r=state.recipes.find(x=>x.id===id);if(!r)return;nav("add");$("#editId").value=r.id;$("#title").value=r.title;$("#category").value=r.category;$("#servings").value=r.servings||4;$("#time").value=r.time||30;$("#source").value=r.source||"";$("#imageUrl").value=r.image_url||"";$("#ingredients").value=r.ingredients.join("\n");$("#steps").value=(r.steps||[]).join("\n");$("#notes").value=r.notes||"";$("#saveRecipe").textContent="Wijzigingen bewaren"}
function resetForm(){["editId","title","source","imageUrl","ingredients","steps","notes"].forEach(id=>$("#"+id).value="");$("#servings").value=4;$("#time").value=30;$("#category").value="Avondeten";$("#saveRecipe").textContent="Recept bewaren";$("#importText").value=""}
$("#resetForm").onclick=resetForm;
$("#saveRecipe").onclick=()=>{const title=$("#title").value.trim();if(!title)return alert("Geef het recept een titel.");const id=$("#editId").value||crypto.randomUUID();const old=state.recipes.find(r=>r.id===id);const r={id,title,category:$("#category").value,servings:+$("#servings").value||4,time:+$("#time").value||0,source:$("#source").value.trim(),ingredients:lines($("#ingredients").value),steps:lines($("#steps").value),notes:$("#notes").value.trim(),image_url:$("#imageUrl").value.trim(),favorite:old?.favorite||false,done:old?.done||false};state.recipes=old?state.recipes.map(x=>x.id===id?r:x):[r,...state.recipes];saveAndSync();nav("home");openDetail(id)}
$("#parseImport").onclick=()=>{const t=$("#importText").value.trim();if(!t)return;const linesT=t.split(/\n+/).map(x=>x.trim()).filter(Boolean);const title=linesT.find(x=>!/^https?:\/\//i.test(x))?.replace(/^#+\s*/,"").slice(0,80)||"Nieuw recept";$("#title").value=title;$("#source").value=(t.match(/https?:\/\/\S+/)||[""])[0];const ing=linesT.filter(x=>/^\d|g\b|kg\b|ml\b|cl\b|el\b|tl\b|stuk|stuks|teentje|eetlepel|theelepel/i.test(x));$("#ingredients").value=ing.join("\n");$("#steps").value=linesT.filter(x=>!ing.includes(x)&&x!==title&&!/^https?:\/\//i.test(x)).join("\n");alert("De tekst is voorbereid. Controleer het recept en bewaar het.")};

function renderShopping(){const list=$("#shoppingList");list.innerHTML=state.shopping.length?state.shopping.map(x=>`<div class="shopitem ${x.done?"done":""}"><input type="checkbox" ${x.done?"checked":""} onchange="toggleShop('${x.id}')"><span>${esc(x.text)}</span><button class="ghost" onclick="delShop('${x.id}')">×</button></div>`).join(""):`<div class="panel"><p>Je boodschappenlijst is leeg.</p></div>`}
function toggleShop(id){const x=state.shopping.find(x=>x.id===id);if(x)x.done=!x.done;saveAndSync();renderShopping()}function delShop(id){state.shopping=state.shopping.filter(x=>x.id!==id);saveAndSync();renderShopping()}
$("#addShopping").onclick=()=>{const v=$("#shoppingInput").value.trim();if(v){state.shopping.push({id:crypto.randomUUID(),text:v,done:false});$("#shoppingInput").value="";saveAndSync();renderShopping()}};$("#clearDone").onclick=()=>{state.shopping=state.shopping.filter(x=>!x.done);saveAndSync();renderShopping()};

function renderPlanner(){const today=new Date(),mon=new Date(today);mon.setDate(today.getDate()-((today.getDay()+6)%7));$("#weekPlan").innerHTML=DAYS.map((d,i)=>{const dt=new Date(mon);dt.setDate(mon.getDate()+i);const key=dt.toISOString().slice(0,10);return `<div class="day"><h3>${d} ${dt.getDate()}/${dt.getMonth()+1}</h3>${(state.plan[key]||[]).map(id=>{const r=state.recipes.find(x=>x.id===id);return r?`<div class="planitem">${esc(r.title)}</div>`:""}).join("")}<button class="ghost" onclick="planDay('${key}')">＋ recept</button></div>`}).join("")}
function planDay(key){const names=state.recipes.map(r=>r.title);const answer=prompt("Welk recept wil je plannen?\n\n"+names.map((n,i)=>`${i+1}. ${n}`).join("\n"));const i=+answer-1;if(state.recipes[i]){state.plan[key]=[...(state.plan[key]||[]),state.recipes[i].id];saveAndSync();renderPlanner()}}
$("#planAdd").onclick=()=>{const first=Object.keys(state.plan)[0]||new Date().toISOString().slice(0,10);planDay(first)}

$("#search").oninput=renderHome;$("#categoryFilter").onchange=renderHome;
function lines(s){return s.split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function emoji(c){return ({Dessert:"🍰",Bakwerk:"🥐",Soep:"🍲",Lunch:"🥗",Ontbijt:"🥞",BBQ:"🔥",Drank:"🥤"})[c]||"🍝"}

async function saveAndSync(){
  localSave();
  if(currentUser) queueSync();
}
function queueSync(){
  clearTimeout(syncTimer);
  setStatus("Wijzigingen worden gesynchroniseerd…");
  syncTimer=setTimeout(syncAll,500);
}
async function syncAll(){
  if(!sb||!currentUser)return;
  try{
    const uid=currentUser.id;
    const recipes=state.recipes.map(r=>({
      id:r.id,user_id:uid,title:r.title,category:r.category||null,servings:r.servings||4,
      time_minutes:r.time||0,source_url:r.source||null,image_url:r.image_url||null,
      ingredients:r.ingredients||[],steps:r.steps||[],notes:r.notes||null,favorite:!!r.favorite,
      made:!!r.done,updated_at:new Date().toISOString()
    }));
    if(recipes.length) await sb.from("recipes").upsert(recipes,{onConflict:"id"});
    const {data:remoteRecipes,error:re}=await sb.from("recipes").select("id").eq("user_id",uid);
    if(re)throw re;
    const localIds=new Set(state.recipes.map(r=>r.id));
    const remove=(remoteRecipes||[]).filter(x=>!localIds.has(x.id)).map(x=>x.id);
    if(remove.length) await sb.from("recipes").delete().in("id",remove);

    await sb.from("shopping_items").delete().eq("user_id",uid);
    if(state.shopping.length) await sb.from("shopping_items").insert(state.shopping.map(x=>({id:x.id,user_id:uid,text:x.text,done:!!x.done})));

    await sb.from("meal_plan").delete().eq("user_id",uid);
    const plans=[];
    Object.entries(state.plan).forEach(([date,ids])=>(ids||[]).forEach(recipe_id=>plans.push({user_id:uid,plan_date:date,recipe_id})));
    if(plans.length) await sb.from("meal_plan").insert(plans);
    setStatus("✓ Gesynchroniseerd");
  }catch(e){console.error(e);setStatus("Synchronisatie mislukt — controleer je Supabase-instellingen.");}
}
async function loadRemote(){
  if(!sb||!currentUser)return;
  setStatus("Gegevens laden…");
  const uid=currentUser.id;
  const [rr,ss,pp]=await Promise.all([
    sb.from("recipes").select("*").eq("user_id",uid).order("created_at",{ascending:false}),
    sb.from("shopping_items").select("*").eq("user_id",uid).order("created_at",{ascending:true}),
    sb.from("meal_plan").select("*").eq("user_id",uid)
  ]);
  if(rr.error||ss.error||pp.error)throw(rr.error||ss.error||pp.error);
  if((rr.data||[]).length){
    state.recipes=rr.data.map(r=>({id:r.id,title:r.title,category:r.category||"Andere",servings:r.servings||4,time:r.time_minutes||0,source:r.source_url||"",image_url:r.image_url||"",ingredients:r.ingredients||[],steps:r.steps||[],notes:r.notes||"",favorite:!!r.favorite,done:!!r.made}));
  }else{
    // Eerste login: zet bestaande lokale recepten één keer online.
    await syncAll();
  }
  if((rr.data||[]).length || (ss.data||[]).length || (pp.data||[]).length){
    state.shopping=(ss.data||[]).map(x=>({id:x.id,text:x.text,done:!!x.done}));
    state.plan={};
    (pp.data||[]).forEach(x=>(state.plan[x.plan_date]??=[]).push(x.recipe_id));
    localSave();
  }
  setStatus("✓ Online gesynchroniseerd");
  renderHome();
}
function subscribeRealtime(){
  if(!sb||!currentUser)return;
  if(realtimeChannel)sb.removeChannel(realtimeChannel);
  realtimeChannel=sb.channel("kookboek-"+currentUser.id)
    .on("postgres_changes",{event:"*",schema:"public",table:"recipes",filter:"user_id=eq."+currentUser.id},()=>loadRemote().catch(console.error))
    .on("postgres_changes",{event:"*",schema:"public",table:"shopping_items",filter:"user_id=eq."+currentUser.id},()=>loadRemote().catch(console.error))
    .on("postgres_changes",{event:"*",schema:"public",table:"meal_plan",filter:"user_id=eq."+currentUser.id},()=>loadRemote().catch(console.error))
    .subscribe();
}
async function startApp(user){
  currentUser=user; showAuth(false);
  try{await loadRemote(); subscribeRealtime();}catch(e){console.error(e);setStatus("Verbonden, maar laden mislukt.");renderHome();}
}
async function authInit(){
  document.body.classList.add("loggedout");
  if(!sb){$("#authMsg").textContent="Vul eerst je Supabase URL en publieke anon/publishable key in config.js.";return;}
  const {data}=await sb.auth.getSession();
  if(data.session) await startApp(data.session.user);
  sb.auth.onAuthStateChange((_event,session)=>{if(session)startApp(session.user);else{currentUser=null;showAuth(true);}});
}
$("#loginBtn").onclick=async()=>{const email=$("#authEmail").value.trim(),password=$("#authPassword").value;if(!email||!password)return $("#authMsg").textContent="Vul e-mail en wachtwoord in.";$("#authMsg").textContent="Inloggen…";const {error}=await sb.auth.signInWithPassword({email,password});$("#authMsg").textContent=error?error.message:"Gelukt."};
$("#signupBtn").onclick=async()=>{const email=$("#authEmail").value.trim(),password=$("#authPassword").value;if(!email||password.length<6)return $("#authMsg").textContent="Gebruik een geldig e-mailadres en minstens 6 tekens wachtwoord.";$("#authMsg").textContent="Account maken…";const {data,error}=await sb.auth.signUp({email,password});$("#authMsg").textContent=error?error.message:(data.session?"Account gemaakt.":"Account gemaakt. Controleer je e-mail als bevestiging gevraagd wordt.")};
$("#logoutBtn").onclick=async()=>{if(sb)await sb.auth.signOut();};

authInit();

// --- Import v3: Web Share Target, URL/text parsing and screenshot OCR ---
function setImportStatus(msg){const e=$("#importStatus");if(e)e.textContent=msg||"";}
function fillImportFromText(raw, sharedUrl=""){
  const original=(raw||"").replace(/\r/g,"");
  const t=original.trim(); if(!t && !sharedUrl)return;
  const foundUrl=sharedUrl || (t.match(/https?:\/\/[^\s<>]+/i)||[""])[0];
  const url=String(foundUrl||"").trim().replace(/[),.;]+$/,"");
  const clean=t.replace(url,"").trim();
  const ls=clean.split(/\n+/).map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
  const norm=x=>x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  const isIngHeading=x=>/\bingredient(?:en|s)?\b/i.test(norm(x));
  const isStepHeading=x=>/\b(bereiding|bereidingswijze|instructies|instructions|method|methode|werkwijze)\b/i.test(norm(x));
  const isNutrition=x=>/\b(voedingswaard|kcal|calorie|eiwit|koolhydr|vet per portie)\b/i.test(norm(x));
  const isSocial=x=>/\b(volgend|volgen|originele audio|repost|miljoen views|vind ik leuk|opmerking|delen|bewaar|facebook|instagram|tiktok|jasper slock|reageer hieronder|stuur ik jou|gratis training|persoonlijke doel)\b/i.test(norm(x));
  const ingredientRe=/^(?:[-•*–]\s*)?(?:\d+(?:[.,]\d+)?\s*(?:x|g|kg|mg|ml|cl|dl|l|el|tl|eetlepel|theelepel|st|stuk|stuks|teentje|teentjes|snuf(?:je)?|pak|blik|zak|bos|handvol|gram|liter|porties?)\b|\d+(?:[.,]\d+)?\s+\S+)/i;
  const sectionIng=ls.findIndex(x=>isIngHeading(x));
  const sectionStep=ls.findIndex(x=>isStepHeading(x));
  let ingredients=[];
  if(sectionIng>=0){
    const end=sectionStep>sectionIng?sectionStep:ls.length;
    ingredients=ls.slice(sectionIng+1,end)
      .map(x=>x.replace(/^[☑✅✓✔️\s]+/,"").trim())
      .filter(x=>ingredientRe.test(x) && !isNutrition(x) && !isSocial(x));
  }
  if(!ingredients.length) ingredients=ls.filter(x=>ingredientRe.test(x)&&!isNutrition(x)&&!isSocial(x)).slice(0,40);

  let steps=[];
  if(sectionStep>=0){
    steps=ls.slice(sectionStep+1)
      .filter(x=>/^(?:\d+[.)]\s*|[-•]\s*)/.test(x))
      .map(x=>x.replace(/^[☑✅✓✔️\s]+/,"").replace(/^\d+[.)]\s*/,"").trim())
      .filter(x=>x.length>3&&!isNutrition(x)&&!isSocial(x));
  }
  if(!steps.length && sectionStep>=0){
    steps=ls.slice(sectionStep+1).filter(x=>x.length>8&&!isNutrition(x)&&!isSocial(x)&&!ingredientRe.test(x));
  }

  const titleCandidates=ls.filter(x=>{
    const n=norm(x);
    return x.length>3 && x.length<70 && !/^https?:\/\//i.test(x) &&
      !isIngHeading(x) && !isStepHeading(x) && !ingredientRe.test(x) &&
      !isNutrition(x) && !isSocial(x) &&
      !/\b(porties|kcal|minuten|volg|delen|reageren|facebook|instagram)\b/i.test(n);
  });
  let title=titleCandidates.find(x=>/\b(pasta bake|pasta ovenschotel|lasagne|curry|soep|salade|cake|taart|brownies|wraps|taco|kip|gehakt|zalm|ovenschotel|pasta|brood|koekjes)\b/i.test(norm(x)));
  if(!title) title=titleCandidates[0]||"Nieuw recept";
  title=title.replace(/^[#•\s]+/,"").replace(/[☑✅✓✔️]/g,"").trim().slice(0,100);

  const servingsMatch=clean.match(/(\d+)\s*porties/i);
  const timeMatches=[...clean.matchAll(/\b(\d+)\s*(?:minuten|min)\b/gi)].map(m=>Number(m[1]));
  const time=timeMatches.length?Math.max(...timeMatches):0;
  const notes=[];
  if(!ingredients.length) notes.push("STATUS: Nog aan te vullen — controleer de ingrediënten.");
  if(!steps.length) notes.push("STATUS: Nog aan te vullen — controleer de bereidingswijze.");
  if($("#title")) $("#title").value=title;
  if($("#source")) $("#source").value=url;
  if($("#servings")) $("#servings").value=servingsMatch?Number(servingsMatch[1]):4;
  if($("#time")) $("#time").value=time;
  if($("#ingredients")) $("#ingredients").value=ingredients.join("\n");
  if($("#steps")) $("#steps").value=steps.map((x,i)=>`${i+1}. ${x}`).join("\n");
  if($("#notes") && notes.length) $("#notes").value=notes.join("\n");
  if($("#importText")) $("#importText").value=clean;
  setImportStatus(`Tekst verwerkt: ${ingredients.length} ingrediënten en ${steps.length} bereidingsstappen gevonden. Controleer alles en klik op ‘Recept bewaren’.`);
}
async function importRecipeUrl(url){
  if(!url) return;
  setImportStatus("Receptpagina wordt gelezen…");
  try{
    if(!sb || !currentUser) throw new Error("Log eerst in om een recept te importeren.");
    const {data,error}=await sb.functions.invoke("import-recipe",{body:{url}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);

    // Save the import as a real recipe card immediately, even if the platform
    // provides only a title/photo/link. Re-importing the same URL opens the
    // existing card instead of creating duplicates.
    const source = data.source || url;
    const existing = state.recipes.find(r => (r.source || "").split("?")[0] === source.split("?")[0]);
    const title = (data.title || "").trim() || "Recept van sociale media";
    const ingredients = Array.isArray(data.ingredients) ? data.ingredients.filter(Boolean) : [];
    const steps = Array.isArray(data.steps) ? data.steps.filter(Boolean) : [];
    let notes = String(data.notes || "").trim();
    if (!ingredients.length || !steps.length) {
      const reminder = "STATUS: Nog aan te vullen. Controleer de originele video/link en vul ontbrekende ingrediënten en bereidingswijze aan.";
      if (!notes.includes("STATUS: Nog aan te vullen")) notes = notes ? reminder + "\n\n" + notes : reminder;
    }
    const recipe = {
      id: existing?.id || crypto.randomUUID(),
      title,
      category: data.category || "Andere",
      servings: Number(data.servings) || 4,
      time: Number(data.time) || 0,
      source,
      image_url: data.image || existing?.image_url || "",
      ingredients: ingredients.length ? ingredients : (existing?.ingredients || []),
      steps: steps.length ? steps : (existing?.steps || []),
      notes: notes || existing?.notes || "",
      favorite: existing?.favorite || false,
      done: existing?.done || false
    };
    state.recipes = existing
      ? state.recipes.map(r => r.id === existing.id ? recipe : r)
      : [recipe, ...state.recipes];
    localSave();
    await saveAndSync();
    nav("home");
    renderHome();
    openDetail(recipe.id);
    setImportStatus((!ingredients.length || !steps.length)
      ? "De link is als receptkaart bewaard. Het recept moet nog worden aangevuld."
      : "Het recept is geïmporteerd en bewaard.");
    if (!ingredients.length || !steps.length) {
      alert("De link is nu als recept bewaard in je kookboek. Facebook/Instagram gaf niet alle receptgegevens vrij; vul de ontbrekende ingrediënten en bereiding aan via ‘Bewerken’.");
    }
  }catch(e){
    console.error(e);
    setImportStatus("Import mislukt: "+(e.message||e));
    alert("Import mislukt. "+(e.message||e));
  }
}
function handleSharedImport(){
  const p=new URLSearchParams(location.search); if(!p.has("shared"))return;
  const title=p.get("title")||""; const text=p.get("text")||""; const url=p.get("url")||"";
  history.replaceState({},"",location.pathname+location.hash);
  if(url){ importRecipeUrl(url); }
  else { nav("add"); fillImportFromText([title,text].filter(Boolean).join("\n")); }
}
const oldParseImport=$("#parseImport");
if(oldParseImport)oldParseImport.onclick=()=>fillImportFromText($("#importText").value);
const screenshotInput=$("#screenshotInput");
if(screenshotInput)screenshotInput.addEventListener("change",async()=>{
  const files=Array.from(screenshotInput.files||[]); if(!files.length)return;
  if(!window.Tesseract){setImportStatus("OCR kon niet worden geladen. Controleer je internetverbinding.");return;}
  const sourceMatch=($("#importText").value.match(/https?:\/\/[^\s<>]+/i)||[""])[0];
  const extracted=[];
  try{
    for(let i=0;i<files.length;i++){
      setImportStatus(`Screenshot ${i+1} van ${files.length} wordt gelezen… dit kan even duren.`);
      const {data}=await Tesseract.recognize(files[i],"nld+eng",{logger:m=>{
        if(m.status==="recognizing text")setImportStatus(`Screenshot ${i+1}/${files.length} lezen… ${Math.round((m.progress||0)*100)}%`);
      }});
      if(data?.text)extracted.push(data.text);
    }
    fillImportFromText(extracted.join("\n"),sourceMatch);
    setImportStatus(`${files.length} screenshot(s) gelezen. Controleer titel, ingrediënten en bereiding vóór je bewaart.`);
  }catch(e){console.error(e);setImportStatus("De screenshot(s) konden niet volledig worden gelezen. Probeer scherpere afbeeldingen.");}
  screenshotInput.value="";
});
window.addEventListener("load",()=>setTimeout(handleSharedImport,300));
