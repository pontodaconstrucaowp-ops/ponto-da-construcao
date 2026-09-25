const SUPABASE_URL = 'https://ifcdfydbkrpdcbtiqysc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_InDtslnIkU5kvL0-OtzH7g_51jxEKwh';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

const state={
  page:'home',
  user:null,
  cart:[],
  products:[
    {id:1,name:'Cimento Poty',unit:'saco',price:42.00,stock:120},
    {id:2,name:'Areia',unit:'m³',price:160.00,stock:18},
    {id:3,name:'Seixo',unit:'m³',price:190.00,stock:11},
    {id:4,name:'Tijolo',unit:'milheiro',price:850.00,stock:7},
    {id:5,name:'Madeira',unit:'unidade',price:35.00,stock:95}
  ],
  clients:[
    {id:1,name:'Cliente de demonstração',phone:'(91) 99999-9999',city:'Marituba'}
  ],
  deliveries:[
    {id:1,client:'Cliente de demonstração',address:'Endereço de demonstração',value:1250,priority:'urgente',status:'pending'},
    {id:2,client:'Obra Centro',address:'Rua Principal, 100',value:680,priority:'alta',status:'route'}
  ]
};

async function login(){
  const user=document.getElementById('loginUser').value.trim();
  const pass=document.getElementById('loginPass').value.trim();

  if(!user||!pass){
    alert('Informe e-mail e senha.');
    return;
  }

  const {data,error}=await supabaseClient.auth.signInWithPassword({
    email:user,
    password:pass
  });

  if(error){
    alert('E-mail ou senha incorretos.');
    return;
  }

  const {data:usuario,error:usuarioError}=await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('id',data.user.id)
    .single();

  if(usuarioError||!usuario){
    await supabaseClient.auth.signOut();
    alert('Usuário não cadastrado no sistema.');
    return;
  }

  if(!usuario.ativo){
    await supabaseClient.auth.signOut();
    alert('Este usuário está inativo.');
    return;
  }

  state.user=usuario;

  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('loggedUser').textContent=usuario.nome;

  if(usuario.tipo==='entregador'){
    navigate('deliveries');
  }else{
    navigate('home');
  }
}
function logout(){
  state.user=null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}
function toggleUserMenu(){document.getElementById('userMenu').classList.toggle('hidden')}
function navigate(page){
  if(state.user && state.user.tipo === 'entregador'){
  const permitidas = ['deliveries'];

  if(!permitidas.includes(page)){
    page = 'deliveries';
  }
}
  state.page=page;
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  const titles={home:'Início',sales:'Nova venda',products:'Estoque',deliveries:'Entregas',more:'Mais opções',clients:'Clientes',cash:'Caixa',reports:'Relatórios',settings:'Configurações'};
  document.getElementById('pageTitle').textContent=titles[page]||'Ponto da Construção';
  const content=document.getElementById('content');
  if(page==='home') renderHome(content);
  else if(page==='sales') renderSales(content);
  else if(page==='products') renderProducts(content);
  else if(page==='deliveries') renderDeliveries(content);
  else if(page==='more') renderMore(content);
  else if(page==='clients') renderClients(content);
  else if(page==='cash') renderCash(content);
  else if(page==='reports') renderReports(content);
  else if(page==='settings') renderSettings(content);
  window.scrollTo({top:0,behavior:'smooth'});
}
function money(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function renderHome(el){
  el.innerHTML=`
    <div class="grid stats">
      <div class="card stat"><div class="label">Vendas hoje</div><div class="value">${money(3250)}</div></div>
      <div class="card stat"><div class="label">Receber</div><div class="value">${money(1840)}</div></div>
      <div class="card stat"><div class="label">Entregas hoje</div><div class="value">${state.deliveries.length}</div></div>
      <div class="card stat"><div class="label">Estoque baixo</div><div class="value">${state.products.filter(p=>p.stock<10).length}</div></div>
    </div>
    <div class="section-title"><h2>Ações rápidas</h2></div>
    <div class="grid quick">
      <button onclick="navigate('sales')"><strong>＋ Nova venda</strong><span class="muted">Registrar um pedido</span></button>
      <button onclick="navigate('clients')"><strong>👤 Clientes</strong><span class="muted">Cadastrar e consultar</span></button>
      <button onclick="navigate('deliveries')"><strong>⇢ Entregas</strong><span class="muted">Organizar a fila</span></button>
      <button onclick="navigate('products')"><strong>▦ Estoque</strong><span class="muted">Produtos e preços</span></button>
    </div>
    <div class="section-title"><h2>Próximas entregas</h2><button class="secondary" onclick="navigate('deliveries')">Ver todas</button></div>
    <div class="list">${state.deliveries.slice(0,3).map(deliveryCard).join('')}</div>
  `;
}
function deliveryCard(d){
  return `<div class="card"><div class="row"><strong>#${d.id} · ${d.client}</strong><span class="badge ${d.priority}">${d.priority}</span></div><p class="muted">${d.address}</p><div class="row"><span>${money(d.value)}</span><span class="badge ${d.status}">${statusName(d.status)}</span></div></div>`
}
function statusName(s){return s==='pending'?'Pendente':s==='route'?'Em rota':'Entregue'}
function renderSales(el){
  el.innerHTML=`
    <div class="card">
      <div class="section-title"><h2>Cliente</h2><button class="secondary" onclick="navigate('clients')">Cadastrar</button></div>
      <div class="field"><label>Buscar cliente</label><input id="saleClient" class="search" placeholder="Nome ou telefone"></div>
    </div>
    <div class="section-title"><h2>Materiais</h2></div>
    <div class="list">${state.products.map(p=>`
      <div class="card">
        <div class="row"><div><div class="product-name">${p.name}</div><span class="muted">${p.unit} · estoque ${p.stock}</span></div><div class="price">${money(p.price)}</div></div>
        <div class="actions">
          <button class="secondary" onclick="addToCart(${p.id})">Adicionar</button>
        </div>
      </div>`).join('')}</div>
    <div class="sale-cart">
      <div class="row"><strong>Carrinho</strong><span>${state.cart.length} item(ns)</span></div>
      <div id="cartItems">${state.cart.length?state.cart.map((x,i)=>`<div class="row" style="margin-top:10px"><span>${x.name} × ${x.qty}</span><span>${money(x.price*x.qty)}</span></div>`).join(''):'<p class="muted">Nenhum produto adicionado.</p>'}</div>
      <hr>
      <div class="row"><span>Total</span><span class="total">${money(state.cart.reduce((s,x)=>s+x.price*x.qty,0))}</span></div>
      <div class="actions"><button class="primary" onclick="finishSale()">Finalizar venda</button><button class="danger" onclick="state.cart=[];renderSales(document.getElementById('content'))">Limpar</button></div>
    </div>
  `;
}
function addToCart(id){
  const p=state.products.find(x=>x.id===id);
  const found=state.cart.find(x=>x.id===id);
  if(found) found.qty++;
  else state.cart.push({...p,qty:1});
  renderSales(document.getElementById('content'));
}
function finishSale(){
  if(!state.cart.length){alert('Adicione pelo menos um produto.');return}
  alert('Venda registrada na versão de demonstração. Na próxima etapa vamos salvar no Supabase.');
  state.cart=[];
  navigate('home');
}
function renderProducts(el){
  el.innerHTML=`
    <div class="row" style="margin-bottom:12px"><input class="search" id="productSearch" oninput="filterProducts()" placeholder="Buscar material..."><button class="primary" onclick="alert('Cadastro de produto será conectado ao banco na próxima etapa.')">+ Produto</button></div>
    <div id="productList" class="list">${productRows(state.products)}</div>`;
}
function productRows(items){
 return items.map(p=>`<div class="card"><div class="row"><div><div class="product-name">${p.name}</div><span class="muted">${p.unit} · estoque ${p.stock}</span></div><strong class="price">${money(p.price)}</strong></div><div class="actions"><button class="secondary" onclick="alert('Edição de produto será conectada ao banco.')">Editar</button></div></div>`).join('')
}
function filterProducts(){
 const q=document.getElementById('productSearch').value.toLowerCase();
 document.getElementById('productList').innerHTML=productRows(state.products.filter(p=>p.name.toLowerCase().includes(q)));
}
function renderDeliveries(el){
  el.innerHTML=`
    <div class="card"><strong>Fila de entregas</strong><p class="muted">Prioridade e ordem poderão ser alteradas pelo administrador.</p></div>
    <div class="list" style="margin-top:12px">${state.deliveries.map((d,i)=>`
      <div class="card">
        <div class="row"><strong>#${d.id} · ${d.client}</strong><span class="badge ${d.priority}">${d.priority}</span></div>
        <p class="muted">${d.address}</p>
        <div class="row"><span>${money(d.value)}</span><span class="badge ${d.status}">${statusName(d.status)}</span></div>
        <div class="actions">
          ${i>0?`<button class="secondary" onclick="moveDelivery(${i},-1)">↑ Colocar na frente</button>`:''}
          ${i<state.deliveries.length-1?`<button class="secondary" onclick="moveDelivery(${i},1)">↓</button>`:''}
          ${d.status!=='done'?`<button class="primary" onclick="nextDelivery(${d.id})">${d.status==='pending'?'Iniciar rota':'Marcar entregue'}</button>`:''}
        </div>
      </div>`).join('')}</div>`;
}
function moveDelivery(i,dir){
 const j=i+dir;
 [state.deliveries[i],state.deliveries[j]]=[state.deliveries[j],state.deliveries[i]];
 renderDeliveries(document.getElementById('content'));
}
function nextDelivery(id){
 const d=state.deliveries.find(x=>x.id===id);
 d.status=d.status==='pending'?'route':'done';
 renderDeliveries(document.getElementById('content'));
}
function renderMore(el){
 el.innerHTML=`<div class="list">
 <button class="card" onclick="navigate('clients')"><strong>Clientes</strong><span class="muted">Cadastro e histórico</span></button>
 <button class="card" onclick="navigate('cash')"><strong>Caixa / Financeiro</strong><span class="muted">Entradas, saídas e saldo</span></button>
 <button class="card" onclick="navigate('reports')"><strong>Relatórios</strong><span class="muted">Resumo de vendas e operação</span></button>
 <button class="card" onclick="navigate('settings')"><strong>Configurações</strong><span class="muted">Usuários e preferências</span></button>
 </div>`;
}
function openClientForm(){
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h2>Novo cliente</h2>
      </div>

      <div style="display:grid;gap:12px">
        <input id="clientName" class="search" placeholder="Nome do cliente">

        <input id="clientPhone" class="search" placeholder="Telefone">

        <textarea id="clientAddress" class="search" placeholder="Endereço" rows="3"></textarea>

        <div class="row">
          <button class="secondary" onclick="navigate('clients')">
            Cancelar
          </button>

          <button class="primary" onclick="saveClient()">
            Salvar cliente
          </button>
        </div>
      </div>
    </div>
  `;
}
async function renderClients(el){
  el.innerHTML = `
    <div class="row" style="margin-bottom:12px">
      <input id="clientSearch" class="search" placeholder="Buscar cliente...">
      <button class="primary" onclick="openClientForm()">+ Cliente</button>
    </div>

    <div id="clientsList" class="list">
      <div class="card muted">Carregando clientes...</div>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });

  const list = document.getElementById('clientsList');

  if(error){
    list.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar clientes</strong>
        <p class="muted">${error.message}</p>
      </div>
    `;
    return;
  }

  if(!data || data.length === 0){
    list.innerHTML = `
      <div class="card">
        <strong>Nenhum cliente cadastrado</strong>
        <p class="muted">Clique em "+ Cliente" para cadastrar.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = data.map(c => `
    <div class="card">
      <div class="product-name">${c.nome || 'Sem nome'}</div>
      <div class="muted">${c.telefone || 'Sem telefone'}</div>
      <div class="muted">${c.endereço || 'Sem endereço'}</div>
    </div>
  `).join('');
}
