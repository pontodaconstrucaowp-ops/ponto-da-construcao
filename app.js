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
  selectedClient:null,
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
async function renderSales(el){

  el.innerHTML=`
    <div class="card">
      <div class="section-title">
        <h2>Cliente</h2>
      </div>

      <div class="field">
        <label>Buscar cliente</label>
        <input
          id="saleClient"
          class="search"
          placeholder="Digite nome ou telefone..."
          oninput="searchSaleClients()"
        >
      </div>

      <div id="saleClientResults" style="margin-top:10px">
        <p class="muted">Digite o nome ou telefone do cliente.</p>
      </div>
    </div>

    <div class="section-title">
      <h2>Materiais</h2>
    </div>

    <div id="saleProducts" class="list">
      <div class="card muted">
        Carregando materiais...
      </div>
    </div>

    <div class="sale-cart">
      <div class="row">
        <strong>Carrinho</strong>
        <span>${state.cart.length} item(ns)</span>
      </div>

      <div id="cartItems">
        ${
          state.cart.length
state.cart.map(x=>{

  const isM3 =
    String(x.unit || '')
      .toLowerCase()
      .trim() === 'm³';

  return `
    <div
      class="row"
      style="
        margin-top:10px;
        align-items:center;
        gap:10px;
      "
    >

      <div style="flex:1">

        <strong>${x.name}</strong>

        <div class="muted">
          ${x.qty} ${x.unit}
        </div>

      </div>

      <div
        style="
          display:flex;
          align-items:center;
          gap:6px;
        "
      >

        <button
          class="secondary"
          onclick="changeCartQty(${x.id},-1)"
        >
          −
        </button>

        <strong style="min-width:40px;text-align:center">
          ${x.qty}
        </strong>

        <button
          class="secondary"
          onclick="changeCartQty(${x.id},1)"
        >
          +
        </button>

      </div>

      <strong>
        ${money(x.price*x.qty)}
      </strong>

    </div>
  `;
}).join('')
          : '<p class="muted">Nenhum produto adicionado.</p>'
        }
      </div>

      <hr>

      <div class="row">
        <span>Total</span>
        <span class="total">
          ${money(
            state.cart.reduce(
              (s,x)=>s+x.price*x.qty,
              0
            )
          )}
        </span>
      </div>

      <div class="actions">

        <button
          class="primary"
          onclick="finishSale()"
        >
          Continuar
        </button>

        <button
          class="danger"
          onclick="state.cart=[];renderSales(document.getElementById('content'))"
        >
          Limpar
        </button>

      </div>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('produtos')
    .select('*')
    .order('nome', { ascending: true });

  const productsList = document.getElementById('saleProducts');

  if(error){

    console.error(
      'ERRO AO CARREGAR PRODUTOS PARA VENDA:',
      error
    );

    productsList.innerHTML=`
      <div class="card">
        <strong>Erro ao carregar materiais</strong>
        <p class="muted">
          ${error.message}
        </p>
      </div>
    `;

    return;
  }

  if(!data || data.length === 0){

    productsList.innerHTML=`
      <div class="card">
        <strong>Nenhum material cadastrado</strong>
        <p class="muted">
          Cadastre produtos no Estoque antes de realizar uma venda.
        </p>
      </div>
    `;

    return;
  }

  window.saleProducts = data;

  productsList.innerHTML = data.map(p=>`

    <div class="card">

      <div class="row">

        <div>

          <div class="product-name">
            ${p.nome}
          </div>

          <span class="muted">
            ${p.unidade} · estoque ${p.estoque}
          </span>

        </div>

        <div class="price">
          ${money(p.preco)}
        </div>

      </div>

      <div class="actions">

        <button
          class="secondary"
          onclick="addToCart(${p.id})"
          ${Number(p.estoque) <= 0 ? 'disabled' : ''}
        >
          ${Number(p.estoque) <= 0 ? 'Sem estoque' : 'Adicionar'}
        </button>

      </div>

    </div>

  `).join('');
}
function openSaleNewClientForm(){
  const results = document.getElementById('saleClientResults');

  if(!results) return;

  results.innerHTML = `
    <div class="card">
      <div class="section-title">
        <h3>Novo cliente</h3>
      </div>

      <div style="display:grid;gap:12px">

        <input
          id="newSaleClientName"
          class="search"
          placeholder="Nome do cliente"
        >

        <input
          id="newSaleClientPhone"
          class="search"
          placeholder="Telefone"
        >

        <textarea
          id="newSaleClientAddress"
          class="search"
          placeholder="Endereço"
          rows="3"
        ></textarea>

        <div class="row">
          <button
            class="secondary"
            onclick="clearSaleClient()"
          >
            Voltar
          </button>

          <button
            class="primary"
            onclick="saveSaleNewClient()"
          >
            Salvar e continuar
          </button>
        </div>

      </div>
    </div>
  `;
}

async function saveSaleNewClient(){
  const { data: { user } } = await supabaseClient.auth.getUser();
  console.log('USUARIO AUTENTICADO:', user);
  
const { data: adminCheck, error: adminCheckError } =
  await supabaseClient.rpc('usuario_e_admin', {
    uid: user.id
  });

  console.log('USUARIO É ADMIN:', adminCheck);
  console.log('ERRO AO VERIFICAR ADMIN:', adminCheckError);
  
  const nome = document.getElementById('newSaleClientName').value.trim();
  const telefone = document.getElementById('newSaleClientPhone').value.trim();
  const endereco = document.getElementById('newSaleClientAddress').value.trim();

  if(!nome){
    alert('Informe o nome do cliente.');
    return;
  }

  if(!telefone){
    alert('Informe o telefone do cliente.');
    return;
  }

  if(!endereco){
    alert('Informe o endereço do cliente.');
    return;
  }

  const { data, error } = await supabaseClient
    .from('clientes')
    .insert({
      nome: nome,
      telefone: telefone,
      endereço: endereco
    })
    .select('id,nome,telefone,endereço')
    .single();

  if(error){
    alert('Não foi possível cadastrar o cliente: ' + error.message);
    return;
  }

  state.selectedClient = data.id;

  const input = document.getElementById('saleClient');

  if(input){
    input.value = data.nome;
    input.disabled = true;
  }

  const results = document.getElementById('saleClientResults');

  if(results){
    results.innerHTML = `
      <div class="card">
        <div class="product-name">${data.nome}</div>

        <div class="muted">
          ${data.telefone}
        </div>

        <div class="muted">
          ${data.endereço}
        </div>

        <div class="badge done" style="margin-top:10px">
          Cliente cadastrado
        </div>

        <button
          class="secondary"
          style="margin-top:10px"
          onclick="clearSaleClient()"
        >
          Trocar cliente
        </button>
      </div>
    `;
  }
}
async function searchSaleClients(){
  const input = document.getElementById('saleClient');
  const results = document.getElementById('saleClientResults');

  if(!input || !results) return;

  const busca = input.value.trim();

  if(busca.length < 2){
    results.innerHTML = `
      <p class="muted">Digite pelo menos 2 caracteres.</p>
    `;
    return;
  }

  results.innerHTML = `
    <div class="card muted">Buscando clientes...</div>
  `;

  const { data, error } = await supabaseClient
    .from('clientes')
    .select('id,nome,telefone,endereço')
    .or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`)
    .order('nome', { ascending: true })
    .limit(10);

  if(error){
    results.innerHTML = `
      <div class="card">
        <strong>Erro ao buscar cliente</strong>
        <p class="muted">${error.message}</p>
      </div>
    `;
    return;
  }

 
  if(!data || data.length === 0){
    results.innerHTML = `
      <div class="card">
        <p class="muted">Nenhum cliente encontrado.</p>

        <button class="primary" onclick="openSaleNewClientForm()">
          + Novo cliente
        </button>
      </div>
    `;
    return;
  }

  results.innerHTML = data.map(c => `
    <div class="card">
      <div class="product-name">${c.nome || 'Sem nome'}</div>

      <div class="muted">
        ${c.telefone || 'Sem telefone'}
      </div>

      <div class="muted">
        ${c.endereço || 'Sem endereço'}
      </div>

      <div class="actions">
        <button class="primary" onclick="selectSaleClient('${c.id}')">
          Selecionar
        </button>
      </div>
    </div>
  `).join('');
}

function selectSaleClient(id){
  const input = document.getElementById('saleClient');

  state.selectedClient = id;

  if(input){
    input.disabled = true;
  }

  const results = document.getElementById('saleClientResults');

  if(results){
    results.innerHTML = `
      <div class="card">
        <strong>Cliente selecionado</strong>

        <button
          class="secondary"
          style="margin-top:10px"
          onclick="clearSaleClient()"
        >
          Trocar cliente
        </button>
      </div>
    `;
  }
}

function clearSaleClient(){
  state.selectedClient = null;

  const input = document.getElementById('saleClient');

  if(input){
    input.disabled = false;
    input.value = '';
    input.focus();
  }

  const results = document.getElementById('saleClientResults');

  if(results){
    results.innerHTML = `
      <p class="muted">Digite o nome ou telefone do cliente.</p>
    `;
  }
}

function addToCart(id){

  const p = (window.saleProducts || []).find(
    x => x.id === id
  );

  if(!p){
    alert('Produto não encontrado.');
    return;
  }

  if(Number(p.estoque) <= 0){
    alert('Este produto está sem estoque.');
    return;
  }

  const found = state.cart.find(
    x => x.id === id
  );

  if(found){

    if(found.qty >= Number(p.estoque)){
      alert('Quantidade maior que o estoque disponível.');
      return;
    }

    found.qty++;

  }else{

    state.cart.push({
      id: p.id,
      name: p.nome,
      unit: p.unidade,
      price: Number(p.preco),
      stock: Number(p.estoque),
      qty: 1
    });

  }

  renderSales(
    document.getElementById('content')
  );
}
function changeCartQty(id, delta){

  const item = state.cart.find(
    x => x.id === id
  );

  if(!item){
    return;
  }

  const isM3 =
    String(item.unit || '')
      .toLowerCase()
      .trim() === 'm³';

  const step = isM3 ? 0.5 : 1;
  const novaQuantidade =
    Math.round((item.qty + delta * step) * 100) / 100;

  if(novaQuantidade < step){
    state.cart = state.cart.filter(
      x => x.id !== id
    );
  }
  else if(novaQuantidade > item.stock){

    alert(
      'Quantidade maior que o estoque disponível.'
    );

    return;
  }
  else{

    item.qty = novaQuantidade;
  }

  renderSales(
    document.getElementById('content')
  );
}
async function finishSale(){

  if(!state.selectedClient){
    alert('Selecione um cliente antes de continuar.');
    return;
  }

  if(!state.cart.length){
    alert('Adicione pelo menos um produto.');
    return;
  }

  const total = state.cart.reduce(
    (s,x) => s + (x.price * x.qty),
    0
  );

  const content = document.getElementById('content');

  content.innerHTML = `

    <div class="card">

      <div class="section-title">
        <h2>Finalizar venda</h2>
      </div>

      <p class="muted">
        Total da venda
      </p>

      <div class="total" style="font-size:28px;margin-bottom:24px">
        ${money(total)}
      </div>

      <div class="section-title">
        <h3>Forma de pagamento</h3>
      </div>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:10px;
          margin-bottom:24px;
        "
      >

        <button
          class="secondary"
          onclick="selectPayment('dinheiro')"
        >
          💵 Dinheiro
        </button>

        <button
          class="secondary"
          onclick="selectPayment('pix')"
        >
          📱 PIX
        </button>

        <button
          class="secondary"
          onclick="selectPayment('cartão')"
        >
          💳 Cartão
        </button>

        <button
          class="secondary"
          onclick="selectPayment('prazo')"
        >
          📋 Prazo
        </button>

      </div>

      <div
        id="selectedPayment"
        class="muted"
        style="margin-bottom:24px"
      >
        Nenhuma forma de pagamento selecionada.
      </div>

      <div class="section-title">
        <h3>Tipo de atendimento</h3>
      </div>

      <div
        style="
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:10px;
        "
      >

        <button
          class="secondary"
          onclick="selectSaleType('entrega')"
        >
          🚚 Entrega
        </button>

        <button
          class="secondary"
          onclick="selectSaleType('retirada')"
        >
          🏪 Retirada
        </button>

      </div>

      <div
        id="selectedSaleType"
        class="muted"
        style="margin-top:12px"
      >
        Nenhum tipo de atendimento selecionado.
      </div>

      <div
        class="actions"
        style="margin-top:24px"
      >

        <button
          class="secondary"
          onclick="renderSales(document.getElementById('content'))"
        >
          Voltar
        </button>

        <button
          id="confirmSaleButton"
          class="primary"
          onclick="confirmSale()"
          disabled
        >
          Confirmar venda
        </button>

      </div>

    </div>

  `;

  window.salePayment = null;
  window.saleType = null;
}
function selectPayment(payment){

  window.salePayment = payment;

  const el = document.getElementById('selectedPayment');

  if(el){
    el.innerHTML =
      'Pagamento selecionado: <strong>' +
      payment.charAt(0).toUpperCase() +
      payment.slice(1) +
      '</strong>';
  }

  updateConfirmSaleButton();
}


function selectSaleType(type){

  window.saleType = type;

  const el = document.getElementById('selectedSaleType');

  if(el){
    el.innerHTML =
      'Atendimento selecionado: <strong>' +
      (type === 'entrega'
        ? '🚚 Entrega'
        : '🏪 Retirada') +
      '</strong>';
  }

  updateConfirmSaleButton();
}


function updateConfirmSaleButton(){

  const button =
    document.getElementById('confirmSaleButton');

  if(!button){
    return;
  }

  button.disabled =
    !window.salePayment ||
    !window.saleType;
}
async function confirmSale(){

  if(!window.salePayment){
    alert('Selecione a forma de pagamento.');
    return;
  }

  if(!window.saleType){
    alert('Selecione entrega ou retirada.');
    return;
  }

  const total = state.cart.reduce(
    (s,x) => s + (x.price * x.qty),
    0
  );

  const itens = state.cart.map(item => ({
    produtos_id: item.id,
    quantidade: item.qty,
    preco_unitario: item.price
  }));

  const { data: vendaId, error } =
    await supabaseClient.rpc('registrar_venda', {
      p_cliente_id: state.selectedClient,
      p_valor_total: total,
      p_forma_pagamento: window.salePayment,
      p_itens: itens
    });

  if(error){

    console.error(
      'ERRO AO REGISTRAR VENDA:',
      error
    );

    alert(
      'Não foi possível registrar a venda:\n\n' +
      error.message
    );

    return;
  }

  console.log(
    'VENDA REGISTRADA:',
    vendaId
  );

  if(window.saleType === 'entrega'){

    const { data: ultimaEntrega, error: filaError } =
      await supabaseClient
        .from('entregas')
        .select('posicao_fila')
        .neq('status', 'entregue')
        .order('posicao_fila', { ascending: false })
        .limit(1);

    if(filaError){

      console.error(
        'ERRO AO VERIFICAR FILA:',
        filaError
      );

      alert(
        'A venda foi registrada, mas não foi possível verificar a fila de entregas:\n\n' +
        filaError.message
      );

      return;
    }

    const ultimaPosicao =
      ultimaEntrega && ultimaEntrega.length
        ? Number(ultimaEntrega[0].posicao_fila || 0)
        : 0;

    const novaPosicao = ultimaPosicao + 1;

    const { error: entregaError } =
      await supabaseClient
        .from('entregas')
        .insert({
          venda_id: vendaId,
          prioridade: false,
          posicao_fila: novaPosicao,
          status: 'pendente'
        });

    if(entregaError){

      console.error(
        'ERRO AO CRIAR ENTREGA:',
        entregaError
      );

      alert(
        'A venda foi registrada, mas não foi possível criar a entrega:\n\n' +
        entregaError.message
      );

      return;
    }
  }

  alert(
    window.saleType === 'entrega'
      ? 'Venda registrada e entrega adicionada à fila!'
      : 'Venda registrada como retirada no local!'
  );

  state.cart = [];
  state.selectedClient = null;

  window.salePayment = null;
  window.saleType = null;

  navigate('home');
}
async function renderProducts(el){

  el.innerHTML = `
    <div class="row" style="margin-bottom:12px">
      <input
        class="search"
        id="productSearch"
        oninput="filterProducts()"
        placeholder="Buscar material..."
      >

      <button
        class="primary"
        onclick="openProductForm()"
      >
        + Produto
      </button>
    </div>

    <div id="productList" class="list">
      <div class="card muted">
        Carregando estoque...
      </div>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('produtos')
    .select('*')
    .order('id', { ascending: true });

  const list = document.getElementById('productList');

  if(error){
    console.error(error);

    list.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar estoque</strong>
        <p class="muted">${error.message}</p>
      </div>
    `;

    return;
  }

  if(!data || data.length === 0){
    list.innerHTML = `
      <div class="card">
        <strong>Nenhum produto cadastrado</strong>
        <p class="muted">
          Clique em "+ Produto" para cadastrar.
        </p>
      </div>
    `;

    return;
  }

window.currentProducts = data;
list.innerHTML = productRows(data);
}


function openProductForm(){

  const list = document.getElementById('productList');

  list.innerHTML = `
    <div class="card">

      <div class="section-title">
        <h2>Novo produto</h2>
      </div>

      <div style="display:grid;gap:12px">

        <input
          id="newProductName"
          class="search"
          placeholder="Nome do produto"
        >

        <input
          id="newProductCategory"
          class="search"
          placeholder="Categoria"
        >

        <input
          id="newProductUnit"
          class="search"
          placeholder="Unidade (ex.: saco, m³, unidade)"
        >

        <input
          id="newProductPrice"
          class="search"
          type="number"
          step="0.01"
          placeholder="Preço"
        >

        <input
          id="newProductStock"
          class="search"
          type="number"
          step="0.01"
          placeholder="Estoque inicial"
        >

        <input
          id="newProductMinStock"
          class="search"
          type="number"
          step="0.01"
          placeholder="Estoque mínimo"
        >

        <div class="row">

          <button
            class="secondary"
            onclick="renderProducts(document.getElementById('content'))"
          >
            Cancelar
          </button>

          <button
            class="primary"
            onclick="saveNewProduct()"
          >
            Salvar produto
          </button>

        </div>

      </div>

    </div>
  `;
}


async function saveNewProduct(){

  const nome = document.getElementById('newProductName').value.trim();
  const categoria = document.getElementById('newProductCategory').value.trim();
  const unidade = document.getElementById('newProductUnit').value.trim();

  const preco = Number(
    document.getElementById('newProductPrice').value
  );

  const estoque = Number(
    document.getElementById('newProductStock').value
  );

  const estoque_minimo = Number(
    document.getElementById('newProductMinStock').value
  );


  if(!nome){
    alert('Informe o nome do produto.');
    return;
  }

  if(!categoria){
    alert('Informe a categoria do produto.');
    return;
  }

  if(!unidade){
    alert('Informe a unidade do produto.');
    return;
  }

  if(isNaN(preco) || preco < 0){
    alert('Informe um preço válido.');
    return;
  }

  if(isNaN(estoque) || estoque < 0){
    alert('Informe um estoque válido.');
    return;
  }

  if(isNaN(estoque_minimo) || estoque_minimo < 0){
    alert('Informe um estoque mínimo válido.');
    return;
  }


  const { data, error } = await supabaseClient
    .from('produtos')
    .insert({
      nome: nome,
      categoria: categoria,
      unidade: unidade,
      preco: preco,
      estoque: estoque,
      estoque_minimo: estoque_minimo
    })
    .select()
    .single();


  if(error){

    console.error('ERRO AO CADASTRAR PRODUTO:', error);

    alert(
      'Não foi possível cadastrar o produto:\n\n' +
      error.message
    );

    return;
  }


  console.log('PRODUTO CADASTRADO:', data);

  alert('Produto cadastrado com sucesso!');

  renderProducts(
    document.getElementById('content')
  );
}

function productRows(items){
  return items.map(p => `
    <div class="card">
      <div class="row">
        <div>
          <div class="product-name">${p.nome}</div>

          <span class="muted">
            ${p.unidade} · estoque ${p.estoque}
          </span>
        </div>

        <strong class="price">
          ${money(p.preco)}
        </strong>
      </div>

     <div class="actions">

  <button
    class="secondary"
    onclick="openProductEdit(${p.id})"
  >
    Editar
  </button>

  <button
    class="danger"
    onclick="deleteProduct(${p.id})"
  >
    Excluir
  </button>

</div>
    </div>
  `).join('');
}
function openProductEdit(id){

  const produto = window.currentProducts.find(
    p => p.id === id
  );

  if(!produto){
    alert('Produto não encontrado.');
    return;
  }

  const list = document.getElementById('productList');

  list.innerHTML = `
    <div class="card">

      <div class="section-title">
        <h2>Editar produto</h2>
      </div>

      <div style="display:grid;gap:12px">

        <input
          id="editProductName"
          class="search"
          value="${produto.nome || ''}"
          placeholder="Nome do produto"
        >

        <input
          id="editProductCategory"
          class="search"
          value="${produto.categoria || ''}"
          placeholder="Categoria"
        >

        <input
          id="editProductUnit"
          class="search"
          value="${produto.unidade || ''}"
          placeholder="Unidade"
        >

        <input
          id="editProductPrice"
          class="search"
          type="number"
          step="0.01"
          value="${produto.preco ?? ''}"
          placeholder="Preço"
        >

        <input
          id="editProductStock"
          class="search"
          type="number"
          step="0.01"
          value="${produto.estoque ?? ''}"
          placeholder="Estoque"
        >

        <input
          id="editProductMinStock"
          class="search"
          type="number"
          step="0.01"
          value="${produto.estoque_minimo ?? ''}"
          placeholder="Estoque mínimo"
        >

        <div class="row">

          <button
            class="secondary"
            onclick="renderProducts(document.getElementById('content'))"
          >
            Cancelar
          </button>

          <button
            class="primary"
            onclick="saveProductEdit(${produto.id})"
          >
            Salvar alterações
          </button>

        </div>

      </div>

    </div>
  `;
}


async function saveProductEdit(id){

  const nome = document.getElementById('editProductName').value.trim();
  const categoria = document.getElementById('editProductCategory').value.trim();
  const unidade = document.getElementById('editProductUnit').value.trim();

  const preco = Number(
    document.getElementById('editProductPrice').value
  );

  const estoque = Number(
    document.getElementById('editProductStock').value
  );

  const estoque_minimo = Number(
    document.getElementById('editProductMinStock').value
  );

  if(!nome){
    alert('Informe o nome do produto.');
    return;
  }

  if(!categoria){
    alert('Informe a categoria do produto.');
    return;
  }

  if(!unidade){
    alert('Informe a unidade do produto.');
    return;
  }

  if(isNaN(preco) || preco < 0){
    alert('Informe um preço válido.');
    return;
  }

  if(isNaN(estoque) || estoque < 0){
    alert('Informe um estoque válido.');
    return;
  }

  if(isNaN(estoque_minimo) || estoque_minimo < 0){
    alert('Informe um estoque mínimo válido.');
    return;
  }

  const { data, error } = await supabaseClient
    .from('produtos')
    .update({
      nome: nome,
      categoria: categoria,
      unidade: unidade,
      preco: preco,
      estoque: estoque,
      estoque_minimo: estoque_minimo
    })
    .eq('id', id)
    .select()
    .single();

  if(error){

    console.error('ERRO AO ATUALIZAR PRODUTO:', error);

    alert(
      'Não foi possível atualizar o produto:\n\n' +
      error.message
    );

    return;
  }

  console.log('PRODUTO ATUALIZADO:', data);

  alert('Produto atualizado com sucesso!');

  renderProducts(
    document.getElementById('content')
  );
}
function filterProducts(){

  const input = document.getElementById('productSearch');
  const list = document.getElementById('productList');

  if(!input || !list) return;

  const busca = input.value
    .trim()
    .toLowerCase();

  const produtos = window.currentProducts || [];

  const filtrados = produtos.filter(p =>
    String(p.nome || '')
      .toLowerCase()
      .includes(busca)
  );

  list.innerHTML = filtrados.length
    ? productRows(filtrados)
    : `
      <div class="card">
        <strong>Nenhum produto encontrado</strong>
        <p class="muted">
          Não encontramos nenhum material com "${input.value}".
        </p>
      </div>
    `;
}
async function renderDeliveries(el){

  el.innerHTML = `
    <div class="card">
      <strong>Fila de entregas</strong>
      <p class="muted">
        Carregando entregas...
      </p>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from('entregas')
    .select(`
      id,
      venda_id,
      prioridade,
      posicao_fila,
      status,
      endereço,
      entregador_id,
      vendas (
        id,
        valor_total,
        forma_pagamento,
        status,
        clientes (
          nome,
          telefone,
          endereço
        )
      )
    `)
    .order('posicao_fila', { ascending: true });

  if(error){

    console.error(
      'ERRO AO CARREGAR ENTREGAS:',
      error
    );

    el.innerHTML = `
      <div class="card">
        <strong>Erro ao carregar entregas</strong>
        <p class="muted">
          ${error.message}
        </p>
      </div>
    `;

    return;
  }

  if(!data || data.length === 0){

    el.innerHTML = `
      <div class="card">
        <strong>Nenhuma entrega na fila</strong>
        <p class="muted">
          As entregas aparecerão aqui quando forem criadas.
        </p>
      </div>
    `;

    return;
  }

  el.innerHTML = `
    <div class="card">
      <strong>Fila de entregas</strong>
      <p class="muted">
        ${data.length} entrega(s) na fila.
      </p>
    </div>

    <div class="list" style="margin-top:12px">

      ${data.map((d, i) => {

        const venda = d.vendas;
        const cliente = venda?.clientes;

        const endereco =
          d.endereço ||
          cliente?.endereço ||
          'Endereço não informado';

        const nomeCliente =
          cliente?.nome ||
          'Cliente não informado';

        const telefone =
          cliente?.telefone ||
          'Sem telefone';

        const valor =
          Number(venda?.valor_total || 0);

        return `

          <div class="card">

            <div class="row">
              <strong>
                #${d.id} · ${nomeCliente}
              </strong>

              <span class="badge ${d.status}">
                ${d.status}
              </span>
            </div>

            <p class="muted">
              📍 ${endereco}
            </p>

            <p class="muted">
              ☎ ${telefone}
            </p>

            <div class="row">
              <span>
                ${money(valor)}
              </span>

              <span class="muted">
                ${venda?.forma_pagamento || ''}
              </span>
            </div>

            <div class="actions">

            ${d.status !== 'entregue' ? `

  ${i > 0 ? `
    <button
      class="secondary"
      onclick="moveDelivery(${d.id},-1)"
    >
      ↑ Colocar na frente
    </button>
  ` : ''}

  ${i < data.length - 1 ? `
    <button
      class="secondary"
      onclick="moveDelivery(${d.id},1)"
    >
      ↓
    </button>
  ` : ''}

` : ''}

              ${d.status !== 'entregue' ? `
                <button
                  class="primary"
                  onclick="nextDelivery(${d.id})"
                >
                  ${d.status === 'pendente'
                    ? 'Iniciar rota'
                    : 'Marcar entregue'}
                </button>
              ` : ''}

            </div>

          </div>

        `;

      }).join('')}

    </div>
  `;
}
async function moveDelivery(id, direction){

  const { data, error } = await supabaseClient
    .from('entregas')
    .select('id, posicao_fila, prioridade, status')
    .neq('status', 'entregue')
    .order('posicao_fila', { ascending: true });

  if(error){

    console.error(
      'ERRO AO CARREGAR FILA:',
      error
    );

    alert(
      'Não foi possível organizar a fila:\n\n' +
      error.message
    );

    return;
  }

  if(!data || data.length < 2){
    return;
  }

  const index = data.findIndex(
    entrega => Number(entrega.id) === Number(id)
  );

  if(index === -1){

 console.log(
  'ID RECEBIDO:',
  id,
  'IDS ENCONTRADOS:',
  data.map(entrega => entrega.id)
);

  alert(
    'Entrega não encontrada na fila.\n\n' +
    'ID recebido: ' + id
  );

  return;
}
  const newIndex = index + direction;

  if(newIndex < 0 || newIndex >= data.length){
    return;
  }

  const atual = data[index];
  const destino = data[newIndex];

  const posicaoAtual = atual.posicao_fila;
  const posicaoDestino = destino.posicao_fila;

  const { error: errorTemp } =
    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: -1
      })
      .eq('id', atual.id);

  if(errorTemp){

    console.error(
      'ERRO AO mover entrega:',
      errorTemp
    );

    alert(
      'Não foi possível mover a entrega:\n\n' +
      errorTemp.message
    );

    return;
  }

  const { error: errorDestino } =
    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: posicaoAtual
      })
      .eq('id', destino.id);

  console.log('MOVIMENTAÇÃO:', {
  atual: atual.id,
  destino: destino.id,
  posicaoAtual: posicaoAtual,
  posicaoDestino: posicaoDestino,
  erro: errorDestino
});
  
  if(errorDestino){

    console.error(
      'ERRO AO atualizar posição:',
      errorDestino
    );

    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: posicaoAtual
      })
      .eq('id', atual.id);

    alert(
      'Não foi possível reorganizar a fila:\n\n' +
      errorDestino.message
    );

    return;
  }

  const { error: errorAtual } =
    await supabaseClient
      .from('entregas')
      .update({
        posicao_fila: posicaoDestino
      })
      .eq('id', atual.id);

  if(errorAtual){

    console.error(
      'ERRO AO finalizar movimentação:',
      errorAtual
    );

    alert(
      'A fila pode não ter sido atualizada corretamente.'
    );

    return;
  }

await renderDeliveries(
  document.getElementById('content')
);
}

async function nextDelivery(id){

  const { data, error } = await supabaseClient
    .from('entregas')
    .select('id, status, posicao_fila')
    .eq('id', id)
    .single();

  if(error){

    console.error(
      'ERRO AO BUSCAR ENTREGA:',
      error
    );

    alert(
      'Não foi possível carregar a entrega:\n\n' +
      error.message
    );

    return;
  }

  if(!data){
    alert('Entrega não encontrada.');
    return;
  }

  let novoStatus = data.status;

  if(data.status === 'pendente'){
    novoStatus = 'em_rota';
  }
  else if(data.status === 'em_rota'){
    novoStatus = 'entregue';
  }
  else {
    return;
  }

  const atualizacao = {
    status: novoStatus
  };

  if(novoStatus === 'entregue'){
    atualizacao.posicao_fila = -1;
  }

  const { error: updateError } =
    await supabaseClient
      .from('entregas')
      .update(atualizacao)
      .eq('id', id);

  if(updateError){

    console.error(
      'ERRO AO ATUALIZAR ENTREGA:',
      updateError
    );

    alert(
      'Não foi possível atualizar a entrega:\n\n' +
      updateError.message
    );

    return;
  }

  await renderDeliveries(
    document.getElementById('content')
  );
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

      <input
        id="clientSearch"
        class="search"
        placeholder="Buscar cliente..."
        oninput="filterClients()"
      >

      <button
        class="primary"
        onclick="openClientForm()"
      >
        + Cliente
      </button>

    </div>

    <div id="clientsList" class="list">
      <div class="card muted">
        Carregando clientes...
      </div>
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
        <p class="muted">
          ${error.message}
        </p>
      </div>
    `;

    return;
  }

  window.currentClients = data || [];

  if(!data || data.length === 0){

    list.innerHTML = `
      <div class="card">
        <strong>Nenhum cliente cadastrado</strong>
        <p class="muted">
          Clique em "+ Cliente" para cadastrar.
        </p>
      </div>
    `;

    return;
  }

  list.innerHTML = data.map(c => `
    <div class="card">
      <div class="product-name">
        ${c.nome || 'Sem nome'}
      </div>

      <div class="muted">
        ${c.telefone || 'Sem telefone'}
      </div>

      <div class="muted">
        ${c.endereço || 'Sem endereço'}
      </div>
    </div>
  `).join('');
}

function filterClients(){

  const input = document.getElementById('clientSearch');
  const list = document.getElementById('clientsList');

  if(!input || !list) return;

  const busca = input.value
    .trim()
    .toLowerCase();

  const clientes = window.currentClients || [];

  const filtrados = clientes.filter(c =>
    String(c.nome || '')
      .toLowerCase()
      .includes(busca) ||

    String(c.telefone || '')
      .toLowerCase()
      .includes(busca)
  );

  list.innerHTML = filtrados.length
    ? filtrados.map(c => `
        <div class="card">

          <div class="product-name">
            ${c.nome || 'Sem nome'}
          </div>

          <div class="muted">
            ${c.telefone || 'Sem telefone'}
          </div>

          <div class="muted">
            ${c.endereço || 'Sem endereço'}
          </div>

        </div>
      `).join('')

    : `
        <div class="card">
          <strong>Nenhum cliente encontrado</strong>
          <p class="muted">
            Não encontramos nenhum cliente com "${input.value}".
          </p>
        </div>
      `;
}
async function saveClient(){

  const nome = document.getElementById('clientName')?.value.trim();
  const telefone = document.getElementById('clientPhone')?.value.trim();
  const endereco = document.getElementById('clientAddress')?.value.trim();

  if(!nome){

    alert('Informe o nome do cliente.');
    return;
  }

  const { error } = await supabaseClient
    .from('clientes')
    .insert({
      nome: nome,
      telefone: telefone || null,
      endereço: endereco || null
    });

  if(error){

    console.error(
      'ERRO AO CADASTRAR CLIENTE:',
      error
    );

    alert(
      'Não foi possível cadastrar o cliente:\n\n' +
      error.message
    );

    return;
  }

  alert('Cliente cadastrado com sucesso!');

  await renderClients(
    document.getElementById('content')
  );
}
