'use strict';
let products = [];
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageUrl=p=>p.image.startsWith('https://')?p.image:`assets/${p.image}`;
const iconPaths={all:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',tech:'<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="2" y="12" width="5" height="9" rx="2"/><rect x="17" y="12" width="5" height="9" rx="2"/>',fashion:'<path d="m8 3-6 4 3 5 3-2v11h8V10l3 2 3-5-6-4c0 4-8 4-8 0Z"/>',home:'<path d="m3 11 9-8 9 8M5 9v12h14V9M9 21v-8h6v8"/>',sale:'<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7" cy="7" r="1"/>',cart:'<path d="M3 3h2l3 12h11l2-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'};
const icon=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]}</svg>`;
const categories=[['All products','all'],['Mobiles','phone'],['Electronics','tech'],['Fashion','fashion'],['Home & Living','home'],['Best deals','sale']];
const state={category:'All products',query:'',sort:'featured',wishlist:false,cart:new Map(),saved:new Set()};
const $=(id)=>document.getElementById(id);
const money=(value)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
const discount=(p)=>Math.round((1-p.price/p.mrp)*100);
const productById=(id)=>products.find(p=>p.id===id);
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').classList.remove('show'),2400);}
function filteredProducts(){let list=products.filter(p=>(state.category==='All products'||state.category==='Best deals'||p.category===state.category)&&(!state.wishlist||state.saved.has(p.id))&&`${p.name} ${p.category}`.toLowerCase().includes(state.query.toLowerCase()));if(state.category==='Best deals')list=list.filter(p=>discount(p)>=35);if(state.sort==='low')list.sort((a,b)=>a.price-b.price);if(state.sort==='high')list.sort((a,b)=>b.price-a.price);if(state.sort==='rating')list.sort((a,b)=>b.rating-a.rating);return list;}
function render(){
  $('categories').innerHTML=categories.map(([name,key])=>`<button class="category ${state.category===name&&!state.wishlist?'active':''}" data-category="${name}" aria-pressed="${state.category===name&&!state.wishlist}">${icon(key)}${name}</button>`).join('');
  const list=filteredProducts();
  $('collection-title').textContent=state.wishlist?'Your wishlist':state.query?'Search results':state.category==='All products'?'Your next favourite is here':state.category;
  $('results-text').textContent=state.query?`${list.length} product${list.length===1?'':'s'} matching “${state.query}”`:state.wishlist?`${list.length} favourite${list.length===1?'':'s'} saved for later.`:state.category==='All products'?"A few things we think you'll love.":`${list.length} finds to explore.`;
  $('products').innerHTML=list.map(p=>`<article class="product"><div class="product-media"><button class="product-open" data-product="${escapeHtml(p.id)}" aria-label="View ${escapeHtml(p.name)}"><img src="${escapeHtml(imageUrl(p))}" alt="${escapeHtml(p.name)}" loading="lazy"></button><span class="tag">${escapeHtml(p.tag)}</span><button class="save ${state.saved.has(p.id)?'saved':''}" data-save="${escapeHtml(p.id)}" aria-label="${state.saved.has(p.id)?'Remove from':'Add to'} wishlist: ${escapeHtml(p.name)}" aria-pressed="${state.saved.has(p.id)}">${icon('heart')}</button></div><div class="product-body"><span class="product-category">${escapeHtml(p.category)}</span><button class="product-name" data-product="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button><div class="rating"><strong>${p.rating} ★</strong><span>(${p.reviews} sample ratings)</span></div><div class="prices"><span class="price">${money(p.price)}</span><span class="original">${money(p.mrp)}</span><span class="discount">${discount(p)}% off</span></div><button class="add" data-add="${escapeHtml(p.id)}">${icon('cart')} Add to cart</button></div></article>`).join('');
  $('empty').hidden=list.length>0;$('active-filter').hidden=!(state.query||state.wishlist||state.category!=='All products');$('active-filter').innerHTML='<button id="clear-filters">Clear filters ×</button>';
  $('cart-count').textContent=[...state.cart.values()].reduce((a,b)=>a+b,0);$('saved-count').textContent=state.saved.size;
  $('saved-button').setAttribute('aria-pressed',String(state.wishlist));
}
function chooseCategory(category){state.category=category;state.wishlist=false;state.query='';$('search').value='';render();}
function reset(){state.category='All products';state.query='';state.wishlist=false;$('search').value='';render();}
function addToCart(id){const p=productById(id);if(!p)throw new Error('Unknown product');const amount=state.cart.get(id)||0;if(amount>=10){toast('Maximum 10 of each product in this demo.');return false;}state.cart.set(id,amount+1);render();if($('cart-dialog').open)renderCart();toast(`${p.name} added to cart`);return true;}
function saveProduct(id){if(state.saved.has(id)){state.saved.delete(id);toast('Removed from wishlist');}else{state.saved.add(id);toast('Saved to wishlist');}render();}
function showProduct(id){const p=productById(id);if(!p)return;$('product-detail').innerHTML=`<div class="detail-grid"><img src="${escapeHtml(imageUrl(p))}" alt="${escapeHtml(p.name)}"><div><span class="eyebrow blue">${escapeHtml(p.category)}</span><h2>${escapeHtml(p.name)}</h2><div class="rating"><strong>${p.rating} ★</strong><span>Sample rating</span></div><div class="prices"><span class="price">${money(p.price)}</span><span class="original">${money(p.mrp)}</span><span class="discount">${discount(p)}% off</span></div><p>${escapeHtml(p.description)}</p><ul>${p.specs.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul><button class="primary" data-add="${escapeHtml(p.id)}">Add to cart</button><p class="demo-note">Sample listing. Photo, specifications, prices and ratings are illustrative.</p></div></div>`;$('product-dialog').showModal();}
function totals(){const subtotal=[...state.cart].reduce((sum,[id,q])=>sum+productById(id).price*q,0);const shipping=subtotal===0||subtotal>=999?0:49;return{subtotal,shipping,total:subtotal+shipping};}
function renderCart(){
  if(!state.cart.size){$('cart-content').innerHTML='<div class="empty"><h3>Your cart is waiting.</h3><p>Find something you love and add it here.</p><button class="primary" data-close="cart-dialog">Explore products</button></div>';return;}
  const t=totals();$('cart-content').innerHTML=[...state.cart].map(([id,q])=>{const p=productById(id);return `<div class="cart-row"><img src="${escapeHtml(imageUrl(p))}" alt="${escapeHtml(p.name)}"><div class="cart-info"><strong>${escapeHtml(p.name)}</strong><p>${money(p.price)}</p><button class="remove" data-remove="${id}">Remove</button></div><div class="quantity"><button data-quantity="${id}" data-change="-1" aria-label="Decrease ${escapeHtml(p.name)} quantity">−</button><span aria-label="Quantity">${q}</span><button data-quantity="${id}" data-change="1" aria-label="Increase ${escapeHtml(p.name)} quantity" ${q>=10?'disabled':''}>+</button></div></div>`;}).join('')+`<div class="totals"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div><span>Demo delivery</span><span>${t.shipping?money(t.shipping):'Free'}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div><button class="primary" id="start-checkout">Continue to demo checkout</button><p class="demo-note">Store preview · No real payment or delivery</p>`;
}
function startCheckout(){if(!state.cart.size)return;$('cart-dialog').close();$('checkout-form').hidden=false;$('checkout-success').hidden=true;$('checkout-form').reset();$('checkout-total').textContent=`Demo order total: ${money(totals().total)}`;$('checkout-dialog').showModal();}
document.addEventListener('click',(event)=>{const target=event.target.closest('button');if(!target)return;if(target.dataset.close)$(target.dataset.close).close();else if(target.dataset.category){chooseCategory(target.dataset.category);$('collection').scrollIntoView({behavior:'smooth'});}else if(target.dataset.product)showProduct(target.dataset.product);else if(target.dataset.add)addToCart(target.dataset.add);else if(target.dataset.save)saveProduct(target.dataset.save);else if(target.dataset.remove){state.cart.delete(target.dataset.remove);render();renderCart();}else if(target.dataset.quantity){const id=target.dataset.quantity;const q=(state.cart.get(id)||0)+Number(target.dataset.change);if(q<=0)state.cart.delete(id);else if(q<=10)state.cart.set(id,q);render();renderCart();}else if(target.id==='start-checkout')startCheckout();else if(target.id==='clear-filters')reset();});
$('cart-button').addEventListener('click',()=>{renderCart();$('cart-dialog').showModal();});
$('saved-button').addEventListener('click',()=>{state.wishlist=!state.wishlist;state.category='All products';state.query='';$('search').value='';render();$('collection').scrollIntoView({behavior:'smooth'});});
$('search-form').addEventListener('submit',event=>{event.preventDefault();state.query=$('search').value.trim();state.wishlist=false;state.category='All products';render();$('collection').scrollIntoView({behavior:'smooth'});});
$('search').addEventListener('input',()=>{state.query=$('search').value.trim();state.wishlist=false;render();});
$('sort').addEventListener('change',event=>{state.sort=event.target.value;render();});
$('reset').addEventListener('click',reset);
$('shop-deals').addEventListener('click',()=>{chooseCategory('Best deals');$('collection').scrollIntoView({behavior:'smooth'});});
$('shop-home').addEventListener('click',()=>{chooseCategory('Home & Living');$('collection').scrollIntoView({behavior:'smooth'});});
$('checkout-form').addEventListener('submit',event=>{event.preventDefault();if(!state.cart.size)return;state.cart.clear();render();$('checkout-form').reset();$('checkout-form').hidden=true;document.querySelector('.checkout-intro').hidden=true;$('checkout-success').hidden=false;});
$('checkout-dialog').addEventListener('close',()=>{document.querySelector('.checkout-intro').hidden=false;});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
$('year').textContent=new Date().getFullYear();
async function loadProducts(){
  $('results-text').textContent='Loading products…';
  try{
    const response=await fetch(location.protocol==='file:'?'catalog.json':'/api/products',{cache:'no-store'});
    if(!response.ok)throw new Error('Catalog unavailable');
    const data=await response.json();products=(Array.isArray(data)?data:data.products).filter(p=>p.active!==false);
    render();
  }catch{
    $('results-text').textContent='Products could not be loaded. Please refresh to try again.';
    $('empty').hidden=true;
  }
}
loadProducts();
// The browser interface and agent tools share the same catalog and cart actions.
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  const tool={name:'add_products_to_cart',title:'Add products to Leo Shopping cart',description:'Stage sample products in the shopping cart. Does not place an order or make a payment.',inputSchema:{type:'object',properties:{productIds:{type:'array',items:{type:'string'},minItems:1,maxItems:10}},required:['productIds'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Array.isArray(input.productIds)||input.productIds.length<1||input.productIds.length>10||input.productIds.some(id=>typeof id!=='string'||!productById(id)))throw new Error('Provide 1 to 10 valid product IDs.');const additions=new Map();for(const id of input.productIds)additions.set(id,(additions.get(id)||0)+1);for(const[id,amount]of additions)if((state.cart.get(id)||0)+amount>10)throw new Error('Maximum 10 of each product.');for(const id of input.productIds)addToCart(id);return{cart:[...state.cart].map(([id,quantity])=>({id,quantity})),total:totals().total,currency:'INR',orderPlaced:false};}};
  try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}catch{}
}
